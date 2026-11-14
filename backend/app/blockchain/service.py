"""Web3.py Client, Transaction Dispatcher, and Sepolia On-Chain Verification Service"""

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

from web3 import Web3
from web3.exceptions import TransactionNotFound, ContractLogicError
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.database.models import (
    BlockchainRecord,
    BlockchainTxStatus,
    PermissionLetter,
)

logger = logging.getLogger("thekedar.blockchain")

ARTIFACT_PATH = Path(__file__).resolve().parent / "artifacts" / "DocumentRegistry.json"


def _load_contract_metadata() -> Tuple[str, list]:
    """Load contract address and ABI from compiled deployment artifact."""
    if ARTIFACT_PATH.exists():
        try:
            with open(ARTIFACT_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                addr = data.get("address") or settings.DOCUMENT_REGISTRY_ADDRESS
                abi = data.get("abi", [])
                return addr, abi
        except Exception as e:
            logger.warning("Could not read contract artifact: %s", e)

    return settings.DOCUMENT_REGISTRY_ADDRESS, []


class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(settings.SEPOLIA_RPC_URL, request_kwargs={"timeout": 2}))
        self.contract_address, self.contract_abi = _load_contract_metadata()
        if self.contract_address and self.contract_abi:
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=self.contract_abi,
            )
        else:
            self.contract = None

    def is_connected(self) -> bool:
        """Check if connection to Ethereum Sepolia RPC is active."""
        try:
            return self.w3.is_connected()
        except Exception:
            return False

    def submit_document_hash(
        self,
        db: Session,
        permission_letter_id: str,
        doc_hash_hex: str,
        doc_id: str,
        version: int,
    ) -> BlockchainRecord:
        """
        Submits document SHA-256 hash to the on-chain DocumentRegistry contract.
        Records a PENDING entry in blockchain_records.
        """
        # Ensure bytes32 format
        if doc_hash_hex.startswith("0x"):
            doc_hash_bytes = bytes.fromhex(doc_hash_hex[2:])
        else:
            doc_hash_bytes = bytes.fromhex(doc_hash_hex)

        tx_hash_str = None
        record_status = BlockchainTxStatus.PENDING
        err_msg = None

        if settings.SIGNER_PRIVATE_KEY and self.contract and self.is_connected():
            try:
                account = self.w3.eth.account.from_key(settings.SIGNER_PRIVATE_KEY)
                nonce = self.w3.eth.get_transaction_count(account.address)

                txn = self.contract.functions.recordDocument(
                    doc_hash_bytes,
                    doc_id,
                    version,
                ).build_transaction({
                    "from": account.address,
                    "nonce": nonce,
                    "chainId": settings.BLOCKCHAIN_CHAIN_ID,
                    "gasPrice": self.w3.eth.gas_price,
                })

                signed_txn = self.w3.eth.account.sign_transaction(txn, private_key=settings.SIGNER_PRIVATE_KEY)
                tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
                tx_hash_str = tx_hash.hex()
                logger.info("Submitted document hash to Sepolia: tx=%s", tx_hash_str)
            except Exception as e:
                logger.error("Failed to submit on-chain transaction: %s", e)
                record_status = BlockchainTxStatus.FAILED
                err_msg = str(e)
        else:
            record_status = BlockchainTxStatus.FAILED
            tx_hash_str = None
            if not settings.SIGNER_PRIVATE_KEY:
                err_msg = "Blockchain transaction not submitted: SIGNER_PRIVATE_KEY is not configured"
            elif not self.contract:
                err_msg = "Blockchain transaction not submitted: DocumentRegistry contract is not loaded"
            else:
                err_msg = "Blockchain transaction not submitted: Unable to connect to Ethereum Sepolia RPC"
            logger.warning("Blockchain registration: %s", err_msg)

        record = BlockchainRecord(
            permission_letter_id=permission_letter_id,
            tx_hash=tx_hash_str,
            contract_address=self.contract_address,
            status=record_status,
            error_message=err_msg,
            confirmed_at=None,
        )
        db.add(record)
        db.flush()
        return record

    def check_transaction_confirmation(
        self,
        db: Session,
        record_id: int,
    ) -> BlockchainRecord:
        """
        Check transaction receipt status for a pending blockchain record.
        """
        record = db.scalar(
            select(BlockchainRecord).where(BlockchainRecord.id == record_id)
        )
        if not record:
            raise ValueError(f"BlockchainRecord {record_id} not found")

        if not record.tx_hash:
            return record

        if record.status == BlockchainTxStatus.CONFIRMED:
            return record

        try:
            receipt = self.w3.eth.get_transaction_receipt(record.tx_hash)
            if receipt:
                if receipt.status == 1:
                    record.status = BlockchainTxStatus.CONFIRMED
                    record.block_number = receipt.blockNumber
                    record.confirmed_at = datetime.now(timezone.utc)
                else:
                    record.status = BlockchainTxStatus.FAILED
                    record.error_message = "Transaction reverted by EVM on-chain"
                db.flush()
        except TransactionNotFound:
            pass  # Still pending in mempool
        except Exception as e:
            logger.warning("Error fetching tx receipt for %s: %s", record.tx_hash, e)

        return record

    def verify_on_chain_hash(self, doc_hash_hex: str) -> Dict[str, Any]:
        """
        Query DocumentRegistry on-chain state directly via Web3 view function.
        """
        if doc_hash_hex.startswith("0x"):
            doc_hash_bytes = bytes.fromhex(doc_hash_hex[2:])
        else:
            doc_hash_bytes = bytes.fromhex(doc_hash_hex)

        if not self.contract or not self.is_connected():
            return {
                "verified_on_chain": False,
                "network": "Ethereum Sepolia (Offline/Unreachable)",
                "contract_address": self.contract_address,
                "details": None,
                "message": "Blockchain RPC is currently unreachable or not configured",
            }

        try:
            doc_record = self.contract.functions.getDocument(doc_hash_bytes).call()
            # doc_record returns (documentHash, documentId, version, issuer, timestamp, isRevoked)
            return {
                "verified_on_chain": True,
                "network": "Ethereum Sepolia",
                "contract_address": self.contract_address,
                "details": {
                    "document_hash": "0x" + doc_record[0].hex(),
                    "document_id": doc_record[1],
                    "version": doc_record[2],
                    "issuer_address": doc_record[3],
                    "block_timestamp": datetime.fromtimestamp(doc_record[4], timezone.utc).isoformat(),
                    "is_revoked": doc_record[5],
                },
                "message": "Document hash successfully verified on Ethereum Sepolia ledger.",
            }
        except (ContractLogicError, Exception) as e:
            return {
                "verified_on_chain": False,
                "network": "Ethereum Sepolia",
                "contract_address": self.contract_address,
                "details": None,
                "message": f"Document hash not registered or error querying contract: {str(e)}",
            }


blockchain_service = BlockchainService()
