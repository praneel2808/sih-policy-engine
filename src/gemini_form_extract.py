"""
Gemini Form and Submission Requirements Extractor Module.
Extracts procedural application forms, annexures, proformas, and affidavits
linked directly to candidate policy rules and source chunks.

Supports:
1. Rule-guided form extraction: sends chunk text + existing extracted rules to Gemini.
2. Structured output validation with Pydantic.
3. Multi-source provenance linking: form_requirement -> canonical_rule -> candidate_rule -> chunk -> document.
4. Idempotent insertion and progress tracking.
"""

import os
import json
import time
import logging
import sqlite3
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

from src.database import DatabaseManager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic Schemas for Form Extraction Validation
# ---------------------------------------------------------------------------

class FormRequirementDetail(BaseModel):
    chunk_id: str = Field(..., description="The chunk_id where this form requirement was identified")
    associated_rule_id: Optional[int] = Field(None, description="The rule_id this form submission belongs to, if applicable")
    form_name: str = Field(..., description="Full descriptive name of the form, proforma, or application")
    form_number: Optional[str] = Field(None, description="Official form number or identifier e.g. Form I, Annexure B, Schedule II")
    form_type: str = Field(
        ...,
        description="One of: APPLICATION_FORM, PRESCRIBED_FORM, APPLICATION_FORMAT, PROFORMA, ANNEXURE, SCHEDULE, CHECKLIST, UNDERTAKING, DECLARATION, AFFIDAVIT, RENEWAL_FORM, CLAIM_FORM, RETURN_REPORTING_FORM, OTHER, UNKNOWN"
    )
    required: bool = Field(True, description="True if mandatory for obtaining the incentive/approval, False if optional")
    condition: Optional[str] = Field(None, description="Specific condition triggering this form requirement")
    applicant_scope: Optional[str] = Field(None, description="Which entity types or units must submit this form")
    submission_method: Optional[str] = Field(None, description="ONLINE_PORTAL, PHYSICAL_DESK, EMAIL, or NOT_SPECIFIED")
    reference_type: Optional[str] = Field(None, description="STATUTORY_PRESCRIBED, PROCEDURAL_GUIDELINE, or SUPPORTING_ATTACHMENT")
    evidence_text: str = Field(..., description="Exact verbatim text snippet from the chunk referencing the form")
    confidence: float = Field(1.0, description="Confidence score between 0.0 and 1.0")


class ChunkFormExtractionResult(BaseModel):
    forms: List[FormRequirementDetail] = Field(
        default_factory=list,
        description="List of statutory forms/submissions identified. Return empty list if no forms are mentioned."
    )


# ---------------------------------------------------------------------------
# Extractor Class
# ---------------------------------------------------------------------------

