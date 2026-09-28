"""
src/ingest_and_propagate_form_fields.py
---------------------------------------
Ingests the 22 form field definitions into `form_fields`.
Propagates fields to EXACT_DUPLICATE form_requirements.
"""

import sqlite3, json, sys

sys.stdout.reconfigure(encoding='utf-8')

db_path = r'c:\Users\Praneel Sai Kumar\Desktop\sih_project\sih-policy-engine\db\policy_engine.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

user_fields = [
  {
    "form_requirement_id": 26,
    "field_order": 1,
    "field_name": "lending_agency_name_and_address",
    "official_field_label": "Name and address of lending agencies",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 200})
  },
  {
    "form_requirement_id": 26,
    "field_order": 2,
    "field_name": "ifsc_code",
    "official_field_label": "IFSC Code",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 11, "max_length": 11})
  },
  {
    "form_requirement_id": 26,
    "field_order": 3,
    "field_name": "micr_code",
    "official_field_label": "MICR Code",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 9, "max_length": 9})
  },
  {
    "form_requirement_id": 26,
    "field_order": 4,
    "field_name": "powerloom_unit_name_and_address",
    "official_field_label": "Name and address of the powerloom unit.",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 500})
  },
  {
    "form_requirement_id": 26,
    "field_order": 5,
    "field_name": "is_sc_st_minority",
    "official_field_label": "Whether SC/ST/Minority",
    "input_type": "text",
    "required": 1,
    "options": json.dumps(["SC", "ST", "Minority", "None"]),
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 50})
  },
  {
    "form_requirement_id": 26,
    "field_order": 6,
    "field_name": "is_private_or_cooperative",
    "official_field_label": "Whether private or cooperatives",
    "input_type": "text",
    "required": 1,
    "options": json.dumps(["Private", "Cooperative"]),
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 50})
  },
  {
    "form_requirement_id": 26,
    "field_order": 7,
    "field_name": "total_cost_modernisation_project",
    "official_field_label": "Total cost of the modernisation Project sanctioned under TUFS by GOI.",
    "input_type": "number",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_value": 0})
  },
  {
    "form_requirement_id": 26,
    "field_order": 8,
    "field_name": "term_loan_sanction_date",
    "official_field_label": "Date of sanction of Term Loan",
    "input_type": "date",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({})
  },
  {
    "form_requirement_id": 108,
    "field_order": 1,
    "field_name": "lending_agency_name",
    "official_field_label": "Name of lending agency.",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 200})
  },
  {
    "form_requirement_id": 108,
    "field_order": 2,
    "field_name": "nodal_agency_name",
    "official_field_label": "Name of the nodal agency.",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 200})
  },
  {
    "form_requirement_id": 108,
    "field_order": 3,
    "field_name": "ifsc",
    "official_field_label": "IFSC",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 11, "max_length": 11})
  },
  {
    "form_requirement_id": 108,
    "field_order": 4,
    "field_name": "unit_pan_number",
    "official_field_label": "PAN number of the unit",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 10, "max_length": 10})
  },
  {
    "form_requirement_id": 108,
    "field_order": 5,
    "field_name": "micr",
    "official_field_label": "MICR",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 9, "max_length": 9})
  },
  {
    "form_requirement_id": 108,
    "field_order": 6,
    "field_name": "iem_dc_ssi_number",
    "official_field_label": "IEM/DC(SSI) number",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 100})
  },
  {
    "form_requirement_id": 108,
    "field_order": 7,
    "field_name": "unit_name_and_address",
    "official_field_label": "Name and address of unit.",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 500})
  },
  {
    "form_requirement_id": 108,
    "field_order": 8,
    "field_name": "ssi_non_ssi",
    "official_field_label": "SSI/Non-SSI",
    "input_type": "text",
    "required": 1,
    "options": json.dumps(["SSI", "Non-SSI"]),
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 50})
  },
  {
    "form_requirement_id": 109,
    "field_order": 1,
    "field_name": "lending_agencies_name_and_address",
    "official_field_label": "Name and address of lending agencies",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 500})
  },
  {
    "form_requirement_id": 109,
    "field_order": 2,
    "field_name": "nodal_agency_name_form_b",
    "official_field_label": "Name of the nodal agency",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 200})
  },
  {
    "form_requirement_id": 109,
    "field_order": 3,
    "field_name": "state_identification_no",
    "official_field_label": "State Identificatiion No.",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 100})
  },
  {
    "form_requirement_id": 109,
    "field_order": 4,
    "field_name": "borrowers_term_loan_account_number",
    "official_field_label": "Borrowers Term Loan Account Number",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 5, "max_length": 50})
  },
  {
    "form_requirement_id": 109,
    "field_order": 5,
    "field_name": "unit_name_address_taluka_district",
    "official_field_label": "Name and address of the Unit with Taluka and District.",
    "input_type": "text",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({"min_length": 2, "max_length": 500})
  },
  {
    "form_requirement_id": 109,
    "field_order": 6,
    "field_name": "subsidy_claim_period",
    "official_field_label": "Period from which subsidy claim is",
    "input_type": "date",
    "required": 1,
    "options": None,
    "condition": None,
    "validation": json.dumps({})
  }
]

