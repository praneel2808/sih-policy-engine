"""
src/form_deduplication.py
-------------------------
Form Requirement Deduplication and Relationship Engine.

Inspects all form requirements extracted in `form_requirements` and identifies
relationships (EXACT_DUPLICATE, NEAR_DUPLICATE, SAME_FORM_DIFFERENT_SOURCE,
RELATED_BUT_DIFFERENT, POSSIBLE_CONFLICT, UNCERTAIN) without destroying or
modifying original form records.

Stores findings in `form_relationships` table in policy_engine.db.
Idempotent and reusable.
"""

import json
import logging
import re
import sqlite3
from difflib import SequenceMatcher
from typing import Any, Dict, List, Tuple

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("smsws.form_deduplication")

# Relationship types
EXACT_DUPLICATE = "EXACT_DUPLICATE"
NEAR_DUPLICATE = "NEAR_DUPLICATE"
SAME_FORM_DIFFERENT_SOURCE = "SAME_FORM_DIFFERENT_SOURCE"
RELATED_BUT_DIFFERENT = "RELATED_BUT_DIFFERENT"
POSSIBLE_CONFLICT = "POSSIBLE_CONFLICT"
UNCERTAIN = "UNCERTAIN"


def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[\W_]+", " ", text)
    return text.strip()


def normalize_form_num(num: str) -> str:
    if not num:
        return ""
    num = num.lower()
    num = re.sub(r"[^a-z0-9]", "", num)
    return num


def string_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def init_form_relationships_db(conn: sqlite3.Connection) -> None:
    """Creates the form_relationships table if it does not exist."""
    conn.execute("""
        CREATE TABLE IF NOT EXISTS form_relationships (
            relationship_id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_form_requirement_id INTEGER NOT NULL,
            target_form_requirement_id INTEGER NOT NULL,
            relationship_type TEXT NOT NULL,
            confidence REAL NOT NULL,
            reason TEXT NOT NULL,
            comparison_details_json TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(source_form_requirement_id) REFERENCES form_requirements(form_requirement_id),
            FOREIGN KEY(target_form_requirement_id) REFERENCES form_requirements(form_requirement_id),
            UNIQUE(source_form_requirement_id, target_form_requirement_id)
        );
    """)
    conn.commit()


def compare_form_pair(f1: Dict[str, Any], f2: Dict[str, Any]) -> Tuple[str, float, str, Dict[str, Any]]:
    """
    Compares two form requirement dictionary records and returns:
    (relationship_type, confidence, reason, comparison_details_dict)
    """
    name1_raw = f1.get("form_name") or ""
    name2_raw = f2.get("form_name") or ""
    name1_norm = normalize_text(name1_raw)
    name2_norm = normalize_text(name2_raw)

    num1_raw = f1.get("form_number") or ""
    num2_raw = f2.get("form_number") or ""
    num1_norm = normalize_form_num(num1_raw)
    num2_norm = normalize_form_num(num2_raw)

    type1 = (f1.get("form_type") or "").upper()
    type2 = (f2.get("form_type") or "").upper()

    rule1 = f1.get("canonical_rule_id") or ""
    rule2 = f2.get("canonical_rule_id") or ""

    doc1 = f1.get("document_id") or ""
    doc2 = f2.get("document_id") or ""

    req1 = f1.get("required")
    req2 = f2.get("required")

    scope1_norm = normalize_text(f1.get("applicant_scope") or "")
    scope2_norm = normalize_text(f2.get("applicant_scope") or "")

    name_sim = string_similarity(name1_norm, name2_norm)
    num_match = bool(num1_norm and num2_norm and num1_norm == num2_norm)
    same_doc = bool(doc1 and doc2 and doc1 == doc2)
    same_rule = bool(rule1 and rule2 and rule1 == rule2)
    same_type = bool(type1 and type2 and type1 == type2)

    generic_names = {"application form", "common undertaking", "affidavit", "undertaking", "prescribed form"}

    rel_type = None
    confidence = 0.0
    reason = ""

    # 1. EXACT_DUPLICATE: Same document + same form name + same form number
    if same_doc and name1_norm == name2_norm and (num_match or (not num1_norm and not num2_norm)):
        if req1 != req2 and req1 is not None and req2 is not None:
            rel_type = POSSIBLE_CONFLICT
            confidence = 0.90
            reason = f"Same form ('{name1_raw}') in document ({doc1[:10]}...), but with conflicting requirement status ({req1} vs {req2})."
        else:
            rel_type = EXACT_DUPLICATE
            confidence = 1.0 if num_match else 0.98
            reason = f"Identical form name ('{name1_raw}') and number ('{num1_raw}') in the same source document."

    # 2. SAME_FORM_DIFFERENT_SOURCE: Same form name & number across DIFFERENT documents
    elif not same_doc and ((name1_norm == name2_norm and num_match) or (name1_norm == name2_norm and name1_norm not in generic_names)):
        if req1 != req2 and req1 is not None and req2 is not None:
            rel_type = POSSIBLE_CONFLICT
            confidence = 0.90
            reason = f"Same form reference ('{name1_raw}') across different documents, but with conflicting requirement status ({req1} vs {req2})."
        else:
            rel_type = SAME_FORM_DIFFERENT_SOURCE
            confidence = 0.95
            reason = f"Same form ('{name1_raw}' / number '{num1_raw}') extracted from different documents ({doc1[:10]}... vs {doc2[:10]}...)."

    # 3. NEAR_DUPLICATE: High textual similarity
    elif name_sim >= 0.85 and name1_norm not in generic_names and (same_type or num_match or same_rule or same_doc):
        if req1 != req2 and req1 is not None and req2 is not None and num_match:
            rel_type = POSSIBLE_CONFLICT
            confidence = 0.85
            reason = f"Highly similar forms with matching number '{num1_raw}', but conflicting requirement rules."
        else:
            rel_type = NEAR_DUPLICATE
            confidence = round(0.80 + (name_sim * 0.15), 2)
            reason = f"Near-duplicate form titles ('{name1_raw}' vs '{name2_raw}') with high similarity ({name_sim:.2f}) and shared context."

    # 4. RELATED_BUT_DIFFERENT: Shared canonical rule or form sequence series
    elif same_rule and not (name_sim > 0.85):
        rel_type = RELATED_BUT_DIFFERENT
        confidence = 0.80
        reason = f"Forms share the same canonical rule context ({rule1}), representing complementary statutory sub-requirements or form series."
    elif num_match and num1_norm not in {"form", "formi", "form1", "appendix"} and (same_doc or same_rule):
        rel_type = RELATED_BUT_DIFFERENT
        confidence = 0.85
        reason = f"Forms share the same form designation number '{num1_raw}' under the same source document/rule, but have different form names/scopes."

    # 5. UNCERTAIN: Moderate similarity across distinct contexts
    elif name_sim >= 0.75 and name1_norm not in generic_names and not same_rule and not same_doc:
        rel_type = UNCERTAIN
        confidence = 0.60
        reason = f"Moderate name similarity ({name_sim:.2f}) between '{name1_raw}' and '{name2_raw}', but distinct sources and rules."

    details = {
        "source_form_name": name1_raw,
        "target_form_name": name2_raw,
        "source_form_number": num1_raw,
        "target_form_number": num2_raw,
        "source_document_id": doc1,
        "target_document_id": doc2,
        "source_canonical_rule_id": rule1,
        "target_canonical_rule_id": rule2,
        "name_similarity": round(name_sim, 3),
        "same_document": same_doc,
        "same_canonical_rule": same_rule,
    }

    return rel_type, confidence, reason, details


