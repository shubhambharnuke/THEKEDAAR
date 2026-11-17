import os
import json
import time
import logging
from typing import Dict, Any
from web3 import Web3
from .indexer import IndexerDatabase

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("blockchain.indexer")

class BlockchainEventListener:
    def __init__(self, rpc_url: str, db_path: str, abi_dir: str):
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.db = IndexerDatabase(db_path)
        self.abi_dir = abi_dir
        self.contracts = {}
        self._load_contracts()

    def _load_contracts(self):
        deployments_path = os.path.join(self.abi_dir, "deployments.json")
        if not os.path.exists(deployments_path):
            logger.warning(f"No deployments.json found at {deployments_path}")
            return

        with open(deployments_path, "r") as f:
            deployments = json.load(f)

        contract_addresses = deployments.get("contracts", {})
        for name, address in contract_addresses.items():
            abi_file = os.path.join(self.abi_dir, f"{name}.json")
            if os.path.exists(abi_file):
                with open(abi_file, "r") as af:
                    artifact = json.load(af)
                    abi = artifact.get("abi", artifact)
                    self.contracts[name] = self.w3.eth.contract(address=Web3.to_checksum_address(address), abi=abi)
                    logger.info(f"Loaded contract {name} at {address}")

    def process_blocks(self, from_block: int, to_block: int):
        logger.info(f"Scanning blocks {from_block} to {to_block}...")

        # 1. Process ResourceRegistry events
        if "ResourceRegistry" in self.contracts:
            rr = self.contracts["ResourceRegistry"]
            self._process_resource_events(rr, from_block, to_block)

        # 2. Process BookingManager events
        if "BookingManager" in self.contracts:
            bm = self.contracts["BookingManager"]
            self._process_booking_events(bm, from_block, to_block)

        # 3. Process ApprovalManager events
        if "ApprovalManager" in self.contracts:
            am = self.contracts["ApprovalManager"]
            self._process_approval_events(am, from_block, to_block)

        self.db.update_last_processed_block(to_block)

    def _process_resource_events(self, contract, from_block: int, to_block: int):
        try:
            reg_filter = contract.events.ResourceRegistered.create_filter(from_block=from_block, to_block=to_block)
            for event in reg_filter.get_all_entries():
                tx_hash = event['transactionHash'].hex()
                log_idx = event['logIndex']
                if self.db.is_event_processed(tx_hash, log_idx):
                    continue
                args = event['args']
                self.db.sync_resource_registered(
                    resource_id=args['resourceId'],
                    name=args['name'],
                    department_id=args['departmentId'],
                    metadata_hash=args['metadataHash']
                )
                self.db.record_processed_event(tx_hash, log_idx, "ResourceRegistered", contract.address, event['blockNumber'])
        except Exception as e:
            logger.error(f"Error processing ResourceRegistered events: {e}")

        try:
            deact_filter = contract.events.ResourceDeactivated.create_filter(from_block=from_block, to_block=to_block)
            for event in deact_filter.get_all_entries():
                tx_hash = event['transactionHash'].hex()
                log_idx = event['logIndex']
                if self.db.is_event_processed(tx_hash, log_idx):
                    continue
                args = event['args']
                self.db.sync_resource_status(resource_id=args['resourceId'], is_active=False)
                self.db.record_processed_event(tx_hash, log_idx, "ResourceDeactivated", contract.address, event['blockNumber'])
        except Exception as e:
            logger.error(f"Error processing ResourceDeactivated events: {e}")

    def _process_booking_events(self, contract, from_block: int, to_block: int):
        try:
            req_filter = contract.events.BookingRequested.create_filter(from_block=from_block, to_block=to_block)
            for event in req_filter.get_all_entries():
                tx_hash = event['transactionHash'].hex()
                log_idx = event['logIndex']
                if self.db.is_event_processed(tx_hash, log_idx):
                    continue
                args = event['args']
                self.db.sync_booking_requested(
                    booking_id=args['bookingId'],
                    resource_id=args['resourceId'],
                    requester=args['requester'],
                    start_time=args['startTime'],
                    end_time=args['endTime'],
                    metadata_hash=args['metadataHash'],
                    tx_hash=tx_hash,
                    block_number=event['blockNumber']
                )
                self.db.record_processed_event(tx_hash, log_idx, "BookingRequested", contract.address, event['blockNumber'])
        except Exception as e:
            logger.error(f"Error processing BookingRequested events: {e}")

        # Status update events
        event_status_map = {
            "BookingConfirmed": "CONFIRMED",
            "BookingRejected": "REJECTED",
            "BookingCancelled": "CANCELLED",
            "BookingExpired": "EXPIRED",
            "BookingCompleted": "COMPLETED"
        }

        for ev_name, status in event_status_map.items():
            try:
                ev_attr = getattr(contract.events, ev_name, None)
                if ev_attr:
                    ev_filter = ev_attr.create_filter(from_block=from_block, to_block=to_block)
                    for event in ev_filter.get_all_entries():
                        tx_hash = event['transactionHash'].hex()
                        log_idx = event['logIndex']
                        if self.db.is_event_processed(tx_hash, log_idx):
                            continue
                        args = event['args']
                        self.db.sync_booking_status(booking_id=args['bookingId'], status=status)
                        self.db.record_processed_event(tx_hash, log_idx, ev_name, contract.address, event['blockNumber'])
            except Exception as e:
                logger.error(f"Error processing {ev_name} events: {e}")

    def _process_approval_events(self, contract, from_block: int, to_block: int):
        try:
            app_filter = contract.events.ApprovalRecorded.create_filter(from_block=from_block, to_block=to_block)
            for event in app_filter.get_all_entries():
                tx_hash = event['transactionHash'].hex()
                log_idx = event['logIndex']
                if self.db.is_event_processed(tx_hash, log_idx):
                    continue
                args = event['args']
                stage_name = "DEPARTMENT" if args['stage'] == 0 else "CENTRAL"
                self.db.sync_approval_decision(
                    booking_id=args['bookingId'],
                    stage=stage_name,
                    authority=args['authority'],
                    is_approved=True,
                    comments=args['comments']
                )
                self.db.record_processed_event(tx_hash, log_idx, "ApprovalRecorded", contract.address, event['blockNumber'])
        except Exception as e:
            logger.error(f"Error processing ApprovalRecorded events: {e}")

    def run_sync_cycle(self):
        if not self.w3.is_connected():
            logger.warning("Web3 provider not connected. Skipping cycle.")
            return

        current_block = self.w3.eth.block_number
        last_block = self.db.get_last_processed_block()

        if current_block > last_block:
            self.process_blocks(last_block + 1, current_block)

    def rebuild_database(self):
        """
        Reconstructs the read database by replaying all contract events from block 0.
        """
        logger.info("Executing database rebuild from block 0...")
        if not self.w3.is_connected():
            logger.error("Cannot rebuild: RPC not connected")
            return

        current_block = self.w3.eth.block_number
        self.process_blocks(0, current_block)
        logger.info(f"Database successfully reconstructed up to block {current_block}.")
