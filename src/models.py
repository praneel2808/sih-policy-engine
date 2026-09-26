"""
src/models.py
-------------
Shared Pydantic models for the SMSWS assessment API.

ApplicantProfile is the canonical input to the rules engine and RAG retrieval.
AssessmentResponse is the canonical output returned to the frontend.
"""

from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator


# ─── Enums ────────────────────────────────────────────────────────────────────

class EntityType(str, Enum):
    company = "Company"
    llp = "LLP"
    proprietorship = "Proprietorship"


class Sector(str, Enum):
    chemical = "Chemical"
    textile = "Textile"
    engineering = "Engineering"
    food_processing = "Food Processing"
    ev_automotive = "EV / Automotive"
    electronics = "Electronics"
    it_ites = "IT / ITES"
    logistics = "Logistics"
    aerospace = "Aerospace"
    startup = "Startup"
    other = "Other"


class LocationType(str, Enum):
    midc = "MIDC"
    private_industrial = "Private industrial area"
    other = "Other"


class ProjectStage(str, Enum):
    pre_establishment = "Pre-establishment"
    construction = "Construction"
    operational = "Operational"
    expansion = "Expansion"


# ─── Input ────────────────────────────────────────────────────────────────────

class ApplicantProfile(BaseModel):
    """Structured project profile collected from the 5-step wizard."""

    # Step 1 — Basic Details
    entity_type: EntityType
    entity_name: str = Field(..., min_length=1, max_length=200)
    pan: Optional[str] = Field(None, max_length=10, description="PAN — not verified against government API")
    registration_number: Optional[str] = Field(None, max_length=50)

    # Step 2 — Industry Details
    sector: Sector
    nic_code: Optional[str] = Field(None, max_length=10)
    product_description: Optional[str] = Field(None, max_length=1000)

    # Step 3 — Location & Land
    district: Optional[str] = Field(None, max_length=100)
    taluka: Optional[str] = Field(None, max_length=100)
    plot_address: Optional[str] = Field(None, max_length=500)
    location_type: Optional[LocationType] = None
    land_area: Optional[float] = Field(None, ge=0, description="Land area in sq. metres or acres")
    survey_number: Optional[str] = Field(None, max_length=50)
    land_document_filename: Optional[str] = Field(None, max_length=255)

    # Step 4 — Investment & Power
    investment_inr: Optional[float] = Field(None, ge=0, description="Investment in INR")
    power_kw: Optional[float] = Field(None, ge=0, description="Power requirement in kW")
    employment_expected: Optional[int] = Field(None, ge=0)

    # Step 5 — Project Stage
    stage: ProjectStage

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) != 10:
            raise ValueError("PAN must be exactly 10 characters")
        return v.upper() if v else v


# ─── Output sub-models ────────────────────────────────────────────────────────

class SourceEvidence(BaseModel):
    """A single retrieved chunk with full provenance."""
    chunk_id: str
    document_id: str
    filename: str
    source_url: Optional[str] = None
    page_start: int
    page_end: int
    section_reference: Optional[str] = None
    extraction_method: Optional[str] = None
    relevance_score: float = 0.0
    text: str


class PolicyPathway(BaseModel):
    name: str
    status: str  # e.g. "potentially_applicable", "not_applicable", "insufficient_evidence"
    reason: str
    evidence: list[SourceEvidence] = []


class ApprovalItem(BaseModel):
    name: str
    stage: str
    status: str
    reason: str
    authority: Optional[str] = None
    evidence: list[SourceEvidence] = []


class IncentiveItem(BaseModel):
    name: str
    status: str
    reason: str
    evidence: list[SourceEvidence] = []


class ProjectSummary(BaseModel):
    entity_name: str
    entity_type: str
    sector: str
    district: Optional[str]
    location_type: Optional[str]
    investment_inr: Optional[float]
    employment_expected: Optional[int]
    stage: str


class AssessmentResponse(BaseModel):
    """Full response returned by POST /api/assessment."""
    project_summary: ProjectSummary
    applicable_policies: list[PolicyPathway] = []
    approvals: list[ApprovalItem] = []
    incentives: list[IncentiveItem] = []
    documents_required: list[str] = []
    warnings: list[str] = []
    sources: list[SourceEvidence] = []
    disclaimer: str = (
        "Preliminary assessment based on the current partial knowledge base. "
        "Final eligibility and approvals are subject to applicable government rules "
        "and competent authorities. This is not legal advice or official government certification."
    )


class FormRequirement(BaseModel):
    """A single extracted form requirement from the government policy corpus."""
    form_requirement_id: int
    canonical_rule_id: Optional[str] = None
    rule_id: Optional[int] = None
    document_id: Optional[str] = None
    chunk_id: Optional[str] = None
    form_name: str
    form_number: Optional[str] = None
    form_type: Optional[str] = None
    required: Optional[str] = None          # stored as text in DB (MANDATORY / CONDITIONAL / etc.)
    condition: Optional[str] = None
    applicant_scope: Optional[str] = None
    submission_method: Optional[str] = None
    reference_type: Optional[str] = None
    evidence_text: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None
    confidence: Optional[float] = None
    # Provenance from documents table
    filename: Optional[str] = None
    source_url: Optional[str] = None
    rule_name: Optional[str] = None
    policy_sector: Optional[str] = None

    model_config = {"populate_by_name": True}

    @classmethod
    def from_row(cls, row: dict) -> "FormRequirement":
        """Coerce SQLite row to FormRequirement, handling int required field."""
        d = dict(row)
        # required column may be stored as int (1/0) or as text
        req = d.get("required")
        if isinstance(req, int):
            d["required"] = "MANDATORY" if req else "CONDITIONAL"
        return cls(**d)

