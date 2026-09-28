"""
src/api/main.py
---------------
FastAPI application for the SMSWS backend.

Endpoints:
  GET  /api/health         — Health check
  GET  /api/health/db      — Detailed DB health
  POST /api/assessment     — Run full assessment for an ApplicantProfile
  GET  /api/sources/{id}   — Retrieve a single source chunk by chunk_id
  GET  /api/forms          — Return form requirements, optionally filtered by sector
"""

from __future__ import annotations

import os
import sqlite3
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from src.models import (
    ApplicantProfile, AssessmentResponse, SourceEvidence,
    FormRequirement, FormField, FormSubmissionCreate, FormSubmissionRecord,
)
from src.assessment import run_assessment
from src.retrieval import LexicalRetriever
from src.api.auth import auth_router
from src.api.support import support_router

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("smsws.api")

# ── DB path resolution ────────────────────────────────────────────────────────
_HERE = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
DB_PATH = os.environ.get("SMSWS_DB_PATH", os.path.join(_PROJECT_ROOT, "db", "policy_engine.db"))

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SMSWS Policy Engine API",
    description=(
        "Smart Maharashtra Single Window System — preliminary assessment API. "
        "Read-only access to the knowledge base. No Gemini. No data modification."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(support_router)



# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health() -> dict:
    """Health check — verifies DB is accessible."""
    db_exists = os.path.exists(DB_PATH)
    return {
        "status": "ok",
        "db_path": DB_PATH,
        "db_exists": db_exists,
        "version": "0.2.0",
        "gemini_active": False,
    }


@app.post("/api/assessment", response_model=AssessmentResponse)
def assessment(profile: ApplicantProfile) -> AssessmentResponse:
    """
    Run a full preliminary assessment for the submitted ApplicantProfile.

    Returns applicable policy pathways, approvals, incentives, and
    actual source evidence from the knowledge base.
    """
    logger.info(
        "Assessment request: entity=%s sector=%s stage=%s district=%s inv=%s",
        profile.entity_name,
        profile.sector.value,
        profile.stage.value,
        profile.district,
        profile.investment_inr,
    )
    try:
        response = run_assessment(profile, db_path=DB_PATH)
        # Enrich source_url on evidence items
        _enrich_source_urls(response.sources)
        return response
    except Exception as e:
        logger.error("Assessment error: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Assessment failed: {e}")


@app.get("/api/sources/{chunk_id}", response_model=SourceEvidence)
def get_source(chunk_id: str) -> SourceEvidence:
    """
    Retrieve full text and provenance for a single source chunk.

    Used by the frontend source-detail view.
    """
    retriever = LexicalRetriever(db_path=DB_PATH)
    evidence = retriever.get_chunk_by_id(chunk_id)
    if not evidence:
        raise HTTPException(status_code=404, detail=f"Chunk '{chunk_id}' not found")
    # Enrich source_url
    _enrich_source_urls([evidence])
    return evidence



@app.get("/api/forms", response_model=list[FormRequirement])
def get_forms(
    sector: Optional[str] = Query(None, description="Filter by policy_sector (case-insensitive partial match)"),
    limit: int = Query(100, ge=1, le=500, description="Max results to return"),
    offset: int = Query(0, ge=0),
    deduplicate: bool = Query(True, description="Filter out exact duplicate forms"),
) -> list[FormRequirement]:
    """
    Return extracted form requirements from the government policy corpus.
    Deduplicates duplicate forms by default and attaches field-level blueprints.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not available")

    conn = _get_conn()
    try:
        base_query = """
            SELECT
                fr.form_requirement_id,
                fr.canonical_rule_id,
                fr.rule_id,
                fr.document_id,
                fr.chunk_id,
                fr.form_name,
                fr.form_number,
                fr.form_type,
                fr.required,
                fr.condition,
                fr.applicant_scope,
                fr.submission_method,
                fr.reference_type,
                fr.evidence_text,
                fr.page_start,
                fr.page_end,
                fr.confidence,
                d.filename,
                d.source_url,
                cr.rule_name,
                cr.policy_sector
            FROM form_requirements fr
            LEFT JOIN documents d ON d.document_id = fr.document_id
            LEFT JOIN candidate_rules cr ON cr.rule_id = fr.rule_id
        """
        params: list = []

        if sector:
            base_query += " WHERE LOWER(cr.policy_sector) LIKE ?"
            params.append(f"%{sector.lower()}%")

        base_query += " ORDER BY fr.confidence DESC, fr.form_requirement_id ASC"

        rows = conn.execute(base_query, params).fetchall()

        # Deduplicate forms if requested
        import re
        seen = set()
        unique_rows = []
        for r in rows:
            d = dict(r)
            if deduplicate:
                name_norm = re.sub(r'[\W_]+', ' ', (d.get('form_name') or '').lower()).strip()
                num_norm = re.sub(r'[^a-z0-9]', '', (d.get('form_number') or '').lower())
                key = (name_norm, num_norm)
                if key in seen and name_norm not in {'application form', 'common undertaking', 'affidavit'}:
                    continue
                seen.add(key)
            unique_rows.append(d)

        # Slice limit/offset after deduplication
        sliced = unique_rows[offset : offset + limit]

        # Fetch form_fields for sliced forms
        form_objs = []
        for d in sliced:
            form_id = d["form_requirement_id"]
            field_rows = conn.execute(
                "SELECT * FROM form_fields WHERE form_requirement_id = ? ORDER BY field_order ASC",
                (form_id,),
            ).fetchall()
            d["fields"] = [dict(fr) for fr in field_rows]
            form_objs.append(FormRequirement.from_row(d))

    finally:
        conn.close()

    return form_objs


@app.get("/api/forms/{form_requirement_id}/fields", response_model=list[FormField])
def get_form_fields(form_requirement_id: int) -> list[FormField]:
    """Retrieve field-level blueprint for a single form requirement."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not available")

    conn = _get_conn()
    try:
        rows = conn.execute(
            "SELECT * FROM form_fields WHERE form_requirement_id = ? ORDER BY field_order ASC",
            (form_requirement_id,),
        ).fetchall()
        return [FormField(**dict(r)) for r in rows]
    finally:
        conn.close()

