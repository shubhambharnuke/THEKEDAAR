import os
import sys
import unittest
import gc
from backend.app.blockchain.indexer import IndexerDatabase

class TestIndexerDatabase(unittest.TestCase):
    def setUp(self):
        self.test_db = "backend/data/test_indexer.db"
        if os.path.exists(self.test_db):
            os.remove(self.test_db)
        
        # Initialize tables
        self.db = IndexerDatabase(self.test_db)
        con = self.db.get_connection()
        try:
            cur = con.cursor()
            cur.execute("""
                CREATE TABLE IF NOT EXISTS resources (
                    id INTEGER PRIMARY KEY,
                    department_id INTEGER,
                    name VARCHAR(255),
                    code VARCHAR(50),
                    resource_type VARCHAR(12),
                    location VARCHAR(255),
                    capacity INTEGER,
                    equipment_spec TEXT,
                    is_active BOOLEAN DEFAULT 1
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS resource_bookings (
                    id INTEGER PRIMARY KEY,
                    department_request_id INTEGER,
                    resource_id INTEGER,
                    start_time DATETIME,
                    end_time DATETIME,
                    status VARCHAR(9)
                );
            """)
            cur.execute("""
                CREATE TABLE IF NOT EXISTS decision_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    department_request_id INTEGER,
                    authority_user_id INTEGER,
                    action VARCHAR(10),
                    comments TEXT
                );
            """)
            con.commit()
        finally:
            con.close()

    def tearDown(self):
        self.db = None
        gc.collect()
        if os.path.exists(self.test_db):
            try:
                os.remove(self.test_db)
            except PermissionError:
                pass

    def test_idempotent_event_processing(self):
        tx_hash = "0x1234567890abcdef"
        log_idx = 0
        
        self.assertFalse(self.db.is_event_processed(tx_hash, log_idx))
        
        self.db.record_processed_event(tx_hash, log_idx, "ResourceRegistered", "0xContract", 100)
        self.assertTrue(self.db.is_event_processed(tx_hash, log_idx))
        
        # Second call must not raise duplicate error
        self.db.record_processed_event(tx_hash, log_idx, "ResourceRegistered", "0xContract", 100)
        self.assertTrue(self.db.is_event_processed(tx_hash, log_idx))

    def test_sync_resource_and_booking(self):
        self.db.sync_resource_registered(101, "Main Hall", 1, "ipfs://hash")
        con = self.db.get_connection()
        try:
            cur = con.cursor()
            cur.execute("SELECT name, is_active FROM resources WHERE id = 101;")
            row = cur.fetchone()
            self.assertEqual(row[0], "Main Hall")
            self.assertEqual(row[1], 1)
        finally:
            con.close()

        # Deactivate
        self.db.sync_resource_status(101, False)
        con = self.db.get_connection()
        try:
            cur = con.cursor()
            cur.execute("SELECT is_active FROM resources WHERE id = 101;")
            self.assertEqual(cur.fetchone()[0], 0)
        finally:
            con.close()

        # Sync booking
        start_ts = 1700000000
        end_ts = 1700003600
        self.db.sync_booking_requested(1, 101, "0xRequester", start_ts, end_ts, "ipfs://meta", "0xtx", 10)
        con = self.db.get_connection()
        try:
            cur = con.cursor()
            cur.execute("SELECT status FROM resource_bookings WHERE id = 1;")
            self.assertEqual(cur.fetchone()[0], "PENDING")
        finally:
            con.close()

        # Sync status change
        self.db.sync_booking_status(1, "CONFIRMED")
        con = self.db.get_connection()
        try:
            cur = con.cursor()
            cur.execute("SELECT status FROM resource_bookings WHERE id = 1;")
            self.assertEqual(cur.fetchone()[0], "CONFIRMED")
        finally:
            con.close()

if __name__ == "__main__":
    unittest.main()
