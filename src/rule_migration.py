"""
Database Migration for Candidate Rule Normalization and Deduplication Layer.
Non-destructive: preserves all existing data and adds canonical/relationship tables.
"""

import sqlite3
import logging
from typing import Optional

logger = logging.getLogger(__name__)

def migrate_rule_layer(db_path: str = "db/policy_engine.db"):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add canonical_rule_id and status to candidate_rules if not present
    existing_cols = [c[1] for c in cursor.execute("PRAGMA table_info(candidate_rules)").fetchall()]
    
    if "canonical_rule_id" not in existing_cols:
        cursor.execute("ALTER TABLE candidate_rules ADD COLUMN canonical_rule_id TEXT DEFAULT NULL")
        logger.info("Added canonical_rule_id column to candidate_rules")
    
    if "status" not in existing_cols:
        cursor.execute("ALTER TABLE candidate_rules ADD COLUMN status TEXT DEFAULT 'ACTIVE'")
        logger.info("Added status column to candidate_rules")

    # 2. Create canonical_rules table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS canonical_rules (
        canonical_rule_id TEXT PRIMARY KEY,
        rule_name TEXT NOT NULL,
        policy_sector TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        eligibility_criteria_json TEXT NOT NULL,
        incentive_details_json TEXT NOT NULL,
        effective_date TEXT,
        expiry_date TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        confidence REAL DEFAULT 1.0,
        source_count INTEGER DEFAULT 1,
        primary_rule_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(primary_rule_id) REFERENCES candidate_rules(rule_id)
    );
    """)

    # 3. Create canonical_rule_sources table (multi-source provenance)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS canonical_rule_sources (
        source_link_id INTEGER PRIMARY KEY AUTOINCREMENT,
        canonical_rule_id TEXT NOT NULL,
        rule_id INTEGER NOT NULL,
        document_id TEXT NOT NULL,
        chunk_id TEXT NOT NULL,
        source_url TEXT,
        filename TEXT,
        page_start INTEGER,
        page_end INTEGER,
        verbatim_snippet TEXT,
        is_primary INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(canonical_rule_id, rule_id),
        FOREIGN KEY(canonical_rule_id) REFERENCES canonical_rules(canonical_rule_id),
        FOREIGN KEY(rule_id) REFERENCES candidate_rules(rule_id),
        FOREIGN KEY(document_id) REFERENCES documents(document_id),
        FOREIGN KEY(chunk_id) REFERENCES source_chunks(chunk_id)
    );
    """)

    # 4. Create rule_relationships table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS rule_relationships (
        relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_rule_id INTEGER NOT NULL,
        target_rule_id INTEGER NOT NULL,
        relationship_type TEXT NOT NULL,
        confidence REAL NOT NULL,
        reason TEXT NOT NULL,
        comparison_details_json TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_rule_id, target_rule_id, relationship_type),
        FOREIGN KEY(source_rule_id) REFERENCES candidate_rules(rule_id),
        FOREIGN KEY(target_rule_id) REFERENCES candidate_rules(rule_id)
    );
    """)

    # Create indices for fast lookup
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_candidate_rules_canon ON candidate_rules(canonical_rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rule_sources_canon ON canonical_rule_sources(canonical_rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rule_sources_rule ON canonical_rule_sources(rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rel_source ON rule_relationships(source_rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rel_target ON rule_relationships(target_rule_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_rel_type ON rule_relationships(relationship_type);")

    conn.commit()
    conn.close()
    logger.info("Rule layer migration applied successfully.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    migrate_rule_layer()