def run_form_deduplication(db_path: str) -> Dict[str, Any]:
    """
    Executes the form deduplication and relationship pipeline against the SQLite database.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        init_form_relationships_db(conn)

        cur = conn.cursor()
        cur.execute("""
            SELECT 
                form_requirement_id,
                canonical_rule_id,
                rule_id,
                document_id,
                chunk_id,
                form_name,
                form_number,
                form_type,
                required,
                condition,
                applicant_scope,
                submission_method,
                reference_type,
                evidence_text,
                confidence
            FROM form_requirements
            ORDER BY form_requirement_id ASC
        """)
        forms = [dict(r) for r in cur.fetchall()]
        n = len(forms)
        logger.info("Analyzing %d form requirements for duplicate & relationship mapping...", n)

        relationships = []
        for i in range(n):
            for j in range(i + 1, n):
                rel_type, confidence, reason, details = compare_form_pair(forms[i], forms[j])
                if rel_type:
                    relationships.append((
                        forms[i]["form_requirement_id"],
                        forms[j]["form_requirement_id"],
                        rel_type,
                        confidence,
                        reason,
                        json.dumps(details, ensure_ascii=False)
                    ))

        # Clear old form_relationships idempotently before inserting fresh results
        conn.execute("DELETE FROM form_relationships;")

        conn.executemany("""
            INSERT OR REPLACE INTO form_relationships (
                source_form_requirement_id,
                target_form_requirement_id,
                relationship_type,
                confidence,
                reason,
                comparison_details_json
            ) VALUES (?, ?, ?, ?, ?, ?);
        """, relationships)

        conn.commit()

        # Generate summary breakdown
        cur.execute("""
            SELECT relationship_type, COUNT(*) as cnt 
            FROM form_relationships 
            GROUP BY relationship_type 
            ORDER BY cnt DESC;
        """)
        breakdown = {row["relationship_type"]: row["cnt"] for row in cur.fetchall()}

        logger.info("Form relationship processing complete! Created %d mapping entries.", len(relationships))
        for rel_t, count in breakdown.items():
            logger.info("  - %-30s: %d", rel_t, count)

        return {
            "status": "ok",
            "total_forms_analyzed": n,
            "total_relationships_found": len(relationships),
            "breakdown": breakdown,
        }
    finally:
        conn.close()


if __name__ == "__main__":
    import os
    _HERE = os.path.dirname(os.path.abspath(__file__))
    _PROJECT_ROOT = os.path.abspath(os.path.join(_HERE, ".."))
    db = os.path.join(_PROJECT_ROOT, "db", "policy_engine.db")
    print(f"Running form deduplication on {db}...")
    res = run_form_deduplication(db)
    print("Result Summary:", json.dumps(res, indent=2))
