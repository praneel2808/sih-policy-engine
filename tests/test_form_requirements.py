"""
Comprehensive Unit Tests for Form Requirements Schema, Pydantic Validation,
Multi-Source Provenance, Idempotency, and Rule-Form Linkage.

Covers:
1. form_requirements table schema & constraints
2. Foreign-key relationships (canonical_rule_id, rule_id, document_id, chunk_id)
3. Pydantic Gemini response validation
4. Empty form result handling (forms: [])
5. Multiple form references in one chunk
6. Idempotent insertion (running twice creates no duplicate rows)
7. Provenance & evidence preservation
8. Rule status & form tracking updates
"""

import json
import sqlite3
import pytest
from pydantic import ValidationError

from src.gemini_form_extract import (
    FormRequirementDetail,
    ChunkFormExtractionResult,
    GeminiFormExtractor
)
from src.form_migration import migrate_form_requirements_schema
from src.rule_migration import migrate_rule_layer
from src.database import DatabaseManager


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def test_db(tmp_path):
    """Initializes a clean SQLite database with full policy engine schema."""
    db_file = str(tmp_path / "test_form_policy.db")
    conn = sqlite3.connect(db_file)
    
    # Base tables
    conn.execute("""
    CREATE TABLE documents (
        document_id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        source_url TEXT
    );
    """)
    conn.execute("""
    CREATE TABLE source_chunks (
        chunk_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        page_start INTEGER,
        page_end INTEGER,
        verbatim_text TEXT
    );
    """)
    conn.execute("""
    CREATE TABLE candidate_rules (
        rule_id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id TEXT NOT NULL,
        chunk_id TEXT NOT NULL,
        rule_name TEXT NOT NULL,
        policy_sector TEXT NOT NULL,
        eligibility_criteria_json TEXT NOT NULL,
        incentive_details_json TEXT NOT NULL,
        effective_date TEXT,
        expiry_date TEXT,
        supersedes_clause_detected INTEGER DEFAULT 0,
        raw_llm_response TEXT,
        pydantic_validated INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Seed data
    conn.execute("INSERT INTO documents VALUES ('doc_101', 'Industrial_Policy_2024.pdf', 'https://maitri.gov.in/policy2024')")
    conn.execute("INSERT INTO source_chunks VALUES ('chunk_555', 'doc_101', 12, 13, 'Units shall apply in Form-A along with Annexure-I declaration to DIC.')")
    
    conn.execute("""
    INSERT INTO candidate_rules (rule_id, document_id, chunk_id, rule_name, policy_sector, eligibility_criteria_json, incentive_details_json)
    VALUES (42, 'doc_101', 'chunk_555', 'Electricity Duty Exemption', 'IT/ITES', '{}', '[]')
    """)

    conn.commit()
    conn.close()

    # Apply migrations
    migrate_rule_layer(db_file)
    migrate_form_requirements_schema(db_file)

    # Seed canonical rule
    conn = sqlite3.connect(db_file)
    conn.execute("""
    INSERT INTO canonical_rules (canonical_rule_id, rule_name, policy_sector, normalized_name, eligibility_criteria_json, incentive_details_json, primary_rule_id)
    VALUES ('CANON-0042', 'Electricity Duty Exemption', 'IT/ITES', 'electricity duty exemption', '{}', '[]', 42)
    """)
    conn.execute("UPDATE candidate_rules SET canonical_rule_id = 'CANON-0042' WHERE rule_id = 42")
    conn.commit()
    conn.close()

    return db_file


# ---------------------------------------------------------------------------
# Test Cases
# ---------------------------------------------------------------------------

def test_1_pydantic_form_validation():
    """Test 1: Valid form detail parses and validates strictly."""
    form_data = {
        "chunk_id": "chunk_555",
        "associated_rule_id": 42,
        "form_name": "Application for Common Consent to Establish (CTE)",
        "form_number": "Form I",
        "form_type": "APPLICATION_FORM",
        "required": True,
        "condition": "Prior to starting industrial construction",
        "applicant_scope": "All manufacturing units",
        "submission_method": "ONLINE_PORTAL",
        "reference_type": "STATUTORY_PRESCRIBED",
        "evidence_text": "Units shall apply in Form-A along with Annexure-I declaration to DIC.",
        "confidence": 0.98
    }
    obj = FormRequirementDetail.model_validate(form_data)
    assert obj.form_name == "Application for Common Consent to Establish (CTE)"
    assert obj.form_number == "Form I"
    assert obj.required is True
    assert obj.confidence == 0.98


def test_2_pydantic_empty_form_result():
    """Test 2: Result cleanly handles chunks without form requirements (forms: [])."""
    raw_json = '{"forms": []}'
    result = ChunkFormExtractionResult.model_validate_json(raw_json)
    assert len(result.forms) == 0


def test_3_multiple_forms_in_one_chunk():
    """Test 3: Result cleanly parses multiple form requirements from a single chunk."""
    raw_json = json.dumps({
        "forms": [
            {
                "chunk_id": "chunk_555",
                "associated_rule_id": 42,
                "form_name": "Application for Subsidy",
                "form_number": "Form-A",
                "form_type": "APPLICATION_FORM",
                "required": True,
                "evidence_text": "Units shall apply in Form-A."
            },
            {
                "chunk_id": "chunk_555",
                "associated_rule_id": 42,
                "form_name": "Self-Declaration of Compliance",
                "form_number": "Annexure-I",
                "form_type": "DECLARATION",
                "required": True,
                "evidence_text": "along with Annexure-I declaration."
            }
        ]
    })
    result = ChunkFormExtractionResult.model_validate_json(raw_json)
    assert len(result.forms) == 2
    assert result.forms[0].form_number == "Form-A"
    assert result.forms[1].form_type == "DECLARATION"


def test_4_db_insertion_and_linkage(test_db):
    """Test 4: Database insertion correctly links canonical_rule_id, rule_id, document_id, and chunk_id."""
    db_mgr = DatabaseManager(db_path=test_db)
    extractor = GeminiFormExtractor(db_manager=db_mgr)

    form_detail = FormRequirementDetail(
        chunk_id="chunk_555",
        associated_rule_id=42,
        form_name="Application for Power Subsidy",
        form_number="Form-A",
        form_type="APPLICATION_FORM",
        required=True,
        condition="Within 6 months of commercial production",
        applicant_scope="MSME Units",
        submission_method="ONLINE_PORTAL",
        reference_type="STATUTORY_PRESCRIBED",
        evidence_text="Units shall apply in Form-A along with Annexure-I declaration to DIC.",
        confidence=0.95
    )

    chunk_meta = {
        "chunk_id": "chunk_555",
        "document_id": "doc_101",
        "page_start": 12,
        "page_end": 13
    }

    extractor.save_form_requirements([form_detail], chunk_meta)

    # Verify database contents
    conn = sqlite3.connect(test_db)
    cursor = conn.cursor()

    row = cursor.execute("""
        SELECT 
            canonical_rule_id, rule_id, document_id, chunk_id,
            form_name, form_number, form_type, required,
            page_start, page_end, evidence_text
        FROM form_requirements
        WHERE rule_id = 42
    """).fetchone()

    assert row is not None
    assert row[0] == "CANON-0042"  # Linked to canonical rule automatically!
    assert row[1] == 42           # Linked to candidate rule
    assert row[2] == "doc_101"    # Linked to document
    assert row[3] == "chunk_555"  # Linked to chunk
    assert row[4] == "Application for Power Subsidy"
    assert row[5] == "Form-A"
    assert row[6] == "APPLICATION_FORM"
    assert row[7] == 1            # Required boolean
    assert row[8] == 12           # page_start
    assert row[9] == 13           # page_end

    # Check candidate_rules tracking columns
    cand_row = cursor.execute("SELECT has_form_requirement, form_count FROM candidate_rules WHERE rule_id = 42").fetchone()
    assert cand_row[0] == 1
    assert cand_row[1] == 1

    # Check canonical_rules tracking columns
    canon_row = cursor.execute("SELECT has_form_requirement, form_count FROM canonical_rules WHERE canonical_rule_id = 'CANON-0042'").fetchone()
    assert canon_row[0] == 1
    assert canon_row[1] == 1

    conn.close()


def test_5_idempotent_insertion(test_db):
    """Test 5: Re-running insertion for the same chunk does NOT duplicate rows."""
    db_mgr = DatabaseManager(db_path=test_db)
    extractor = GeminiFormExtractor(db_manager=db_mgr)

    form_detail = FormRequirementDetail(
        chunk_id="chunk_555",
        associated_rule_id=42,
        form_name="Application for Power Subsidy",
        form_number="Form-A",
        form_type="APPLICATION_FORM",
        required=True,
        evidence_text="Units shall apply in Form-A."
    )
    chunk_meta = {"chunk_id": "chunk_555", "document_id": "doc_101", "page_start": 12, "page_end": 13}

    # Run twice
    extractor.save_form_requirements([form_detail], chunk_meta)
    extractor.save_form_requirements([form_detail], chunk_meta)

    conn = sqlite3.connect(test_db)
    count = conn.execute("SELECT COUNT(*) FROM form_requirements WHERE chunk_id = 'chunk_555'").fetchone()[0]
    conn.close()

    assert count == 1  # Exactly 1 row, zero duplicates!
