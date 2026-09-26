"""
Conservative Rule Deduplication and Relationship Engine.
Identifies duplicates, near-duplicates, amendments, and conflicts without external LLMs.
Preserves complete provenance and avoids destructive changes.
"""

import json
import sqlite3
import logging
from typing import Dict, Any, List, Optional, Tuple, Set
from difflib import SequenceMatcher

from src.rule_normalization import (
    normalize_text_for_comparison,
    normalize_sector,
    normalize_eligibility,
    normalize_incentives_list,
    compute_rule_fingerprint
)

logger = logging.getLogger(__name__)

# Relationship Types
EXACT_DUPLICATE = "EXACT_DUPLICATE"
NEAR_DUPLICATE = "NEAR_DUPLICATE"
SAME_RULE_DIFFERENT_SOURCE = "SAME_RULE_DIFFERENT_SOURCE"
RELATED_BUT_DIFFERENT = "RELATED_BUT_DIFFERENT"
CONTEXT_DIFFERENCE = "CONTEXT_DIFFERENCE"
POSSIBLE_AMENDMENT = "POSSIBLE_AMENDMENT"
POSSIBLE_CONFLICT = "POSSIBLE_CONFLICT"
NOT_DUPLICATE = "NOT_DUPLICATE"
UNCERTAIN = "UNCERTAIN"


def string_similarity(a: str, b: str) -> float:
    """Computes character sequence similarity ratio between two strings [0.0, 1.0]."""
    if not a and not b:
        return 1.0
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a, b).ratio()


def token_overlap_ratio(a: str, b: str) -> float:
    """Computes Jaccard similarity between token sets of two strings."""
    tokens_a = set(a.split())
    tokens_b = set(b.split())
    if not tokens_a and not tokens_b:
        return 1.0
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a.intersection(tokens_b)
    union = tokens_a.union(tokens_b)
    return len(intersection) / len(union)


