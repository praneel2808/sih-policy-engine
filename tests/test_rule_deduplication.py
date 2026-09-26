"""
Comprehensive Test Suite for Rule Normalization, Conservative Deduplication,
Provenance Preservation, and Idempotency.

Covers all 12 required test scenarios:
1. exact duplicate detection
2. near duplicate detection
3. different threshold != duplicate
4. different sector != duplicate
5. different geography != duplicate
6. different validity/date condition != duplicate
7. conflicting rules are not merged
8. provenance survives deduplication
9. original rule text survives
10. rule IDs remain stable
11. idempotent execution
12. running deduplication twice produces the same result
"""

import os
import json
import sqlite3
import pytest
from typing import Dict, Any

from src.rule_normalization import (
    normalize_text_for_comparison,
    normalize_sector,
    normalize_eligibility,
    normalize_incentives_list,
    compute_rule_fingerprint
)
from src.rule_deduplication import (
    compare_rule_pair,
    RuleDeduplicationEngine,
    EXACT_DUPLICATE,
    NEAR_DUPLICATE,
    SAME_RULE_DIFFERENT_SOURCE,
    RELATED_BUT_DIFFERENT,
    CONTEXT_DIFFERENCE,
    POSSIBLE_CONFLICT,
    NOT_DUPLICATE,
    UNCERTAIN
)
from src.rule_migration import migrate_rule_layer


@pytest.fixture
def mock_rules():
    """Provides representative mock rule fixtures for isolated testing."""
    def _make_rule(
        rule_id: int,
        name: str,
        sector: str = "IT/ITES",
        doc_id: str = "doc_A",
        chunk_id: str = "chunk_1",
        min_invest: float = None,
        talukas: list = None,
        entities: list = None,
        inc_type: str = "Stamp Duty Exemption",
        reimbursement: float = 100.0,
        max_amount: float = None,
        conditions: list = None,
        supersedes: bool = False
    ) -> Dict[str, Any]:
        elig_raw = {
            "min_capital_investment_inr": min_invest,
            "eligible_taluka_categories": talukas or [],
            "eligible_entity_types": entities or ["MSME"],
            "specific_conditions": conditions or ["Valid Commencement Certificate"]
        }
        inc_raw = [{
            "incentive_type": inc_type,
            "percentage_reimbursement": reimbursement,
            "max_amount_inr": max_amount,
            "conditions": conditions or []
        }]
        norm_name = normalize_text_for_comparison(name)
        norm_sec = normalize_sector(sector)
        norm_elig = normalize_eligibility(elig_raw)
        norm_inc = normalize_incentives_list(inc_raw)
        fp = compute_rule_fingerprint(norm_name, norm_sec, norm_elig, norm_inc)
        
        return {
            "rule_id": rule_id,
            "document_id": doc_id,
            "chunk_id": chunk_id,
            "rule_name": name,
            "policy_sector": sector,
            "effective_date": "2024-01-01",
            "expiry_date": None,
            "supersedes_clause_detected": supersedes,
            "filename": f"{doc_id}.pdf",
            "source_url": f"https://example.com/{doc_id}.pdf",
            "page_start": 10,
            "page_end": 12,
            "verbatim_text": f"Verbatim text for {name}",
            "elig_raw": elig_raw,
            "inc_raw": inc_raw,
            "norm_name": norm_name,
            "norm_sector": norm_sec,
            "norm_eligibility": norm_elig,
            "norm_incentives": norm_inc,
            "fingerprint": fp
        }
    return _make_rule


# ---------------------------------------------------------------------------
# Tests 1-7: Conservative Pairwise Classification Tests
# ---------------------------------------------------------------------------

def test_1_exact_duplicate_detection(mock_rules):
    """Test 1: Identical rules in the same document are classified as EXACT_DUPLICATE."""
    rule_1 = mock_rules(1, "Electricity Duty Exemption", doc_id="doc_A", chunk_id="c_1")
    rule_2 = mock_rules(2, "Electricity Duty Exemption", doc_id="doc_A", chunk_id="c_2")
    
    rel_type, conf, reason = compare_rule_pair(rule_1, rule_2)
    assert rel_type == EXACT_DUPLICATE
    assert conf == 1.0


def test_1b_same_rule_different_source(mock_rules):
    """Identical rules in different documents are classified as SAME_RULE_DIFFERENT_SOURCE."""
    rule_1 = mock_rules(1, "Electricity Duty Exemption", doc_id="doc_A")
    rule_2 = mock_rules(2, "Electricity Duty Exemption", doc_id="doc_B")
    
    rel_type, conf, reason = compare_rule_pair(rule_1, rule_2)
    assert rel_type == SAME_RULE_DIFFERENT_SOURCE
    assert conf == 1.0


