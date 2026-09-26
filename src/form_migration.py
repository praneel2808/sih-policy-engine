"""
Database Migration for Form Requirements Layer.
Adds form requirement tracking to candidate_rules and canonical_rules,
and creates the form_requirements table with complete multi-source provenance.
"""

import sqlite3
import logging

logger = logging.getLogger(__name__)

def migrate_form_requirements_schema(db_path: str = "db/policy_engine.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add form tracking columns to candidate_rules if not present
    existing_cand_cols = [c[1] for c in cursor.execute("PRAGMA table_info(candidate_rules)").fetchall()]
    if "has_form_requirement" not in existing_cand_cols:
        cursor.execute("ALTER TABLE candidate_rules ADD COLUMN has_form_requirement INTEGER DEFAULT 0")
        logger.info("Added has_form_requirement column to candidate_rules")
    if "form_count" not in existing_cand_cols:
        cursor.execute("ALTER TABLE candidate_rules ADD COLUMN form_count INTEGER DEFAULT 0")
        logger.info("Added form_count column to candidate_rules")

    # 2. Add form tracking columns to canonical_rules if not present
    existing_canon_cols = [c[1] for c in cursor.execute("PRAGMA table_info(canonical_rules)").fetchall()]
    if "has_form_requirement" not in existing_canon_cols:
        cursor.execute("ALTER TABLE canonical_rules ADD COLUMN has_form_requirement INTEGER DEFAULT 0")
        logger.info("Added has_form_requirement column to canonical_rules")
    if "form_count" not in existing_canon_cols:
        cursor.execute("ALTER TABLE canonical_rules ADD COLUMN form_count INTEGER DEFAULT 0")
        logger.info("Added form_count column to canonical_rules")

    # 3. Create form_requirements table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS form_requirements (
        form_requirement_id INTEGER PRIMARY KEY AUTOINCREMENT,
        canonical_rule_id TEXT,
        rule_id INTEGER,
        document_id TEXT NOT NULL,
        chunk_id TEXT NOT NULL,
        form_name TEXT NOT NULL,
        form_number TEXT,
        form_type TEXT NOT NULL,
        required INTEGER NOT NULL DEFAULT 1,
        condition TEXT,
        applicant_scope TEXT,
        submission_method TEXT,
        reference_type TEXT,
        evidence_text TEXT NOT NULL,
        page_start INTEGER,
        page_end INTEGER,
        confidence REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(canonical_rule_id) REFERENCES canonical_rules(canonical_rule_id),
        FOREIGN KEY(rule_id) REFERENCES candidate_rules(rule_id),
        FOREIGN KEY(document_id) REFERENCES documents(document_id),
        FOREIGN KEY(chunk_id) REFERENCES source_chunks(chunk_id),
        UNIQUE(chunk_id, rule_id, form_name, form_number)
    );
    """)

    # Indices for performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_form_req_canon ON form_requirements(canonical_rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_form_req_rule ON form_requirements(rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_form_req_chunk ON form_requirements(chunk_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_form_req_doc ON form_requirements(document_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_form_req_type ON form_requirements(form_type);")

    conn.commit()
    conn.close()
    logger.info("Form requirements schema migration completed successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_form_requirements_schema()