def compare_rule_pair(
    rule_a: Dict[str, Any],
    rule_b: Dict[str, Any]
) -> Tuple[str, float, str]:
    """
    Compares two candidate rules and returns:
    (relationship_type, confidence, reason)
    
    Strict conservative evaluation rules:
    - Never merge rules with differing numerical thresholds or percentages.
    - Never merge rules with different sectors.
    - Flag contradictions as POSSIBLE_CONFLICT rather than merging.
    """
    # 1. Basic properties
    name_a_norm = rule_a["norm_name"]
    name_b_norm = rule_b["norm_name"]
    sec_a = rule_a["norm_sector"]
    sec_b = rule_b["norm_sector"]
    doc_a = rule_a["document_id"]
    doc_b = rule_b["document_id"]
    
    elig_a = rule_a["norm_eligibility"]
    elig_b = rule_b["norm_eligibility"]
    inc_a = rule_a["norm_incentives"]
    inc_b = rule_b["norm_incentives"]
    
    fp_a = rule_a["fingerprint"]
    fp_b = rule_b["fingerprint"]

    # 1. Exact Fingerprint Match
    if fp_a == fp_b:
        if doc_a != doc_b:
            return (
                SAME_RULE_DIFFERENT_SOURCE,
                1.0,
                f"Identical normalized rule requirements, criteria, and incentives across different documents ({doc_a[:8]} and {doc_b[:8]})."
            )
        else:
            return (
                EXACT_DUPLICATE,
                1.0,
                f"Identical normalized rule requirements, criteria, and incentives in same document ({doc_a[:8]})."
            )

    # 2. Sector difference check
    # If sectors are fundamentally different, they cannot be duplicates
    sector_match = (sec_a == sec_b) or ("general" in [sec_a, sec_b])
    name_sim = string_similarity(name_a_norm, name_b_norm)
    token_sim = token_overlap_ratio(name_a_norm, name_b_norm)
    high_name_sim = (name_sim >= 0.82 or token_sim >= 0.80)

    if not sector_match:
        if high_name_sim:
            return (
                CONTEXT_DIFFERENCE,
                0.90,
                f"Similar rule name ('{rule_a['rule_name']}') but applicable to different sectors ('{sec_a}' vs '{sec_b}')."
            )
        else:
            return (
                NOT_DUPLICATE,
                0.95,
                f"Different sectors ('{sec_a}' vs '{sec_b}') and non-matching rule names."
            )

    # 3. Check for Numerical Threshold Divergence (Investment or Employment)
    inv_a = elig_a.get("min_capital_investment_inr")
    inv_b = elig_b.get("min_capital_investment_inr")
    if inv_a is not None and inv_b is not None and inv_a != inv_b:
        return (
            RELATED_BUT_DIFFERENT,
            0.95,
            f"Different minimum investment thresholds: INR {inv_a:,.0f} vs INR {inv_b:,.0f}."
        )

    emp_a = elig_a.get("employment_threshold")
    emp_b = elig_b.get("employment_threshold")
    if emp_a is not None and emp_b is not None and emp_a != emp_b:
        return (
            RELATED_BUT_DIFFERENT,
            0.95,
            f"Different employment thresholds: {emp_a} vs {emp_b} employees."
        )

    # 4. Check for Geographic/Taluka Category Differences
    taluka_a = set(elig_a.get("eligible_taluka_categories", []))
    taluka_b = set(elig_b.get("eligible_taluka_categories", []))
    if taluka_a and taluka_b and taluka_a != taluka_b:
        return (
            CONTEXT_DIFFERENCE,
            0.90,
            f"Different geographic/taluka categories: {sorted(taluka_a)} vs {sorted(taluka_b)}."
        )

    # 5. Check for Entity Types Differences (e.g. MSME vs Large Unit)
    ent_a = set(elig_a.get("eligible_entity_types", []))
    ent_b = set(elig_b.get("eligible_entity_types", []))
    if ent_a and ent_b and ent_a != ent_b:
        return (
            RELATED_BUT_DIFFERENT,
            0.88,
            f"Targeting different entity types: {sorted(ent_a)} vs {sorted(ent_b)}."
        )

    # 6. Check for Conflicting Incentives for same entity & sector
    # If incentive types match, but subsidy percentages or caps differ
    if inc_a and inc_b:
        types_a = {i.get("incentive_type_norm") for i in inc_a if i.get("incentive_type_norm")}
        types_b = {i.get("incentive_type_norm") for i in inc_b if i.get("incentive_type_norm")}
        matching_types = types_a.intersection(types_b)
        
        if matching_types and (high_name_sim or sector_match):
            for t in matching_types:
                item_a = next(i for i in inc_a if i.get("incentive_type_norm") == t)
                item_b = next(i for i in inc_b if i.get("incentive_type_norm") == t)
                
                pct_a = item_a.get("percentage_reimbursement")
                pct_b = item_b.get("percentage_reimbursement")
                max_a = item_a.get("max_amount_inr")
                max_b = item_b.get("max_amount_inr")
                
                # Diverging percentage
                if pct_a is not None and pct_b is not None and pct_a != pct_b:
                    # Check if there is an amendment signal
                    has_amend = (
                        rule_a.get("supersedes_clause_detected") or
                        rule_b.get("supersedes_clause_detected") or
                        "amendment" in name_a_norm or "amendment" in name_b_norm
                    )
                    if has_amend:
                        return (
                            POSSIBLE_AMENDMENT,
                            0.85,
                            f"Incentive '{t}' rate differs ({pct_a}% vs {pct_b}%) with amendment/supersedes signal detected."
                        )
                    else:
                        return (
                            POSSIBLE_CONFLICT,
                            0.90,
                            f"Conflicting reimbursement percentages for incentive '{t}': {pct_a}% vs {pct_b}%."
                        )
                
                # Diverging monetary cap
                if max_a is not None and max_b is not None and max_a != max_b:
                    has_amend = (
                        rule_a.get("supersedes_clause_detected") or
                        rule_b.get("supersedes_clause_detected") or
                        "amendment" in name_a_norm or "amendment" in name_b_norm
                    )
                    if has_amend:
                        return (
                            POSSIBLE_AMENDMENT,
                            0.85,
                            f"Incentive '{t}' maximum cap differs (INR {max_a:,.0f} vs INR {max_b:,.0f}) with amendment signal."
                        )
                    else:
                        return (
                            POSSIBLE_CONFLICT,
                            0.88,
                            f"Conflicting maximum amounts for incentive '{t}': INR {max_a:,.0f} vs INR {max_b:,.0f}."
                        )

    # 7. Check for Near Duplicate
    # High name similarity, matching sector, matching incentive types and numbers,
    # with minor variations in specific conditions text
    if high_name_sim:
        # Verify incentives match or are compatible
        inc_match = False
        if not inc_a and not inc_b:
            inc_match = True
        elif inc_a and inc_b and len(inc_a) == len(inc_b):
            same_types = all(
                inc_a[idx].get("incentive_type_norm") == inc_b[idx].get("incentive_type_norm") and
                inc_a[idx].get("percentage_reimbursement") == inc_b[idx].get("percentage_reimbursement") and
                inc_a[idx].get("max_amount_inr") == inc_b[idx].get("max_amount_inr")
                for idx in range(len(inc_a))
            )
            inc_match = same_types
        
        if inc_match:
            conds_a = " ".join(elig_a.get("specific_conditions", []))
            conds_b = " ".join(elig_b.get("specific_conditions", []))
            cond_sim = string_similarity(conds_a, conds_b)
            
            if cond_sim >= 0.75 or (not conds_a and not conds_b):
                return (
                    NEAR_DUPLICATE,
                    round(max(name_sim, 0.85), 2),
                    f"Highly similar rule name ('{rule_a['rule_name']}') and identical benefit parameters with minor condition phrasing variations."
                )
            else:
                return (
                    UNCERTAIN,
                    0.65,
                    f"Similar rule name and benefits, but differing specific conditions require human review."
                )

    # Default fallback
    return (
        NOT_DUPLICATE,
        0.95,
        "Distinct rules with different names, eligibility criteria, or benefit mechanisms."
    )


