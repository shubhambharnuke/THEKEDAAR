"""Blockchain Verification & Network Status Endpoints"""

from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from backend.app.blockchain.service import blockchain_service

router = APIRouter(prefix="/blockchain", tags=["Blockchain Registry (Ethereum Sepolia)"])


class BlockchainNetworkStatus(BaseModel):
    is_connected: bool
    network_name: str
    chain_id: int
    contract_address: Optional[str] = None


@router.get("/status", response_model=BlockchainNetworkStatus)
def get_blockchain_status():
    """Check connectivity to Ethereum Sepolia RPC and deployed DocumentRegistry contract."""
    return BlockchainNetworkStatus(
        is_connected=blockchain_service.is_connected(),
        network_name="Ethereum Sepolia",
        chain_id=11155111,
        contract_address=blockchain_service.contract_address,
    )


@router.get("/verify/{document_hash}")
def verify_hash_on_chain(document_hash: str):
    """
    Directly query the deployed DocumentRegistry smart contract on Sepolia for proof-of-existence.
    Returns issuer address, block timestamp, version, and revocation status.
    """
    return blockchain_service.verify_on_chain_hash(document_hash)