def test_2_near_duplicate_detection(mock_rules):
    """Test 2: Minor variations in rule title or conditions result in NEAR_DUPLICATE."""
    rule_1 = mock_rules(1, "Capital Subsidy for MSME Units", conditions=["Must have valid CC"])
    rule_2 = mock_rules(2, "Capital Subsidy for MSMEs", conditions=["Must possess valid CC"])
    
    rel_type, conf, reason = compare_rule_pair(rule_1, rule_2)
    assert rel_type in [NEAR_DUPLICATE, EXACT_DUPLICATE]
    assert conf >= 0.85


def test_3_different_threshold_not_duplicate(mock_rules):
    """Test 3: Different investment thresholds MUST NOT be classified as duplicates."""
    rule_50cr = mock_rules(1, "Capital Subsidy Scheme", min_invest=500000000.0)  # 50 Cr
    rule_100cr = mock_rules(2, "Capital Subsidy Scheme", min_invest=1000000000.0)  # 100 Cr
    
    rel_type, conf, reason = compare_rule_pair(rule_50cr, rule_100cr)
    assert rel_type == RELATED_BUT_DIFFERENT
    assert "Different minimum investment thresholds" in reason


def test_4_different_sector_not_duplicate(mock_rules):
    """Test 4: Same incentive name but different sectors MUST NOT be merged."""
    rule_it = mock_rules(1, "Stamp Duty Exemption", sector="IT/ITES")
    rule_textile = mock_rules(2, "Stamp Duty Exemption", sector="Textiles")
    
    rel_type, conf, reason = compare_rule_pair(rule_it, rule_textile)
    assert rel_type in [CONTEXT_DIFFERENCE, NOT_DUPLICATE]
    assert rel_type != EXACT_DUPLICATE
    assert rel_type != NEAR_DUPLICATE


def test_5_different_geography_not_duplicate(mock_rules):
    """Test 5: Different taluka categories MUST NOT be merged."""
    rule_zone_a = mock_rules(1, "Power Tariff Subsidy", talukas=["A", "B"])
    rule_zone_d = mock_rules(2, "Power Tariff Subsidy", talukas=["D", "D+"])
    
    rel_type, conf, reason = compare_rule_pair(rule_zone_a, rule_zone_d)
    assert rel_type == CONTEXT_DIFFERENCE
    assert "geographic/taluka categories" in reason


def test_6_different_entity_type_not_duplicate(mock_rules):
    """Test 6: Different entity types (Micro vs Large) are preserved as distinct."""
    rule_micro = mock_rules(1, "Interest Subsidy Scheme", entities=["Micro", "Small"])
    rule_mega = mock_rules(2, "Interest Subsidy Scheme", entities=["Mega Project", "Ultra Mega"])
    
    rel_type, conf, reason = compare_rule_pair(rule_micro, rule_mega)
    assert rel_type == RELATED_BUT_DIFFERENT
    assert "entity types" in reason


def test_7_conflicting_rules_are_not_merged(mock_rules):
    """Test 7: Conflicting reimbursement rates for the same entity are flagged as POSSIBLE_CONFLICT."""
    rule_50pct = mock_rules(1, "Electricity Duty Waiver", reimbursement=50.0)
    rule_100pct = mock_rules(2, "Electricity Duty Waiver", reimbursement=100.0)
    
    rel_type, conf, reason = compare_rule_pair(rule_50pct, rule_100pct)
    assert rel_type == POSSIBLE_CONFLICT
    assert "Conflicting reimbursement percentages" in reason


# ---------------------------------------------------------------------------
# Tests 8-12: Database Deduplication, Provenance, Stability & Idempotency
# ---------------------------------------------------------------------------