@app.post("/api/form-submissions")
def create_form_submissions(payload: FormSubmissionCreate) -> dict:
    """
    Saves user-filled form responses mapped back to each individual form requirement.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not available")

    conn = _get_conn()
    saved_ids = []
    try:
        import json
        for item in payload.submissions:
            cur = conn.execute("""
                INSERT INTO form_submissions (
                    project_id, entity_name, form_requirement_id, form_name, form_number, collected_values_json
                ) VALUES (?, ?, ?, ?, ?, ?);
            """, (
                payload.project_id,
                payload.entity_name,
                item.form_requirement_id,
                item.form_name,
                item.form_number,
                json.dumps(item.collected_values, ensure_ascii=False),
            ))
            saved_ids.append(cur.lastrowid)
        conn.commit()
    finally:
        conn.close()

    return {"status": "ok", "saved_submissions_count": len(saved_ids), "submission_ids": saved_ids}


@app.get("/api/form-submissions")
def get_form_submissions(project_id: Optional[str] = Query(None)) -> list[dict]:
    """Retrieve saved form submissions for a project or all submissions."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not available")

    conn = _get_conn()
    try:
        import json
        if project_id:
            rows = conn.execute(
                "SELECT * FROM form_submissions WHERE project_id = ? ORDER BY created_at DESC",
                (project_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 100").fetchall()
        
        results = []
        for r in rows:
            d = dict(r)
            try:
                d["collected_values"] = json.loads(d.get("collected_values_json") or "{}")
            except Exception:
                d["collected_values"] = {}
            results.append(d)
    finally:
        conn.close()

    return results


@app.get("/api/canonical-rules")
def get_canonical_rules(
    sector: Optional[str] = Query(None, description="Filter by sector keyword"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    """Return canonical rules list with criteria and incentives."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not available")
    conn = _get_conn()
    try:
        base_query = """
            SELECT
                canonical_rule_id, rule_name, policy_sector, normalized_name,
                eligibility_criteria_json, incentive_details_json,
                effective_date, expiry_date, confidence, source_count, has_form_requirement, form_count
            FROM canonical_rules
        """
        params: list = []
        if sector:
            base_query += " WHERE LOWER(policy_sector) LIKE ?"
            params.append(f"%{sector.lower()}%")
        base_query += " ORDER BY source_count DESC, confidence DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])
        rows = conn.execute(base_query, params).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM canonical_rules").fetchone()[0]
    finally:
        conn.close()
    return {"total": total, "rules": [dict(r) for r in rows]}


@app.get("/api/documents")
def get_documents(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    """Return document corpus inventory."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=503, detail="Database not available")
    conn = _get_conn()
    try:
        rows = conn.execute(
            """
            SELECT document_id, filename, source_url, page_count, created_at
            FROM documents
            ORDER BY page_count DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()
        total = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
    finally:
        conn.close()
    return {"total": total, "documents": [dict(r) for r in rows]}


@app.get("/api/health/db")
def db_health() -> dict:
    """Detailed DB health with document and rule counts."""
    if not os.path.exists(DB_PATH):
        return {"status": "error", "message": "Database file not found", "db_path": DB_PATH}
    try:
        conn = _get_conn()
        doc_count = conn.execute("SELECT COUNT(*) FROM documents").fetchone()[0]
        extracted = conn.execute(
            "SELECT COUNT(*) FROM documents WHERE processing_status='EXTRACTED'"
        ).fetchone()[0]
        chunks = conn.execute("SELECT COUNT(*) FROM source_chunks").fetchone()[0]
        candidate_rules = conn.execute("SELECT COUNT(*) FROM candidate_rules").fetchone()[0]
        canonical_rules = conn.execute("SELECT COUNT(*) FROM canonical_rules").fetchone()[0]
        form_reqs = conn.execute("SELECT COUNT(*) FROM form_requirements").fetchone()[0]
        conn.close()
        return {
            "status": "ok",
            "documents": doc_count,
            "extracted": extracted,
            "chunks": chunks,
            "candidate_rules": candidate_rules,
            "canonical_rules": canonical_rules,
            "form_requirements": form_reqs,
            "gemini_active": False,
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── Internal helpers ───────────────────────────────────────────────────────────

def _enrich_source_urls(evidence_list: list[SourceEvidence]) -> None:
    """
    In-place: look up source_url from documents table and attach to each
    SourceEvidence item. Batches lookups by document_id.
    """
    if not evidence_list or not os.path.exists(DB_PATH):
        return

    doc_ids = list({ev.document_id for ev in evidence_list if ev.document_id})
    if not doc_ids:
        return

    conn = _get_conn()
    try:
        placeholders = ",".join("?" * len(doc_ids))
        rows = conn.execute(
            f"SELECT document_id, source_url FROM documents WHERE document_id IN ({placeholders})",
            doc_ids,
        ).fetchall()
    finally:
        conn.close()

    url_map = {r["document_id"]: r["source_url"] for r in rows}
    for ev in evidence_list:
        if ev.document_id in url_map:
            ev.source_url = url_map[ev.document_id]
