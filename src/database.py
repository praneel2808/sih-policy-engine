"""
Database Manager for Policy Engine SQLite Storage.
Handles schema initialization, transaction safety, and state tracking for resumability.
"""

import sqlite3
import os
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class DatabaseManager:
    def __init__(self, db_path: str = "db/policy_engine.db", schema_path: str = "db/schema.sql"):
        self.db_path = db_path
        self.schema_path = schema_path
        os.makedirs(os.path.dirname(self.db_path) or ".", exist_ok=True)

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn

    def init_db(self) -> None:
        """Initializes database schema from schema.sql."""
        if not os.path.exists(self.schema_path):
            logger.error(f"Schema file not found at {self.schema_path}")
            return
        with open(self.schema_path, "r", encoding="utf-8") as f:
            schema_sql = f.read()
        with self.get_connection() as conn:
            conn.executescript(schema_sql)
            conn.commit()
        logger.info(f"Database initialized at {self.db_path}")

    def upsert_document(self, doc: Dict[str, Any]) -> None:
        """Inserts or updates a full document record from a metadata dict."""
        cols = [
            "document_id", "filename", "title", "source_url",
            "document_type", "document_purpose", "classification_confidence",
            "department", "document_date", "effective_date",
            "page_count", "file_size", "language_profile",
            "bilingual_duplicate", "english_page_ranges", "selected_processing_pages",
            "extraction_method", "processing_status", "skip_reason", "sha256",
        ]
        placeholders = ", ".join(["?"] * len(cols))
        col_names = ", ".join(cols)
        updates = ", ".join([f"{c} = excluded.{c}" for c in cols if c != "document_id"])
        query = f"""
        INSERT INTO documents ({col_names}) VALUES ({placeholders})
        ON CONFLICT(document_id) DO UPDATE SET {updates}, processed_at = CURRENT_TIMESTAMP;
        """
        vals = []
        for c in cols:
            v = doc.get(c)
            # Serialize lists/dicts to JSON strings
            if isinstance(v, (list, dict)):
                v = json.dumps(v)
            vals.append(v)
        with self.get_connection() as conn:
            conn.execute(query, vals)
            conn.commit()

    def update_document_status(self, document_id: str, status: str, skip_reason: Optional[str] = None) -> None:
        query = "UPDATE documents SET processing_status = ?, skip_reason = ?, processed_at = CURRENT_TIMESTAMP WHERE document_id = ?"
        with self.get_connection() as conn:
            conn.execute(query, (status, skip_reason, document_id))
            conn.commit()

    def update_document_fields(self, document_id: str, fields: Dict[str, Any]) -> None:
        """Update arbitrary columns for a document."""
        sets = []
        vals = []
        for k, v in fields.items():
            sets.append(f"{k} = ?")
            if isinstance(v, (list, dict)):
                v = json.dumps(v)
            vals.append(v)
        sets.append("processed_at = CURRENT_TIMESTAMP")
        vals.append(document_id)
        query = f"UPDATE documents SET {', '.join(sets)} WHERE document_id = ?"
        with self.get_connection() as conn:
            conn.execute(query, vals)
            conn.commit()

    def get_document(self, document_id: str) -> Optional[sqlite3.Row]:
        with self.get_connection() as conn:
            return conn.execute("SELECT * FROM documents WHERE document_id = ?", (document_id,)).fetchone()

    def get_all_documents(self) -> List[sqlite3.Row]:
        with self.get_connection() as conn:
            return conn.execute("SELECT * FROM documents ORDER BY document_id").fetchall()

    def get_pending_documents(self) -> List[sqlite3.Row]:
        query = "SELECT * FROM documents WHERE processing_status = 'PENDING'"
        with self.get_connection() as conn:
            return conn.execute(query).fetchall()

    def insert_page(self, document_id: str, page_number: int, text: str,
                    extraction_method: str, character_count: int, language: str = None) -> None:
        with self.get_connection() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO document_pages
                   (document_id, page_number, text, extraction_method, character_count, language, ocr_applied)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (document_id, page_number, text, extraction_method, character_count, language,
                 1 if extraction_method == "ocr" else 0)
            )
            conn.commit()

    def get_pages(self, document_id: str) -> List[sqlite3.Row]:
        with self.get_connection() as conn:
            return conn.execute(
                "SELECT * FROM document_pages WHERE document_id = ? ORDER BY page_number",
                (document_id,)
            ).fetchall()

    def page_exists(self, document_id: str, page_number: int) -> bool:
        with self.get_connection() as conn:
            row = conn.execute(
                "SELECT 1 FROM document_pages WHERE document_id = ? AND page_number = ?",
                (document_id, page_number)
            ).fetchone()
            return row is not None

    def insert_chunk(self, chunk: Dict[str, Any]) -> None:
        with self.get_connection() as conn:
            conn.execute(
                """INSERT OR REPLACE INTO source_chunks
                   (chunk_id, document_id, page_start, page_end, section_reference, clause_reference, language, verbatim_text)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
                (chunk["chunk_id"], chunk["document_id"], chunk["page_start"], chunk["page_end"],
                 chunk.get("section_reference"), chunk.get("clause_reference"),
                 chunk.get("language"), chunk["verbatim_text"])
            )
            conn.commit()

    def get_chunks(self, document_id: str) -> List[sqlite3.Row]:
        with self.get_connection() as conn:
            return conn.execute(
                "SELECT * FROM source_chunks WHERE document_id = ? ORDER BY page_start",
                (document_id,)
            ).fetchall()

    def delete_chunks_for_doc(self, document_id: str) -> None:
        with self.get_connection() as conn:
            conn.execute("DELETE FROM source_chunks WHERE document_id = ?", (document_id,))
            conn.commit()

    def has_failed_ocr_pages(self, document_id: str) -> bool:
        with self.get_connection() as conn:
            return conn.execute(
                "SELECT 1 FROM document_pages WHERE document_id = ? AND extraction_method = 'ocr_failed' LIMIT 1",
                (document_id,)
            ).fetchone() is not None

    def clear_derived_data(self, document_id: str) -> None:
        """Remove only derived ranges/chunks when page extraction is incomplete."""
        with self.get_connection() as conn:
            conn.execute("DELETE FROM english_sections WHERE document_id = ?", (document_id,))
            conn.execute("DELETE FROM source_chunks WHERE document_id = ?", (document_id,))
            conn.commit()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    db = DatabaseManager()
    db.init_db()