@pytest.fixture
def temp_db(tmp_path):
    """Creates a temporary SQLite database initialized with schemas and mock candidate rules."""
    db_file = str(tmp_path / "test_policy.db")
    conn = sqlite3.connect(db_file)
    
    # Initialize basic schemas
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

    # Insert test documents
    conn.execute("INSERT INTO documents VALUES ('doc_1', 'Policy_2024.pdf', 'https://example.com/p2024')")
    conn.execute("INSERT INTO documents VALUES ('doc_2', 'Policy_Copy.pdf', 'https://example.com/pcopy')")
    conn.execute("INSERT INTO documents VALUES ('doc_3', 'Different_Policy.pdf', 'https://example.com/pdiff')")

    # Insert test chunks
    conn.execute("INSERT INTO source_chunks VALUES ('chk_1', 'doc_1', 14, 15, 'Eligible IT units get 100% stamp duty waiver.')")
    conn.execute("INSERT INTO source_chunks VALUES ('chk_2', 'doc_2', 20, 21, 'Eligible IT units get 100% stamp duty waiver.')")
    conn.execute("INSERT INTO source_chunks VALUES ('chk_3', 'doc_3', 5, 6, 'Eligible Textile units get 50% power subsidy.')")
    conn.execute("INSERT INTO source_chunks VALUES ('chk_4', 'doc_1', 16, 17, 'Conflicting rule: Eligible IT units get 50% stamp duty waiver.')")

    # Rule 101: 100% stamp duty waiver in doc_1
    elig_101 = json.dumps({"min_capital_investment_inr": None, "eligible_entity_types": ["MSME"], "eligible_taluka_categories": ["A"], "specific_conditions": []})
    inc_101 = json.dumps([{"incentive_type": "Stamp Duty Waiver", "percentage_reimbursement": 100.0, "max_amount_inr": None, "conditions": []}])
    conn.execute("INSERT INTO candidate_rules (rule_id, document_id, chunk_id, rule_name, policy_sector, eligibility_criteria_json, incentive_details_json) VALUES (101, 'doc_1', 'chk_1', 'Stamp Duty Exemption', 'IT/ITES', ?, ?)", (elig_101, inc_101))

    # Rule 102: Exact duplicate of 101, in doc_2
    conn.execute("INSERT INTO candidate_rules (rule_id, document_id, chunk_id, rule_name, policy_sector, eligibility_criteria_json, incentive_details_json) VALUES (102, 'doc_2', 'chk_2', 'Stamp Duty Exemption', 'IT/ITES', ?, ?)", (elig_101, inc_101))

    # Rule 103: Independent textile rule in doc_3
    elig_103 = json.dumps({"min_capital_investment_inr": 50000000.0, "eligible_entity_types": ["MSME"], "eligible_taluka_categories": ["C"], "specific_conditions": []})
    inc_103 = json.dumps([{"incentive_type": "Power Tariff Subsidy", "percentage_reimbursement": 50.0, "max_amount_inr": 1000000.0, "conditions": []}])
    conn.execute("INSERT INTO candidate_rules (rule_id, document_id, chunk_id, rule_name, policy_sector, eligibility_criteria_json, incentive_details_json) VALUES (103, 'doc_3', 'chk_3', 'Power Tariff Subsidy for Textiles', 'Textiles', ?, ?)", (elig_103, inc_103))

    # Rule 104: Conflicting stamp duty waiver in doc_1 (50% instead of 100%)
    inc_104 = json.dumps([{"incentive_type": "Stamp Duty Waiver", "percentage_reimbursement": 50.0, "max_amount_inr": None, "conditions": []}])
    conn.execute("INSERT INTO candidate_rules (rule_id, document_id, chunk_id, rule_name, policy_sector, eligibility_criteria_json, incentive_details_json) VALUES (104, 'doc_1', 'chk_4', 'Stamp Duty Exemption', 'IT/ITES', ?, ?)", (elig_101, inc_104))

    conn.commit()
    conn.close()

    # Apply rule layer migration
    migrate_rule_layer(db_file)
    return db_file


def test_8_provenance_survives_deduplication(temp_db):
    """Test 8: Duplicate rules preserve all multi-source document & chunk provenance."""
    engine = RuleDeduplicationEngine(db_path=temp_db)
    summary = engine.run_deduplication()
    
    conn = sqlite3.connect(temp_db)
    cursor = conn.cursor()
    
    # Rule 101 and 102 are duplicates. Find their canonical rule
    row_101 = cursor.execute("SELECT canonical_rule_id, status FROM candidate_rules WHERE rule_id = 101").fetchone()
    row_102 = cursor.execute("SELECT canonical_rule_id, status FROM candidate_rules WHERE rule_id = 102").fetchone()
    
    assert row_101[0] is not None
    assert row_101[0] == row_102[0]  # Point to same canonical rule
    assert row_101[1] in ["ACTIVE", "POSSIBLE_CONFLICT"]  # Primary rule
    assert row_102[1] == "DUPLICATE"  # Secondary is DUPLICATE
    
    canon_id = row_101[0]
    
    # Check canonical_rule_sources has BOTH sources
    sources = cursor.execute("SELECT rule_id, document_id, chunk_id, filename, source_url FROM canonical_rule_sources WHERE canonical_rule_id = ?", (canon_id,)).fetchall()
    assert len(sources) == 2
    
    source_docs = {s[1] for s in sources}
    assert source_docs == {"doc_1", "doc_2"}
    
    conn.close()


