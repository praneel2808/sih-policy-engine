"""
Gemini Candidate Rule Extractor Module.
Uses LLM strictly to extract candidate rules from policy document chunks.
Validates LLM candidate rules using Pydantic models.
Includes batching, rate-limiting for Free Tier, and fault tolerance.
"""

import os
import json
import logging
import time
import sqlite3
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types

from src.database import DatabaseManager

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Pydantic Schemas for Structured LLM Extraction
# ---------------------------------------------------------------------------
class EligibilityCriteria(BaseModel):
    min_capital_investment_inr: Optional[float] = Field(None, description="Minimum capital investment required in INR")
    eligible_entity_types: List[str] = Field(default_factory=list, description="Micro, Small, Medium, Large, Mega, Ultra Mega")
    eligible_taluka_categories: List[str] = Field(default_factory=list, description="A, B, C, D, D+, Naxal Affected")
    employment_threshold: Optional[int] = Field(None, description="Minimum employment count required")
    target_demographics: List[str] = Field(default_factory=list, description="Specific groups targeted (e.g. Women, SC/ST, Ex-Servicemen)")
    negative_list_industries: List[str] = Field(default_factory=list, description="Industries explicitly excluded (e.g. tobacco, alcohol)")
    is_export_oriented: Optional[bool] = Field(None, description="True if applies to Export Oriented Units. False if not. Null if not mentioned.")
    specific_conditions: List[str] = Field(default_factory=list, description="Additional compliance conditions")

class IncentiveDetail(BaseModel):
    incentive_type: str = Field(..., description="e.g. Capital Subsidy, Stamp Duty Exemption, Electricity Duty Waiver, IPS")
    max_amount_inr: Optional[float] = Field(None, description="Cap on incentive amount if stated")
    percentage_reimbursement: Optional[float] = Field(None, description="Percentage rate of subsidy/waiver")
    duration_years: Optional[float] = Field(None, description="Validity duration in years")
    is_additional_incentive: Optional[bool] = Field(None, description="True if this is a top-up subsidy stacking on another. Null if not mentioned.")
    disbursement_frequency: Optional[str] = Field(None, description="e.g. Upfront, Annually, Reimbursed post-production. Null if not mentioned.")
    conditions: List[str] = Field(default_factory=list, description="Incentive specific eligibility conditions")

class CandidateRule(BaseModel):
    chunk_id: str = Field(..., description="The chunk_id from which this rule was extracted")
    rule_name: str = Field(..., description="Short descriptive name of the policy rule")
    policy_sector: str = Field(..., description="Target industry sector")
    effective_date: Optional[str] = Field(None, description="Effective start date YYYY-MM-DD")
    expiry_date: Optional[str] = Field(None, description="Expiry date YYYY-MM-DD if specified")
    supersedes_clause_detected: bool = Field(False, description="True if document explicitly claims to supersede an older GR")
    eligibility_criteria: EligibilityCriteria = Field(..., description="Structured eligibility conditions")
    incentives: List[IncentiveDetail] = Field(default_factory=list, description="Offered incentives under this rule")

class RuleExtractionResult(BaseModel):
    rules: List[CandidateRule] = Field(default_factory=list, description="List of rules extracted from the provided chunks. Empty if no rules found.")