print("=== INGESTING FORM FIELDS INTO form_fields ===")
inserted = 0
for f in user_fields:
    # Check if field already exists for this form_requirement_id and field_name
    cur.execute("""
        SELECT form_field_id FROM form_fields 
        WHERE form_requirement_id = ? AND field_name = ?;
    """, (f["form_requirement_id"], f["field_name"]))
    row = cur.fetchone()
    if not row:
        cur.execute("""
            INSERT INTO form_fields (
                form_requirement_id, field_order, field_name, official_field_label,
                input_type, required, options, condition, validation
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            f["form_requirement_id"], f["field_order"], f["field_name"], f["official_field_label"],
            f["input_type"], f["required"], f["options"], f["condition"], f["validation"]
        ))
        inserted += 1

conn.commit()
print(f"Inserted {inserted} new form fields into `form_fields`.")

# Check EXACT_DUPLICATE form requirements in form_relationships and propagate fields
print("\n=== CHECKING FOR EXACT DUPLICATES IN form_relationships FOR PROPAGATION ===")
target_form_ids = [26, 108, 109]
propagated_cnt = 0

for form_id in target_form_ids:
    # Find all exact duplicate forms of this form_id
    cur.execute("""
        SELECT target_form_requirement_id FROM form_relationships
        WHERE source_form_requirement_id = ? AND relationship_type = 'EXACT_DUPLICATE'
        UNION
        SELECT source_form_requirement_id FROM form_relationships
        WHERE target_form_requirement_id = ? AND relationship_type = 'EXACT_DUPLICATE';
    """, (form_id, form_id))
    
    duplicates = [r[0] for r in cur.fetchall()]
    print(f"Form ID {form_id} has EXACT_DUPLICATE form IDs: {duplicates}")

    # Copy fields to each duplicate form_requirement_id
    cur.execute("SELECT * FROM form_fields WHERE form_requirement_id = ?;", (form_id,))
    source_fields = [dict(r) for r in cur.fetchall()]

    for dup_id in duplicates:
        for sf in source_fields:
            cur.execute("SELECT form_field_id FROM form_fields WHERE form_requirement_id = ? AND field_name = ?;", (dup_id, sf["field_name"]))
            if not cur.fetchone():
                cur.execute("""
                    INSERT INTO form_fields (
                        form_requirement_id, field_order, field_name, official_field_label,
                        input_type, required, options, condition, validation
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    dup_id, sf["field_order"], sf["field_name"], sf["official_field_label"],
                    sf["input_type"], sf["required"], sf["options"], sf["condition"], sf["validation"]
                ))
                propagated_cnt += 1

conn.commit()
print(f"Propagated {propagated_cnt} fields to exact duplicate form requirements.")

# Verify total fields in form_fields
cur.execute("SELECT COUNT(*), COUNT(DISTINCT form_requirement_id) FROM form_fields;")
total_f, total_forms = cur.fetchone()
print(f"\nTotal rows in `form_fields`: {total_f} across {total_forms} unique form requirements.")

conn.close()
