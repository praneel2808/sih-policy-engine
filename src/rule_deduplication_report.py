"""
Rule Deduplication Inspection Report Generator.
Generates comprehensive Markdown and HTML reports covering:
- Overall metrics (before, duplicates, canonicals, conflicts, uncertains)
- All duplicate groups with multi-source provenance
- Ambiguous/Conflict groups requiring human verification
"""

import json
import sqlite3
import os
from typing import Dict, Any, List

def generate_deduplication_report(db_path: str = "db/policy_engine.db", out_dir: str = "inspection_report"):
    os.makedirs(out_dir, exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Overall counts
    total_candidate_rules = cursor.execute("SELECT count(*) FROM candidate_rules").fetchone()[0]
    total_canonical_rules = cursor.execute("SELECT count(*) FROM canonical_rules").fetchone()[0]
    standalone_rules = cursor.execute("SELECT count(*) FROM canonical_rules WHERE source_count = 1").fetchone()[0]
    multi_source_rules = cursor.execute("SELECT count(*) FROM canonical_rules WHERE source_count > 1").fetchone()[0]
    
    exact_dups = cursor.execute("SELECT count(*) FROM rule_relationships WHERE relationship_type IN ('EXACT_DUPLICATE', 'SAME_RULE_DIFFERENT_SOURCE')").fetchone()[0]
    near_dups = cursor.execute("SELECT count(*) FROM rule_relationships WHERE relationship_type = 'NEAR_DUPLICATE'").fetchone()[0]
    conflicts = cursor.execute("SELECT count(*) FROM rule_relationships WHERE relationship_type = 'POSSIBLE_CONFLICT'").fetchone()[0]
    amendments = cursor.execute("SELECT count(*) FROM rule_relationships WHERE relationship_type = 'POSSIBLE_AMENDMENT'").fetchone()[0]
    uncertains = cursor.execute("SELECT count(*) FROM rule_relationships WHERE relationship_type = 'UNCERTAIN'").fetchone()[0]

    # 2. Duplicate Groups Details (source_count > 1)
    dup_groups_query = """
        SELECT 
            c.canonical_rule_id,
            c.rule_name,
            c.policy_sector,
            c.source_count,
            c.status,
            c.confidence
        FROM canonical_rules c
        WHERE c.source_count > 1
        ORDER BY c.canonical_rule_id
    """
    dup_canonicals = cursor.execute(dup_groups_query).fetchall()

    duplicate_groups = []
    for dc in dup_canonicals:
        cid = dc["canonical_rule_id"]
        sources = cursor.execute("""
            SELECT 
                s.rule_id,
                s.document_id,
                s.chunk_id,
                s.filename,
                s.source_url,
                s.page_start,
                s.page_end,
                s.verbatim_snippet,
                s.is_primary,
                r.rule_name,
                r.eligibility_criteria_json,
                r.incentive_details_json
            FROM canonical_rule_sources s
            JOIN candidate_rules r ON s.rule_id = r.rule_id
            WHERE s.canonical_rule_id = ?
            ORDER BY s.is_primary DESC, s.rule_id ASC
        """, (cid,)).fetchall()

        # Find relationship reasons
        r_ids = [s["rule_id"] for s in sources]
        reasons = []
        for i in range(len(r_ids)):
            for j in range(i+1, len(r_ids)):
                r1, r2 = r_ids[i], r_ids[j]
                rel = cursor.execute("""
                    SELECT relationship_type, confidence, reason 
                    FROM rule_relationships 
                    WHERE (source_rule_id = ? AND target_rule_id = ?) 
                       OR (source_rule_id = ? AND target_rule_id = ?)
                """, (r1, r2, r2, r1)).fetchone()
                if rel:
                    reasons.append(f"[{rel['relationship_type']} - conf: {rel['confidence']:.2f}] {rel['reason']}")

        duplicate_groups.append({
            "canonical_rule_id": cid,
            "rule_name": dc["rule_name"],
            "policy_sector": dc["policy_sector"],
            "source_count": dc["source_count"],
            "confidence": dc["confidence"],
            "reasons": reasons or ["Exact semantic fingerprint match across document chunks."],
            "sources": [dict(s) for s in sources]
        })

    # 3. Ambiguous & Conflict Groups
    ambiguous_query = """
        SELECT 
            r.relationship_id,
            r.source_rule_id,
            r.target_rule_id,
            r.relationship_type,
            r.confidence,
            r.reason,
            r1.rule_name as source_rule_name,
            r1.policy_sector as source_sector,
            d1.filename as source_file,
            r2.rule_name as target_rule_name,
            r2.policy_sector as target_sector,
            d2.filename as target_file
        FROM rule_relationships r
        JOIN candidate_rules r1 ON r.source_rule_id = r1.rule_id
        LEFT JOIN documents d1 ON r1.document_id = d1.document_id
        JOIN candidate_rules r2 ON r.target_rule_id = r2.rule_id
        LEFT JOIN documents d2 ON r2.document_id = d2.document_id
        WHERE r.relationship_type IN ('POSSIBLE_CONFLICT', 'UNCERTAIN', 'POSSIBLE_AMENDMENT')
        ORDER BY r.relationship_type, r.relationship_id
    """
    ambiguous_pairs = cursor.execute(ambiguous_query).fetchall()

    conn.close()

    # 4. Generate Markdown Report
    md_lines = []
    A = md_lines.append
    A("# SMSWS Rule Normalization & Deduplication Inspection Report")
    A(f"\n_Generated from live SQLite database `{db_path}`_\n")
    
    A("## 1. Overall Summary")
    A("| Metric | Count | Description |")
    A("| :--- | :--- | :--- |")
    A(f"| **Total Candidate Rules (Before)** | **{total_candidate_rules}** | Raw candidate rules extracted from document chunks |")
    A(f"| **Canonical Rules (After)** | **{total_canonical_rules}** | Cleaned deduplicated canonical policy rules |")
    A(f"| **Multi-Source Canonical Clusters** | **{multi_source_rules}** | Canonical rules merging 2+ identical candidate rules |")
    A(f"| **Independent Standalone Rules** | **{standalone_rules}** | Rules with unique normative requirements |")
    A(f"| **Exact Duplicate Relationships** | **{exact_dups}** | Exact identical fingerprint matches |")
    A(f"| **Near Duplicate Relationships** | **{near_dups}** | High-similarity matches with equivalent benefits |")
    A(f"| **Possible Conflicts (Preserved)** | **{conflicts}** | Conflicting rates/caps preserved as distinct rules |")
    A(f"| **Possible Amendments** | **{amendments}** | Rules flagged with explicit amendment/supersession signals |")
    A(f"| **Uncertain Relationships** | **{uncertains}** | Pairs flagged for human legal review |")
    
    A("\n---\n")
    A("## 2. Duplicate Groups (Multi-Source Provenance)")
    A(f"Found **{len(duplicate_groups)}** multi-source canonical rule groups:\n")
    
    for dg in duplicate_groups:
        A(f"### Canonical Rule `{dg['canonical_rule_id']}`: {dg['rule_name']}")
        A(f"- **Policy Sector:** `{dg['policy_sector']}`")
        A(f"- **Merged Source Count:** `{dg['source_count']}`")
        A(f"- **Deduplication Confidence:** `{dg['confidence']:.2f}`")
        A(f"- **Deduplication Justification:** {'; '.join(dg['reasons'])}")
        A("\n**Underlying Sources Preserved:**\n")
        A("| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |")
        A("| :--- | :--- | :--- | :--- | :--- | :--- |")
        for s in dg["sources"]:
            role = "Primary" if s["is_primary"] else "Duplicate"
            pages = f"p. {s['page_start']}-{s['page_end']}" if s['page_start'] else "N/A"
            url = f"[Link]({s['source_url']})" if s['source_url'] else "N/A"
            A(f"| {s['rule_id']} | `{role}` | `{s['filename']}` | {pages} | `{s['chunk_id'][:12]}...` | {url} |")
        A("")

    A("\n---\n")
    A("## 3. Ambiguous & Conflict Groups Requiring Human Verification")
    A(f"Found **{len(ambiguous_pairs)}** pairs flagged with potential conflicts, amendments, or uncertainties.\n")
    A("> [!IMPORTANT]\n> Conflicting rules were **NOT** merged or overwritten. Both candidate rules were preserved as independent rules to maintain legal fidelity.\n")
    
    A("| Rel ID | Type | Rule A (ID / Name / Doc) | Rule B (ID / Name / Doc) | Classification Reason | Verification Needed |")
    A("| :--- | :--- | :--- | :--- | :--- | :--- |")
    for ap in ambiguous_pairs[:50]:  # Show top 50 in markdown table
        rule_a_desc = f"**#{ap['source_rule_id']}** {ap['source_rule_name']} (`{ap['source_file']}`)"
        rule_b_desc = f"**#{ap['target_rule_id']}** {ap['target_rule_name']} (`{ap['target_file']}`)"
        verif = "Verify which rate applies to current financial year" if ap['relationship_type'] == 'POSSIBLE_CONFLICT' else "Review condition phrasing"
        A(f"| {ap['relationship_id']} | `{ap['relationship_type']}` | {rule_a_desc} | {rule_b_desc} | {ap['reason']} | {verif} |")
    
    if len(ambiguous_pairs) > 50:
        A(f"\n_... and {len(ambiguous_pairs) - 50} additional relationships recorded in `rule_relationships` table._\n")

    md_path = os.path.join(out_dir, "rule_deduplication_report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(md_lines))

    # 5. Generate HTML Report
    html_lines = []
    H = html_lines.append
    H("<!DOCTYPE html><html><head><meta charset='utf-8'>")
    H("<title>SMSWS Rule Normalization & Deduplication Report</title>")
    H("<style>")
    H("body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 30px; background: #f8fafc; color: #1e293b; }")
    H("h1 { color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }")
    H("h2 { color: #1e293b; margin-top: 30px; }")
    H(".card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin: 20px 0; }")
    H(".card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #3b82f6; }")
    H(".card.ok { border-left-color: #10b981; }")
    H(".card.warn { border-left-color: #f59e0b; }")
    H(".card.danger { border-left-color: #ef4444; }")
    H(".card .num { font-size: 28px; font-weight: bold; color: #0f172a; }")
    H(".card .label { font-size: 14px; color: #64748b; margin-top: 5px; }")
    H("table { width: 100%; border-collapse: collapse; margin: 15px 0; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }")
    H("th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }")
    H("th { background: #f1f5f9; font-weight: 600; color: #475569; }")
    H("tr:hover { background: #f8fafc; }")
    H(".badge { padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }")
    H(".badge-active { background: #dcfce7; color: #166534; }")
    H(".badge-duplicate { background: #fef3c7; color: #92400e; }")
    H(".badge-conflict { background: #fee2e2; color: #991b1b; }")
    H(".badge-uncertain { background: #e0e7ff; color: #3730a3; }")
    H(".group-card { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }")
    H("</style></head><body>")
    
    H("<h1>SMSWS Rule Normalization & Deduplication Report</h1>")
    H("<p>Smart Maharashtra Single Window System &mdash; Policy Engine Candidate Rule Cleaning Layer</p>")

    H("<div class='card-grid'>")
    H(f"<div class='card'><div class='num'>{total_candidate_rules}</div><div class='label'>Candidate Rules Before</div></div>")
    H(f"<div class='card ok'><div class='num'>{total_canonical_rules}</div><div class='label'>Canonical Rules After</div></div>")
    H(f"<div class='card ok'><div class='num'>{multi_source_rules}</div><div class='label'>Multi-Source Clusters</div></div>")
    H(f"<div class='card'><div class='num'>{exact_dups + near_dups}</div><div class='label'>Total Duplicate Relations</div></div>")
    H(f"<div class='card danger'><div class='num'>{conflicts}</div><div class='label'>Possible Conflicts Preserved</div></div>")
    H(f"<div class='card warn'><div class='num'>{uncertains}</div><div class='label'>Uncertain Groups</div></div>")
    H("</div>")

    H("<h2>1. Duplicate Groups (Multi-Source Provenance)</h2>")
    for dg in duplicate_groups:
        H("<div class='group-card'>")
        H(f"<h3><span class='badge badge-active'>{dg['canonical_rule_id']}</span> {dg['rule_name']}</h3>")
        H(f"<p><strong>Sector:</strong> {dg['policy_sector']} | <strong>Sources:</strong> {dg['source_count']} | <strong>Confidence:</strong> {dg['confidence']:.2f}</p>")
        H(f"<p style='color: #475569; font-size: 13px;'><em>{'; '.join(dg['reasons'])}</em></p>")
        H("<table><thead><tr><th>Rule ID</th><th>Status</th><th>Document</th><th>Pages</th><th>Chunk ID</th><th>Official Source</th></tr></thead><tbody>")
        for s in dg["sources"]:
            b_cls = "badge-active" if s["is_primary"] else "badge-duplicate"
            b_txt = "Primary" if s["is_primary"] else "Duplicate"
            pg = f"Page {s['page_start']}-{s['page_end']}" if s['page_start'] else "N/A"
            link = f"<a href='{s['source_url']}' target='_blank'>Official Link</a>" if s['source_url'] else "N/A"
            H(f"<tr><td>#{s['rule_id']}</td><td><span class='badge {b_cls}'>{b_txt}</span></td><td>{s['filename']}</td><td>{pg}</td><td><code>{s['chunk_id'][:12]}...</code></td><td>{link}</td></tr>")
        H("</tbody></table></div>")

    H("<h2>2. Conflicting & Ambiguous Rule Pairs</h2>")
    H("<table><thead><tr><th>Rel ID</th><th>Type</th><th>Rule A</th><th>Rule B</th><th>Reason</th></tr></thead><tbody>")
    for ap in ambiguous_pairs:
        b_cls = "badge-conflict" if ap["relationship_type"] == "POSSIBLE_CONFLICT" else "badge-uncertain"
        H(f"<tr><td>#{ap['relationship_id']}</td><td><span class='badge {b_cls}'>{ap['relationship_type']}</span></td>")
        H(f"<td><strong>#{ap['source_rule_id']}</strong> {ap['source_rule_name']}<br><small style='color:#64748b;'>{ap['source_file']}</small></td>")
        H(f"<td><strong>#{ap['target_rule_id']}</strong> {ap['target_rule_name']}<br><small style='color:#64748b;'>{ap['target_file']}</small></td>")
        H(f"<td>{ap['reason']}</td></tr>")
    H("</tbody></table>")

    H("</body></html>")

    html_path = os.path.join(out_dir, "rule_deduplication_report.html")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_lines))

    print(f"[deduplication_report] Wrote {md_path}")
    print(f"[deduplication_report] Wrote {html_path}")

    return {
        "candidate_rules_before": total_candidate_rules,
        "canonical_rules_after": total_canonical_rules,
        "multi_source_canonical_count": multi_source_rules,
        "standalone_canonical_count": standalone_rules,
        "exact_duplicates": exact_dups,
        "near_duplicates": near_dups,
        "possible_conflicts": conflicts,
        "possible_amendments": amendments,
        "uncertains": uncertains
    }

if __name__ == "__main__":
    generate_deduplication_report()