class GeminiFormExtractor:
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.db_manager = db_manager or DatabaseManager()
        self.client = None
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)

    def get_rule_chunks_to_process(self) -> List[Dict[str, Any]]:
        """
        Retrieves all source chunks that produced candidate rules,
        grouped with their associated rule IDs and rule names.
        """
        with self.db_manager.get_connection() as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Create extraction tracking table if not exists
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS form_extraction_log (
                chunk_id TEXT PRIMARY KEY,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)

            query = """
                SELECT 
                    c.chunk_id,
                    c.document_id,
                    c.page_start,
                    c.page_end,
                    c.verbatim_text,
                    r.rule_id,
                    r.rule_name,
                    r.policy_sector,
                    r.canonical_rule_id
                FROM source_chunks c
                JOIN candidate_rules r ON c.chunk_id = r.chunk_id
                LEFT JOIN form_extraction_log l ON c.chunk_id = l.chunk_id
                WHERE l.chunk_id IS NULL
                ORDER BY c.chunk_id, r.rule_id
            """
            rows = cursor.execute(query).fetchall()

            # Group rules by chunk
            from collections import defaultdict
            chunk_dict = defaultdict(lambda: {"rules": [], "chunk_data": None})
            
            for row in rows:
                cid = row["chunk_id"]
                if chunk_dict[cid]["chunk_data"] is None:
                    chunk_dict[cid]["chunk_data"] = {
                        "chunk_id": row["chunk_id"],
                        "document_id": row["document_id"],
                        "page_start": row["page_start"],
                        "page_end": row["page_end"],
                        "verbatim_text": row["verbatim_text"]
                    }
                chunk_dict[cid]["rules"].append({
                    "rule_id": row["rule_id"],
                    "rule_name": row["rule_name"],
                    "policy_sector": row["policy_sector"],
                    "canonical_rule_id": row["canonical_rule_id"]
                })

            return list(chunk_dict.values())

    def save_form_requirements(self, forms: List[FormRequirementDetail], chunk_meta: Dict[str, Any]):
        """
        Saves extracted form requirements to the database and updates
        form_count and has_form_requirement on candidate and canonical rules.
        """
        if not forms:
            return

        with self.db_manager.get_connection() as conn:
            cursor = conn.cursor()
            
            for f in forms:
                rule_id = f.associated_rule_id
                canonical_rule_id = None
                
                # Lookup canonical_rule_id for this candidate rule
                if rule_id:
                    canon_row = cursor.execute(
                        "SELECT canonical_rule_id FROM candidate_rules WHERE rule_id = ?",
                        (rule_id,)
                    ).fetchone()
                    if canon_row:
                        canonical_rule_id = canon_row[0]

                cursor.execute("""
                    INSERT INTO form_requirements (
                        canonical_rule_id, rule_id, document_id, chunk_id,
                        form_name, form_number, form_type, required, condition,
                        applicant_scope, submission_method, reference_type,
                        evidence_text, page_start, page_end, confidence
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(chunk_id, rule_id, form_name, form_number) DO UPDATE SET
                        form_type=excluded.form_type,
                        required=excluded.required,
                        condition=excluded.condition,
                        evidence_text=excluded.evidence_text,
                        confidence=excluded.confidence
                """, (
                    canonical_rule_id,
                    rule_id,
                    chunk_meta["document_id"],
                    chunk_meta["chunk_id"],
                    f.form_name,
                    f.form_number,
                    f.form_type,
                    1 if f.required else 0,
                    f.condition,
                    f.applicant_scope,
                    f.submission_method,
                    f.reference_type,
                    f.evidence_text,
                    chunk_meta.get("page_start"),
                    chunk_meta.get("page_end"),
                    f.confidence
                ))

                # Update candidate_rules tracking
                if rule_id:
                    cursor.execute("""
                        UPDATE candidate_rules
                        SET has_form_requirement = 1,
                            form_count = (SELECT COUNT(*) FROM form_requirements WHERE rule_id = ?)
                        WHERE rule_id = ?
                    """, (rule_id, rule_id))

                # Update canonical_rules tracking
                if canonical_rule_id:
                    cursor.execute("""
                        UPDATE canonical_rules
                        SET has_form_requirement = 1,
                            form_count = (SELECT COUNT(*) FROM form_requirements WHERE canonical_rule_id = ?)
                        WHERE canonical_rule_id = ?
                    """, (canonical_rule_id, canonical_rule_id))

            conn.commit()

    def mark_chunk_processed(self, chunk_id: str):
        with self.db_manager.get_connection() as conn:
            conn.execute("INSERT OR REPLACE INTO form_extraction_log (chunk_id) VALUES (?)", (chunk_id,))
            conn.commit()

    def process_all_chunks(self, batch_size: int = 5, delay_seconds: float = 4.5):
        """
        Processes chunks for form requirement extraction using Gemini.
        Ready for manual execution by user in terminal.
        """
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not set. Please add it to .env before running.")

        chunks_to_process = self.get_rule_chunks_to_process()
        total_chunks = len(chunks_to_process)
        logger.info(f"Found {total_chunks} rule-associated chunks to process for form requirements.")

        if total_chunks == 0:
            logger.info("All rule-associated chunks have already been processed!")
            return

        for i in range(0, total_chunks, batch_size):
            batch = chunks_to_process[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1} / {(total_chunks + batch_size - 1)//batch_size} ({len(batch)} chunks)")

            # Build prompt with rule context
            prompt = """You are an expert Legal Policy & Regulatory Compliance Analyst.
Analyze each source chunk and its associated candidate rules.
Extract any application forms, annexures, proformas, declarations, affidavits, or schedules that applicants must submit.
If a chunk contains no form or application submission requirement, return forms: []. Do not invent forms.

Below are the text chunks and their associated rules:
"""
            for item in batch:
                c = item["chunk_data"]
                rules = item["rules"]
                prompt += f"\n--- START CHUNK (ID: {c['chunk_id']}, Pages: {c['page_start']}-{c['page_end']}) ---\n"
                prompt += "Associated Rules in this Chunk:\n"
                for r in rules:
                    prompt += f"  - Rule ID #{r['rule_id']} | '{r['rule_name']}' | Sector: '{r['policy_sector']}'\n"
                prompt += f"Chunk Text:\n{c['verbatim_text']}\n--- END CHUNK ---\n"

            success = False
            attempts = 0
            while not success and attempts < 3:
                try:
                    response = self.client.models.generate_content(
                        model='gemini-3.5-flash-lite',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=ChunkFormExtractionResult,
                            temperature=0.1,
                        ),
                    )

                    result = ChunkFormExtractionResult.model_validate_json(response.text)
                    
                    # Group forms by chunk_id and save
                    from collections import defaultdict
                    forms_by_chunk = defaultdict(list)
                    for f in result.forms:
                        forms_by_chunk[f.chunk_id].append(f)

                    for item in batch:
                        c_id = item["chunk_data"]["chunk_id"]
                        chunk_forms = forms_by_chunk.get(c_id, [])
                        self.save_form_requirements(chunk_forms, item["chunk_data"])
                        self.mark_chunk_processed(c_id)
                        if chunk_forms:
                            logger.info(f"  -> Extracted {len(chunk_forms)} form requirements for chunk {c_id[:12]}")

                    success = True
                    time.sleep(delay_seconds)

                except Exception as e:
                    attempts += 1
                    logger.warning(f"Error on attempt {attempts}: {e}")
                    if "429" in str(e) or "quota" in str(e).lower():
                        logger.info("Rate limit hit. Waiting 20 seconds...")
                        time.sleep(20)
                    else:
                        time.sleep(5)

        logger.info("Form requirement extraction complete!")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
    extractor = GeminiFormExtractor()
    extractor.process_all_chunks(batch_size=5, delay_seconds=4.5)