class RuleDeduplicationEngine:
    def __init__(self, db_path: str = "db/policy_engine.db"):
        self.db_path = db_path

    def load_rules(self) -> List[Dict[str, Any]]:
        """Loads and pre-normalizes all candidate rules from database."""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT 
                r.rule_id,
                r.document_id,
                r.chunk_id,
                r.rule_name,
                r.policy_sector,
                r.eligibility_criteria_json,
                r.incentive_details_json,
                r.effective_date,
                r.expiry_date,
                r.supersedes_clause_detected,
                d.filename,
                d.source_url,
                c.page_start,
                c.page_end,
                c.verbatim_text
            FROM candidate_rules r
            LEFT JOIN documents d ON r.document_id = d.document_id
            LEFT JOIN source_chunks c ON r.chunk_id = c.chunk_id
            ORDER BY r.rule_id ASC
        """
        rows = cursor.execute(query).fetchall()
        conn.close()

        rules = []
        for r in rows:
            elig_raw = {}
            if r["eligibility_criteria_json"]:
                try:
                    elig_raw = json.loads(r["eligibility_criteria_json"])
                except Exception:
                    pass
            
            inc_raw = []
            if r["incentive_details_json"]:
                try:
                    inc_raw = json.loads(r["incentive_details_json"])
                except Exception:
                    pass

            norm_name = normalize_text_for_comparison(r["rule_name"])
            norm_sec = normalize_sector(r["policy_sector"])
            norm_elig = normalize_eligibility(elig_raw)
            norm_inc = normalize_incentives_list(inc_raw)
            fp = compute_rule_fingerprint(norm_name, norm_sec, norm_elig, norm_inc)

            rules.append({
                "rule_id": r["rule_id"],
                "document_id": r["document_id"] or "",
                "chunk_id": r["chunk_id"] or "",
                "rule_name": r["rule_name"] or "",
                "policy_sector": r["policy_sector"] or "",
                "effective_date": r["effective_date"],
                "expiry_date": r["expiry_date"],
                "supersedes_clause_detected": bool(r["supersedes_clause_detected"]),
                "filename": r["filename"] or "",
                "source_url": r["source_url"] or "",
                "page_start": r["page_start"],
                "page_end": r["page_end"],
                "verbatim_text": r["verbatim_text"] or "",
                "elig_raw": elig_raw,
                "inc_raw": inc_raw,
                "norm_name": norm_name,
                "norm_sector": norm_sec,
                "norm_eligibility": norm_elig,
                "norm_incentives": norm_inc,
                "fingerprint": fp
            })
            
        logger.info(f"Loaded and pre-normalized {len(rules)} candidate rules.")
        return rules

    def run_deduplication(self) -> Dict[str, Any]:
        """
        Executes idempotent normalization and deduplication over all candidate rules.
        Writes canonical rules, sources, and relationships to SQLite.
        """
        rules = self.load_rules()
        n = len(rules)
        if n == 0:
            return {"status": "empty", "message": "No rules found."}

        # 1. Cluster rules by duplicate relationships
        # Disjoint Set Union (Union-Find) to form clusters of true duplicates
        parent = {r["rule_id"]: r["rule_id"] for r in rules}

        def find(i):
            if parent[i] == i:
                return i
            parent[i] = find(parent[i])
            return parent[i]

        def union(i, j):
            root_i = find(i)
            root_j = find(j)
            if root_i != root_j:
                # Keep the smaller rule_id as canonical primary for ID stability
                if root_i < root_j:
                    parent[root_j] = root_i
                else:
                    parent[root_i] = root_j

        relationships = []
        rule_map = {r["rule_id"]: r for r in rules}

        # Fast indexing by fingerprint for O(N) exact duplicate detection
        from collections import defaultdict
        fp_buckets = defaultdict(list)
        for r in rules:
            fp_buckets[r["fingerprint"]].append(r["rule_id"])

        # Union exact duplicates
        for fp, r_ids in fp_buckets.items():
            if len(r_ids) > 1:
                first = r_ids[0]
                for other in r_ids[1:]:
                    rel_type, conf, reason = compare_rule_pair(rule_map[first], rule_map[other])
                    relationships.append({
                        "source_rule_id": first,
                        "target_rule_id": other,
                        "relationship_type": rel_type,
                        "confidence": conf,
                        "reason": reason
                    })
                    union(first, other)

        # Index rules by normalized sector for pairwise similarity checks
        sector_buckets = defaultdict(list)
        for r in rules:
            sector_buckets[r["norm_sector"]].append(r)

        # Compare rules within same/compatible sectors
        for sec, sec_rules in sector_buckets.items():
            sec_len = len(sec_rules)
            for i in range(sec_len):
                r_a = sec_rules[i]
                id_a = r_a["rule_id"]
                for j in range(i + 1, sec_len):
                    r_b = sec_rules[j]
                    id_b = r_b["rule_id"]

                    # Skip if already united via exact fingerprint
                    if find(id_a) == find(id_b):
                        continue

                    # Filter: only compare if rule names have token/character overlap
                    name_sim = string_similarity(r_a["norm_name"], r_b["norm_name"])
                    token_sim = token_overlap_ratio(r_a["norm_name"], r_b["norm_name"])
                    
                    if name_sim >= 0.50 or token_sim >= 0.40:
                        rel_type, conf, reason = compare_rule_pair(r_a, r_b)
                        
                        if rel_type != NOT_DUPLICATE:
                            relationships.append({
                                "source_rule_id": id_a,
                                "target_rule_id": id_b,
                                "relationship_type": rel_type,
                                "confidence": conf,
                                "reason": reason
                            })

                        # If classified as NEAR_DUPLICATE with high confidence, unite into same canonical cluster
                        if rel_type == NEAR_DUPLICATE and conf >= 0.85:
                            union(id_a, id_b)

        # Group rules by canonical root
        clusters = defaultdict(list)
        for r in rules:
            root = find(r["rule_id"])
            clusters[root].append(r)

        # Identify duplicate clusters vs independent rules
        # Sort cluster roots to assign stable sequential canonical IDs: CANON-0001, etc.
        sorted_roots = sorted(clusters.keys())
        
        canonical_records = []
        canonical_source_records = []
        candidate_updates = []

        canon_idx = 1
        for root in sorted_roots:
            group = clusters[root]
            # Primary rule is the root (lowest rule_id in cluster)
            primary = next(r for r in group if r["rule_id"] == root)
            canon_id = f"CANON-{canon_idx:04d}"
            canon_idx += 1

            # Check if this cluster is involved in any POSSIBLE_CONFLICT
            cluster_rule_ids = {r["rule_id"] for r in group}
            has_conflict = any(
                (rel["source_rule_id"] in cluster_rule_ids or rel["target_rule_id"] in cluster_rule_ids)
                and rel["relationship_type"] == POSSIBLE_CONFLICT
                for rel in relationships
            )
            has_uncertain = any(
                (rel["source_rule_id"] in cluster_rule_ids or rel["target_rule_id"] in cluster_rule_ids)
                and rel["relationship_type"] == UNCERTAIN
                for rel in relationships
            )

            canon_status = "ACTIVE"
            if has_conflict:
                canon_status = "POSSIBLE_CONFLICT"
            elif has_uncertain and len(group) == 1:
                canon_status = "UNCERTAIN"

            canonical_records.append({
                "canonical_rule_id": canon_id,
                "rule_name": primary["rule_name"],
                "policy_sector": primary["policy_sector"],
                "normalized_name": primary["norm_name"],
                "eligibility_criteria_json": json.dumps(primary["elig_raw"]),
                "incentive_details_json": json.dumps(primary["inc_raw"]),
                "effective_date": primary["effective_date"],
                "expiry_date": primary["expiry_date"],
                "status": canon_status,
                "confidence": 1.0 if len(group) == 1 else 0.95,
                "source_count": len(group),
                "primary_rule_id": primary["rule_id"]
            })

            # Record all sources
            for idx, r in enumerate(group):
                is_prim = 1 if r["rule_id"] == root else 0
                if is_prim:
                    r_status = canon_status
                else:
                    r_status = "DUPLICATE"

                candidate_updates.append((canon_id, r_status, r["rule_id"]))

                verbatim_snippet = (r["verbatim_text"][:300] + "...") if len(r["verbatim_text"]) > 300 else r["verbatim_text"]
                canonical_source_records.append({
                    "canonical_rule_id": canon_id,
                    "rule_id": r["rule_id"],
                    "document_id": r["document_id"],
                    "chunk_id": r["chunk_id"],
                    "source_url": r["source_url"],
                    "filename": r["filename"],
                    "page_start": r["page_start"],
                    "page_end": r["page_end"],
                    "verbatim_snippet": verbatim_snippet,
                    "is_primary": is_prim
                })

        # 4. Atomic database commit (Idempotent: clear previous canonical runs, re-insert clean state)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("DELETE FROM canonical_rule_sources;")
        cursor.execute("DELETE FROM canonical_rules;")
        cursor.execute("DELETE FROM rule_relationships;")

        # Insert Canonical Rules
        cursor.executemany("""
            INSERT INTO canonical_rules (
                canonical_rule_id, rule_name, policy_sector, normalized_name,
                eligibility_criteria_json, incentive_details_json, effective_date,
                expiry_date, status, confidence, source_count, primary_rule_id
            ) VALUES (
                :canonical_rule_id, :rule_name, :policy_sector, :normalized_name,
                :eligibility_criteria_json, :incentive_details_json, :effective_date,
                :expiry_date, :status, :confidence, :source_count, :primary_rule_id
            )
        """, canonical_records)

        # Insert Canonical Rule Sources
        cursor.executemany("""
            INSERT INTO canonical_rule_sources (
                canonical_rule_id, rule_id, document_id, chunk_id, source_url,
                filename, page_start, page_end, verbatim_snippet, is_primary
            ) VALUES (
                :canonical_rule_id, :rule_id, :document_id, :chunk_id, :source_url,
                :filename, :page_start, :page_end, :verbatim_snippet, :is_primary
            )
        """, canonical_source_records)

        # Insert Candidate Rule Updates
        cursor.executemany("""
            UPDATE candidate_rules
            SET canonical_rule_id = ?, status = ?
            WHERE rule_id = ?
        """, candidate_updates)

        # Insert Rule Relationships
        cursor.executemany("""
            INSERT OR IGNORE INTO rule_relationships (
                source_rule_id, target_rule_id, relationship_type, confidence, reason
            ) VALUES (
                :source_rule_id, :target_rule_id, :relationship_type, :confidence, :reason
            )
        """, relationships)

        conn.commit()
        conn.close()

        # Compute summary metrics
        exact_dups = sum(1 for r in relationships if r["relationship_type"] in [EXACT_DUPLICATE, SAME_RULE_DIFFERENT_SOURCE])
        near_dups = sum(1 for r in relationships if r["relationship_type"] == NEAR_DUPLICATE)
        conflicts = sum(1 for r in relationships if r["relationship_type"] == POSSIBLE_CONFLICT)
        amendments = sum(1 for r in relationships if r["relationship_type"] == POSSIBLE_AMENDMENT)
        uncertains = sum(1 for r in relationships if r["relationship_type"] == UNCERTAIN)
        multi_source_canonicals = sum(1 for c in canonical_records if c["source_count"] > 1)

        summary = {
            "total_candidate_rules": len(rules),
            "canonical_rules_count": len(canonical_records),
            "multi_source_canonical_count": multi_source_canonicals,
            "standalone_canonical_count": len(canonical_records) - multi_source_canonicals,
            "exact_duplicate_relations": exact_dups,
            "near_duplicate_relations": near_dups,
            "possible_conflicts": conflicts,
            "possible_amendments": amendments,
            "uncertain_relations": uncertains,
            "total_relationships_recorded": len(relationships)
        }

        logger.info(f"Deduplication completed successfully: {summary}")
        return summary


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
    engine = RuleDeduplicationEngine()
    results = engine.run_deduplication()
    print("Deduplication Results:")
    for k, v in results.items():
        print(f"  {k}: {v}")
