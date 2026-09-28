"""
src/create_form_fields.py
-------------------------
Creates the `form_fields` table in policy_engine.db.
Describes individual fields inside each government form requirement (1-to-many relationship).
Inserts ONE sample field for ONE existing form requirement to verify schema & relationship.
"""

import sqlite3, json, sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = r'c:\Users\Praneel Sai Kumar\Desktop\sih_project\sih-policy-engine\db\policy_engine.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# 1. Create form_fields table
print("=== CREATING TABLE form_fields ===")
cur.execute("""
    CREATE TABLE IF NOT EXISTS form_fields (
        form_field_id INTEGER PRIMARY KEY AUTOINCREMENT,
        form_requirement_id INTEGER NOT NULL,
        field_order INTEGER NOT NULL DEFAULT 1,
        field_name TEXT NOT NULL,
        official_field_label TEXT NOT NULL,
        input_type TEXT NOT NULL DEFAULT 'text',
        required INTEGER NOT NULL DEFAULT 1,
        options TEXT,
        condition TEXT,
        validation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(form_requirement_id) REFERENCES form_requirements(form_requirement_id)
    );
""")
conn.commit()

# Verify PRAGMA table_info
print("=== TABLE SCHEMA: form_fields ===")
cur.execute("PRAGMA table_info('form_fields');")
for col in cur.fetchall():
    pk_flag = " (PRIMARY KEY)" if col['pk'] else ""
    print(f"  • {col['name']}: {col['type']}{pk_flag}")

# 2. Get 1 existing form_requirement_id
cur.execute("SELECT form_requirement_id, form_name, form_number FROM form_requirements ORDER BY form_requirement_id ASC LIMIT 1;")
target_form = dict(cur.fetchone())
target_form_id = target_form['form_requirement_id']
print(f"\nTarget form requirement ID: {target_form_id} | Name: {target_form['form_name']!r}")

# 3. Check if sample field already inserted to avoid duplicate on re-run
cur.execute("SELECT COUNT(*) as cnt FROM form_fields WHERE form_requirement_id = ?;", (target_form_id,))
count_existing = cur.fetchone()['cnt']

if count_existing == 0:
    print(f"Inserting 1 sample field for form_requirement_id = {target_form_id}...")
    sample_field = {
        "form_requirement_id": target_form_id,
        "field_order": 1,
        "field_name": "applicant_name",
        "official_field_label": "Name of the Applicant / Enterprise",
        "input_type": "text",
        "required": 1,
        "options": None,
        "condition": None,
        "validation": json.dumps({"min_length": 2, "max_length": 200})
    }
    
    cur.execute("""
        INSERT INTO form_fields (
            form_requirement_id,
            field_order,
            field_name,
            official_field_label,
            input_type,
            required,
            options,
            condition,
            validation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        sample_field["form_requirement_id"],
        sample_field["field_order"],
        sample_field["field_name"],
        sample_field["official_field_label"],
        sample_field["input_type"],
        sample_field["required"],
        sample_field["options"],
        sample_field["condition"],
        sample_field["validation"]
    ))
    conn.commit()
    print("Sample field inserted successfully!")
else:
    print(f"Sample field already exists for form_requirement_id = {target_form_id}.")

# 4. Verify insertion and relationship query via JOIN
print("\n=== VERIFYING JOIN RELATIONSHIP (form_requirements JOIN form_fields) ===")
cur.execute("""
    SELECT 
        fr.form_requirement_id,
        fr.form_name,
        fr.form_number,
        ff.form_field_id,
        ff.field_order,
        ff.field_name,
        ff.official_field_label,
        ff.input_type,
        ff.required,
        ff.options,
        ff.condition,
        ff.validation
    FROM form_requirements fr
    JOIN form_fields ff ON fr.form_requirement_id = ff.form_requirement_id
    WHERE fr.form_requirement_id = ?;
""", (target_form_id,))

rows = [dict(r) for r in cur.fetchall()]
for r in rows:
    print(json.dumps(r, indent=2, ensure_ascii=False))

conn.close()