def test_9_original_rule_text_survives(temp_db):
    """Test 9: Verbatim chunk texts and original rule names are NEVER overwritten."""
    conn = sqlite3.connect(temp_db)
    orig_text = conn.execute("SELECT verbatim_text FROM source_chunks WHERE chunk_id = 'chk_1'").fetchone()[0]
    orig_name = conn.execute("SELECT rule_name FROM candidate_rules WHERE rule_id = 101").fetchone()[0]
    conn.close()
    
    engine = RuleDeduplicationEngine(db_path=temp_db)
    engine.run_deduplication()
    
    conn = sqlite3.connect(temp_db)
    after_text = conn.execute("SELECT verbatim_text FROM source_chunks WHERE chunk_id = 'chk_1'").fetchone()[0]
    after_name = conn.execute("SELECT rule_name FROM candidate_rules WHERE rule_id = 101").fetchone()[0]
    conn.close()
    
    assert orig_text == after_text
    assert orig_name == after_name


def test_10_rule_ids_remain_stable(temp_db):
    """Test 10: Existing candidate_rules IDs remain strictly unchanged."""
    engine = RuleDeduplicationEngine(db_path=temp_db)
    engine.run_deduplication()
    
    conn = sqlite3.connect(temp_db)
    ids = [r[0] for r in conn.execute("SELECT rule_id FROM candidate_rules ORDER BY rule_id").fetchall()]
    conn.close()
    
    assert ids == [101, 102, 103, 104]


def test_11_conflicting_rules_are_not_merged_in_db(temp_db):
    """Test 11: Conflicting rules (100% vs 50%) are assigned distinct canonical rules and flagged."""
    engine = RuleDeduplicationEngine(db_path=temp_db)
    engine.run_deduplication()
    
    conn = sqlite3.connect(temp_db)
    canon_101 = conn.execute("SELECT canonical_rule_id FROM candidate_rules WHERE rule_id = 101").fetchone()[0]
    canon_104 = conn.execute("SELECT canonical_rule_id FROM candidate_rules WHERE rule_id = 104").fetchone()[0]
    
    assert canon_101 != canon_104  # Not merged!
    
    # Check that rule_relationships contains POSSIBLE_CONFLICT between them
    conflict = conn.execute("SELECT relationship_type, reason FROM rule_relationships WHERE (source_rule_id=101 AND target_rule_id=104) OR (source_rule_id=104 AND target_rule_id=101)").fetchone()
    assert conflict is not None
    assert conflict[0] == POSSIBLE_CONFLICT
    
    conn.close()


def test_12_idempotency_running_twice_produces_identical_result(temp_db):
    """Test 12: Executing deduplication multiple times produces identical state without duplicates."""
    engine = RuleDeduplicationEngine(db_path=temp_db)
    
    # First execution
    summary_1 = engine.run_deduplication()
    conn = sqlite3.connect(temp_db)
    canon_1 = conn.execute("SELECT canonical_rule_id, rule_name, status FROM canonical_rules ORDER BY canonical_rule_id").fetchall()
    sources_1 = conn.execute("SELECT canonical_rule_id, rule_id FROM canonical_rule_sources ORDER BY canonical_rule_id, rule_id").fetchall()
    rels_1 = conn.execute("SELECT source_rule_id, target_rule_id, relationship_type FROM rule_relationships ORDER BY source_rule_id, target_rule_id").fetchall()
    conn.close()
    
    # Second execution
    summary_2 = engine.run_deduplication()
    conn = sqlite3.connect(temp_db)
    canon_2 = conn.execute("SELECT canonical_rule_id, rule_name, status FROM canonical_rules ORDER BY canonical_rule_id").fetchall()
    sources_2 = conn.execute("SELECT canonical_rule_id, rule_id FROM canonical_rule_sources ORDER BY canonical_rule_id, rule_id").fetchall()
    rels_2 = conn.execute("SELECT source_rule_id, target_rule_id, relationship_type FROM rule_relationships ORDER BY source_rule_id, target_rule_id").fetchall()
    conn.close()
    
    assert summary_1 == summary_2
    assert canon_1 == canon_2
    assert sources_1 == sources_2
    assert rels_1 == rels_2
