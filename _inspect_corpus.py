"""Deep chunk inspection for MVP demo corpus - get English chunks from key docs."""
import sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')

db = sqlite3.connect('db/policy_engine.db')
db.row_factory = sqlite3.Row

# Look at English chunks from specific key documents
key_docs = [
    ("053_Package Scheme", "Package Scheme Incentives 2019"),
    ("029_Integrated", "Textile Policy 2023-28"),
    ("011c_EV Policy", "EV Policy GR 2021"),
    ("047_Electric", "Electric Vehicle Policy"),
    ("048_Electronic", "Electronics Policy 2016"),
    ("060_MAITRI Rules", "MAITRI Rules 2025"),
    ("061_MAITRI Act", "MAITRI Act 2023"),
    ("043_Modification", "MMR Location Policy"),
    ("032a_IT Policy", "IT Policy 2023"),
    ("001_Bamboo", "Bamboo Policy 2025"),
    ("032c_MATRIX", "MATRIX GR 2025"),
    ("018b_Maharashtra New Industrial", "Industrial Policy 2019"),
    ("016_Start-up", "Startup Policy 2018"),
]

for prefix, label in key_docs:
    doc = db.execute("SELECT document_id, filename FROM documents WHERE filename LIKE ? AND processing_status='EXTRACTED'", (f"{prefix}%",)).fetchone()
    if not doc:
        print(f"\n[NOT FOUND] {label}")
        continue
    total_chunks = db.execute("SELECT COUNT(*) FROM source_chunks WHERE document_id=?", (doc['document_id'],)).fetchone()[0]
    # Get first 3 chunks
    chunks = db.execute("""
        SELECT chunk_id, page_start, page_end, verbatim_text 
        FROM source_chunks 
        WHERE document_id=?
        ORDER BY page_start
        LIMIT 3
    """, (doc['document_id'],)).fetchall()
    print(f"\n{'='*60}")
    print(f"[{label}] {doc['filename']} - {total_chunks} chunks")
    for c in chunks:
        txt = (c['verbatim_text'] or '')[:400].replace('\n',' ')
        print(f"  pages={c['page_start']}-{c['page_end']} | {txt[:200]}")

db.close()
