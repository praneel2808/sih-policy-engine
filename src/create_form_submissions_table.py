"""
src/create_form_submissions_table.py
-------------------------------------
Creates the `form_submissions` table in policy_engine.db.
Stores completed form responses mapped per form_requirement_id.
"""

import sqlite3, sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = r'c:\Users\Praneel Sai Kumar\Desktop\sih_project\sih-policy-engine\db\policy_engine.db'
conn = sqlite3.connect(db_path)
cur = conn.cursor()

print("=== CREATING TABLE form_submissions ===")
cur.execute("""
    CREATE TABLE IF NOT EXISTS form_submissions (
        submission_id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id TEXT,
        entity_name TEXT,
        form_requirement_id INTEGER NOT NULL,
        form_name TEXT,
        form_number TEXT,
        collected_values_json TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(form_requirement_id) REFERENCES form_requirements(form_requirement_id)
    );
""")
conn.commit()

print("=== TABLE SCHEMA: form_submissions ===")
cur.execute("PRAGMA table_info('form_submissions');")
for col in cur.fetchall():
    pk_flag = " (PRIMARY KEY)" if col[5] else ""
    print(f"  • {col[1]}: {col[2]}{pk_flag}")

conn.close()