# ---------------------------------------------------------------------------
# Extractor Class
# ---------------------------------------------------------------------------
class GeminiRuleExtractor:
    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        load_dotenv()
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY is not set in the environment or .env file.")
        
        self.client = genai.Client(api_key=self.api_key)
        self.db_manager = db_manager or DatabaseManager()
        # Ensure table exists
        self._init_table()

    def _init_table(self):
        with self.db_manager.get_connection() as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS candidate_rules (
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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(document_id) REFERENCES documents(document_id),
                FOREIGN KEY(chunk_id) REFERENCES source_chunks(chunk_id)
            );
            """)
            conn.commit()

    def get_unprocessed_chunks(self) -> List[sqlite3.Row]:
        """Fetch chunks that haven't been processed yet."""
        with self.db_manager.get_connection() as conn:
            # We track processed chunks implicitly by checking if they exist in candidate_rules
            # But wait, what if a chunk has NO rules? We need a way to mark it as processed.
            # For simplicity, we'll use a new table to track processed chunks.
            conn.execute("""
            CREATE TABLE IF NOT EXISTS chunk_extraction_log (
                chunk_id TEXT PRIMARY KEY,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            
            query = """
                SELECT c.chunk_id, c.document_id, c.verbatim_text 
                FROM source_chunks c
                LEFT JOIN chunk_extraction_log l ON c.chunk_id = l.chunk_id
                WHERE l.chunk_id IS NULL
            """
            return conn.execute(query).fetchall()

    def mark_chunks_processed(self, chunk_ids: List[str]):
        with self.db_manager.get_connection() as conn:
            for cid in chunk_ids:
                conn.execute("INSERT OR IGNORE INTO chunk_extraction_log (chunk_id) VALUES (?)", (cid,))
            conn.commit()

    def save_rules(self, doc_id: str, rules: List[CandidateRule]):
        with self.db_manager.get_connection() as conn:
            for rule in rules:
                conn.execute(
                    """
                    INSERT INTO candidate_rules (
                        document_id, chunk_id, rule_name, policy_sector,
                        eligibility_criteria_json, incentive_details_json,
                        effective_date, expiry_date, supersedes_clause_detected, 
                        pydantic_validated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    """,
                    (
                        doc_id,
                        rule.chunk_id,
                        rule.rule_name,
                        rule.policy_sector,
                        rule.eligibility_criteria.model_dump_json(),
                        json.dumps([inc.model_dump() for inc in rule.incentives]),
                        rule.effective_date,
                        rule.expiry_date,
                        1 if rule.supersedes_clause_detected else 0
                    )
                )
            conn.commit()

    def process_all_chunks(self, batch_size: int = 6, delay_seconds: float = 4.5):
        """Processes all unextracted chunks in batches, respecting rate limits."""
        unprocessed = self.get_unprocessed_chunks()
        logger.info(f"Found {len(unprocessed)} unprocessed chunks. Starting extraction...")

        # Group by document to avoid mixing contexts unnecessarily
        from collections import defaultdict
        docs_to_chunks = defaultdict(list)
        for row in unprocessed:
            docs_to_chunks[row["document_id"]].append(dict(row))

        total_batches = 0
        for doc_id, chunks in docs_to_chunks.items():
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                chunk_ids = [c["chunk_id"] for c in batch]
                
                # Format a robust, high-quality prompt for legal policy extraction
                prompt = """You are an expert Legal Policy Extraction Assistant specializing in Maharashtra State Industrial Policies (e.g., MAITRI, IT/ITES, PSI, Labour Codes).
Your task is to meticulously extract Candidate Rules, Eligibility Criteria, and Financial Incentives from the provided text chunks.

CRITICAL INSTRUCTIONS:
1. ACCURACY: Extract precise financial figures, percentages, and duration limits. Do not hallucinate or guess.
2. MISSING DATA: If a specific detail (like 'is_export_oriented' or 'disbursement_frequency') is not explicitly mentioned in the text, you MUST leave it as null/empty. Do not assume 'False' just because it is missing.
3. CHUNK MAPPING: You are processing a batch of chunks. You must map each extracted rule precisely to the `chunk_id` it was found in.
4. IRRELEVANT CHUNKS: If a chunk contains administrative preamble, table of contents, or no actionable rules/incentives, simply omit it from your response. Do not force an extraction.

Below are the text chunks to process:
"""
                for c in batch:
                    prompt += f"--- START CHUNK (ID: {c['chunk_id']}) ---\n{c['verbatim_text']}\n--- END CHUNK ---\n\n"

                success = False
                attempts = 0
                while not success and attempts < 3:
                    try:
                        logger.info(f"Processing doc {doc_id} - batch {i//batch_size + 1} ({len(batch)} chunks)")
                        response = self.client.models.generate_content(
                            model='gemini-3.5-flash-lite',
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json",
                                response_schema=RuleExtractionResult,
                                temperature=0.1,
                            ),
                        )
                        
                        # Parse the validated structured response
                        result = RuleExtractionResult.model_validate_json(response.text)
                        
                        # Save extracted rules
                        if result.rules:
                            self.save_rules(doc_id, result.rules)
                            logger.info(f"  -> Extracted {len(result.rules)} rules from this batch.")
                        else:
                            logger.info("  -> No rules found in this batch.")

                        # Mark chunks as successfully processed
                        self.mark_chunks_processed(chunk_ids)
                        success = True
                        
                        # Rate limit delay for Free Tier (15 RPM max)
                        time.sleep(delay_seconds)

                    except Exception as e:
                        attempts += 1
                        logger.warning(f"Error on attempt {attempts}: {e}")
                        if "429" in str(e) or "quota" in str(e).lower():
                            logger.info("Rate limit hit. Waiting 15 seconds before retry...")
                            time.sleep(15)
                        else:
                            time.sleep(5)
                
                total_batches += 1

        logger.info(f"Extraction complete! Processed {total_batches} batches.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
    # Run the extraction engine
    extractor = GeminiRuleExtractor()
    extractor.process_all_chunks(batch_size=6, delay_seconds=4.5)
