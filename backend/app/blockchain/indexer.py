import sqlite3
import os
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("indexer.db")

class IndexerDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_indexer_tables()

    def get_connection(self):
        con = sqlite3.connect(self.db_path)
        con.execute("PRAGMA foreign_keys = ON;")
        return con

    def _init_indexer_tables(self):
        with self.get_connection() as con:
            cur = con.cursor()
            # Indexer state tracking table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS indexer_state (
                    id INTEGER PRIMARY KEY,
                    last_processed_block INTEGER NOT NULL DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            """)
            # Processed events log to enforce strict idempotency (txHash, logIndex)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS processed_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tx_hash VARCHAR(66) NOT NULL,
                    log_index INTEGER NOT NULL,
                    event_name VARCHAR(100) NOT NULL,
                    contract_address VARCHAR(42) NOT NULL,
                    block_number INTEGER NOT NULL,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(tx_hash, log_index)
                );
            """)
            # Ensure indexer_state has at least 1 row
            cur.execute("INSERT OR IGNORE INTO indexer_state (id, last_processed_block) VALUES (1, 0);")
            con.commit()

    def get_last_processed_block(self) -> int:
        with self.get_connection() as con:
            cur = con.cursor()
            cur.execute("SELECT last_processed_block FROM indexer_state WHERE id = 1;")
            row = cur.fetchone()
            return row[0] if row else 0

    def update_last_processed_block(self, block_number: int):
        with self.get_connection() as con:
            cur = con.cursor()
            cur.execute("UPDATE indexer_state SET last_processed_block = ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1;", (block_number,))
            con.commit()

    def is_event_processed(self, tx_hash: str, log_index: int) -> bool:
        with self.get_connection() as con:
            cur = con.cursor()
            cur.execute("SELECT 1 FROM processed_events WHERE tx_hash = ? AND log_index = ?;", (tx_hash, log_index))
            return cur.fetchone() is not None

    def record_processed_event(self, tx_hash: str, log_index: int, event_name: str, contract_address: str, block_number: int):
        with self.get_connection() as con:
            cur = con.cursor()
            cur.execute("""
                INSERT OR IGNORE INTO processed_events (tx_hash, log_index, event_name, contract_address, block_number)
                VALUES (?, ?, ?, ?, ?);
            """, (tx_hash, log_index, event_name, contract_address, block_number))
            con.commit()

    # --- Sync Methods to Read Models ---

    def sync_resource_registered(self, resource_id: int, name: str, department_id: int, metadata_hash: str):
        with self.get_connection() as con:
            cur = con.cursor()
            code = f"RES-{resource_id:03d}"
            cur.execute("""
                INSERT INTO resources (id, department_id, name, code, resource_type, location, capacity, equipment_spec, is_active)
                VALUES (?, ?, ?, ?, 'VENUE', 'Main Campus', 100, ?, 1)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    department_id = excluded.department_id,
                    equipment_spec = excluded.equipment_spec,
                    is_active = 1;
            """, (resource_id, department_id, name, code, metadata_hash))
            con.commit()
            logger.info(f"Indexed ResourceRegistered: id={resource_id}, name={name}, dept={department_id}")

    def sync_resource_status(self, resource_id: int, is_active: bool):
        with self.get_connection() as con:
            cur = con.cursor()
            cur.execute("UPDATE resources SET is_active = ? WHERE id = ?;", (1 if is_active else 0, resource_id))
            con.commit()
            logger.info(f"Indexed ResourceStatus: id={resource_id}, is_active={is_active}")

    def sync_booking_requested(self, booking_id: int, resource_id: int, requester: str, start_time: int, end_time: int, metadata_hash: str, tx_hash: str, block_number: int):
        with self.get_connection() as con:
            cur = con.cursor()
            # Map start_time and end_time epoch seconds to ISO string
            from datetime import datetime, timezone
            start_iso = datetime.fromtimestamp(start_time, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
            end_iso = datetime.fromtimestamp(end_time, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S')

            # Upsert into resource_bookings
            cur.execute("""
                INSERT INTO resource_bookings (id, department_request_id, resource_id, start_time, end_time, status)
                VALUES (?, 1, ?, ?, ?, 'PENDING')
                ON CONFLICT(id) DO UPDATE SET
                    resource_id = excluded.resource_id,
                    start_time = excluded.start_time,
                    end_time = excluded.end_time,
                    status = 'PENDING';
            """, (booking_id, resource_id, start_iso, end_iso))
            con.commit()
            logger.info(f"Indexed BookingRequested: id={booking_id}, resource={resource_id}, window=[{start_iso} to {end_iso})")

    def sync_booking_status(self, booking_id: int, status: str):
        with self.get_connection() as con:
            cur = con.cursor()
            cur.execute("UPDATE resource_bookings SET status = ? WHERE id = ?;", (status, booking_id))
            con.commit()
            logger.info(f"Indexed BookingStatus: id={booking_id}, status={status}")

    def sync_approval_decision(self, booking_id: int, stage: str, authority: str, is_approved: bool, comments: str):
        with self.get_connection() as con:
            cur = con.cursor()
            action = "APPROVED" if is_approved else "REJECTED"
            # Record into decision_history
            cur.execute("""
                INSERT INTO decision_history (department_request_id, authority_user_id, action, comments)
                VALUES (?, 1, ?, ?);
            """, (booking_id, action, f"[{stage}] by {authority}: {comments}"))
            con.commit()
            logger.info(f"Indexed ApprovalDecision: booking={booking_id}, stage={stage}, action={action}")
