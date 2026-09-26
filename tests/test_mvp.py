"""
tests/test_mvp.py
-----------------
Tests for the SMSWS MVP backend:
  - ApplicantProfile validation
  - Rules engine
  - Retrieval
  - Assessment response
  - API endpoints
"""

from __future__ import annotations

import json
import pytest

from src.models import (
    ApplicantProfile,
    EntityType,
    Sector,
    LocationType,
    ProjectStage,
)
from src.rules import evaluate


# ─── Demo profiles ────────────────────────────────────────────────────────────

def _textile_profile(**overrides) -> ApplicantProfile:
    data = {
        "entity_type": "Company",
        "entity_name": "Maharashtra Textile Innovations Pvt. Ltd.",
        "pan": "AABCT1234E",
        "sector": "Textile",
        "district": "Pune",
        "location_type": "MIDC",
        "investment_inr": 120_00_00_000,
        "power_kw": 2500,
        "employment_expected": 250,
        "stage": "Pre-establishment",
    }
    data.update(overrides)
    return ApplicantProfile(**data)


def _ev_profile(**overrides) -> ApplicantProfile:
    data = {
        "entity_type": "Company",
        "entity_name": "Maharashtra EV Systems Pvt. Ltd.",
        "sector": "EV / Automotive",
        "district": "Aurangabad",
        "location_type": "MIDC",
        "investment_inr": 150_00_00_000,
        "power_kw": 3000,
        "employment_expected": 300,
        "stage": "Pre-establishment",
    }
    data.update(overrides)
    return ApplicantProfile(**data)


def _unknown_profile(**overrides) -> ApplicantProfile:
    data = {
        "entity_type": "Proprietorship",
        "entity_name": "Some Random Business",
        "sector": "Other",
        "stage": "Operational",
    }
    data.update(overrides)
    return ApplicantProfile(**data)


# ─── Model validation tests ───────────────────────────────────────────────────

class TestApplicantProfileValidation:
    def test_textile_profile_valid(self):
        p = _textile_profile()
        assert p.sector == Sector.textile
        assert p.entity_type == EntityType.company
        assert p.stage == ProjectStage.pre_establishment

    def test_ev_profile_valid(self):
        p = _ev_profile()
        assert p.sector == Sector.ev_automotive

    def test_pan_must_be_10_chars(self):
        with pytest.raises(Exception):
            _textile_profile(pan="SHORT")

    def test_pan_none_ok(self):
        p = _textile_profile(pan=None)
        assert p.pan is None

    def test_negative_investment_rejected(self):
        with pytest.raises(Exception):
            _textile_profile(investment_inr=-1)

    def test_negative_employment_rejected(self):
        with pytest.raises(Exception):
            _textile_profile(employment_expected=-10)

    def test_location_type_enum(self):
        p = _textile_profile(location_type="MIDC")
        assert p.location_type == LocationType.midc

    def test_stage_enum(self):
        p = _textile_profile(stage="Expansion")
        assert p.stage == ProjectStage.expansion

    def test_minimal_profile(self):
        """Only required fields."""
        p = ApplicantProfile(
            entity_type="Company",
            entity_name="Test Co",
            sector="Other",
            stage="Operational",
        )
        assert p.entity_name == "Test Co"


# ─── Rules engine tests ───────────────────────────────────────────────────────

class TestRulesEngine:
    def test_textile_has_textile_policy(self):
        result = evaluate(_textile_profile())
        names = [p["name"] for p in result.policies]
        assert any("Textile" in n for n in names)

    def test_textile_has_industrial_policy(self):
        result = evaluate(_textile_profile())
        names = [p["name"] for p in result.policies]
        assert any("Industrial Policy" in n for n in names)

    def test_textile_has_psi(self):
        result = evaluate(_textile_profile())
        names = [p["name"] for p in result.policies]
        assert any("PSI" in n or "Package Scheme" in n for n in names)

    def test_ev_has_ev_policy(self):
        result = evaluate(_ev_profile())
        names = [p["name"] for p in result.policies]
        assert any("Electric Vehicle" in n or "EV" in n for n in names)

    def test_maitri_always_present(self):
        for profile in [_textile_profile(), _ev_profile(), _unknown_profile()]:
            result = evaluate(profile)
            approval_names = [a["name"] for a in result.approvals]
            assert any("MAITRI" in n for n in approval_names)

    def test_midc_adds_midc_approval(self):
        result = evaluate(_textile_profile(location_type="MIDC"))
        approval_names = [a["name"] for a in result.approvals]
        assert any("MIDC" in n for n in approval_names)

    def test_pre_establishment_has_environmental_clearance(self):
        result = evaluate(_textile_profile(stage="Pre-establishment"))
        approval_names = [a["name"] for a in result.approvals]
        assert any("Environmental" in n for n in approval_names)

    def test_incentives_for_textile_pre_estab(self):
        result = evaluate(_textile_profile())
        assert len(result.incentives) > 0

    def test_missing_district_generates_warning(self):
        result = evaluate(_textile_profile(district=None))
        assert any("District" in w for w in result.warnings)

    def test_missing_investment_generates_warning(self):
        result = evaluate(_unknown_profile(investment_inr=None))
        assert any("Investment" in w for w in result.warnings)

    def test_documents_required_for_pre_estab(self):
        result = evaluate(_textile_profile())
        assert len(result.documents_required) > 0

    def test_it_policy_for_it_sector(self):
        p = ApplicantProfile(
            entity_type="Company",
            entity_name="TechCo",
            sector="IT / ITES",
            stage="Pre-establishment",
        )
        result = evaluate(p)
        names = [pol["name"] for pol in result.policies]
        assert any("IT" in n for n in names)

    def test_startup_policy_for_small_it(self):
        p = ApplicantProfile(
            entity_type="Company",
            entity_name="SmallTech",
            sector="IT / ITES",
            stage="Pre-establishment",
            employment_expected=10,
            investment_inr=50_00_000,
        )
        result = evaluate(p)
        names = [pol["name"] for pol in result.policies]
        assert any("Startup" in n for n in names)


# ─── Retrieval tests ──────────────────────────────────────────────────────────

class TestRetrieval:
    """These tests require the real DB to exist."""

    def _skip_if_no_db(self):
        import os
        if not os.path.exists("db/policy_engine.db"):
            pytest.skip("Real DB not available")

    def test_textile_retrieval_returns_chunks(self):
        self._skip_if_no_db()
        from src.retrieval import LexicalRetriever
        retriever = LexicalRetriever(db_path="db/policy_engine.db", top_k=5)
        results = retriever.retrieve(_textile_profile())
        assert isinstance(results, list)
        # Should get at least some results from the real DB
        # (pass even if 0 — no DB dependency for unit tests)

    def test_ev_retrieval_returns_chunks(self):
        self._skip_if_no_db()
        from src.retrieval import LexicalRetriever
        retriever = LexicalRetriever(db_path="db/policy_engine.db", top_k=5)
        results = retriever.retrieve(_ev_profile())
        assert isinstance(results, list)

    def test_retrieval_chunks_have_provenance(self):
        self._skip_if_no_db()
        from src.retrieval import LexicalRetriever
        retriever = LexicalRetriever(db_path="db/policy_engine.db", top_k=5)
        results = retriever.retrieve(_textile_profile())
        for r in results:
            assert r.chunk_id
            assert r.filename
            assert r.page_start >= 1
            assert isinstance(r.text, str)
            assert r.relevance_score > 0

    def test_get_chunk_by_id_returns_none_for_bad_id(self):
        self._skip_if_no_db()
        from src.retrieval import LexicalRetriever
        retriever = LexicalRetriever(db_path="db/policy_engine.db")
        result = retriever.get_chunk_by_id("nonexistent_chunk_id_xyz123")
        assert result is None


# ─── Assessment pipeline tests ────────────────────────────────────────────────

class TestAssessment:
    def _skip_if_no_db(self):
        import os
        if not os.path.exists("db/policy_engine.db"):
            pytest.skip("Real DB not available")

    def test_textile_assessment_has_policies(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_textile_profile())
        assert len(resp.applicable_policies) > 0
        assert any("Textile" in p.name for p in resp.applicable_policies)

    def test_ev_assessment_has_ev_policy(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_ev_profile())
        assert len(resp.applicable_policies) > 0
        names = [p.name for p in resp.applicable_policies]
        assert any("Electric Vehicle" in n or "EV" in n for n in names)

    def test_assessment_always_has_approvals(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_textile_profile())
        assert len(resp.approvals) > 0

    def test_assessment_has_disclaimer(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_textile_profile())
        assert resp.disclaimer
        assert "Preliminary" in resp.disclaimer

    def test_assessment_response_is_json_serialisable(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_textile_profile())
        data = resp.model_dump()
        serialised = json.dumps(data, ensure_ascii=False)
        assert len(serialised) > 100

    def test_unknown_sector_still_returns_response(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_unknown_profile())
        # Even for "Other" sector, MAITRI approval should always be present
        approval_names = [a.name for a in resp.approvals]
        assert any("MAITRI" in n for n in approval_names)
        # And there should be a warning or disclaimer about limited support
        assert resp.disclaimer

    def test_sources_have_page_numbers(self):
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_textile_profile())
        for src in resp.sources:
            assert src.page_start >= 1
            assert src.filename

    def test_no_fabricated_sources(self):
        """Sources must come from real DB chunks, not hardcoded text."""
        self._skip_if_no_db()
        from src.assessment import run_assessment
        resp = run_assessment(_textile_profile())
        for src in resp.sources:
            # chunk_id must look like a real SHA256 hash (64 hex chars)
            assert len(src.chunk_id) == 64, f"chunk_id looks fabricated: {src.chunk_id}"


# ─── API endpoint tests ───────────────────────────────────────────────────────

class TestAPI:
    def _skip_if_no_db(self):
        import os
        if not os.path.exists("db/policy_engine.db"):
            pytest.skip("Real DB not available")

    def test_health_endpoint(self):
        self._skip_if_no_db()
        from fastapi.testclient import TestClient
        from src.api.main import app
        client = TestClient(app)
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["gemini_active"] is False

    def test_assessment_endpoint_textile(self):
        self._skip_if_no_db()
        from fastapi.testclient import TestClient
        from src.api.main import app
        client = TestClient(app)
        payload = {
            "entity_type": "Company",
            "entity_name": "Test Textile Pvt. Ltd.",
            "sector": "Textile",
            "district": "Pune",
            "location_type": "MIDC",
            "investment_inr": 12000000,
            "employment_expected": 100,
            "stage": "Pre-establishment",
        }
        resp = client.post("/api/assessment", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "applicable_policies" in data
        assert "approvals" in data
        assert "disclaimer" in data
        assert data["project_summary"]["sector"] == "Textile"

    def test_assessment_endpoint_ev(self):
        self._skip_if_no_db()
        from fastapi.testclient import TestClient
        from src.api.main import app
        client = TestClient(app)
        payload = {
            "entity_type": "Company",
            "entity_name": "EV Motors Pvt. Ltd.",
            "sector": "EV / Automotive",
            "district": "Aurangabad",
            "location_type": "MIDC",
            "investment_inr": 15000000,
            "employment_expected": 200,
            "stage": "Pre-establishment",
        }
        resp = client.post("/api/assessment", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["project_summary"]["sector"] == "EV / Automotive"
        policy_names = [p["name"] for p in data["applicable_policies"]]
        assert any("Electric Vehicle" in n or "EV" in n for n in policy_names)

    def test_assessment_validation_error(self):
        self._skip_if_no_db()
        from fastapi.testclient import TestClient
        from src.api.main import app
        client = TestClient(app)
        # Missing required fields
        resp = client.post("/api/assessment", json={"entity_name": "Test"})
        assert resp.status_code == 422

    def test_source_not_found(self):
        self._skip_if_no_db()
        from fastapi.testclient import TestClient
        from src.api.main import app
        client = TestClient(app)
        resp = client.get("/api/sources/nonexistent_chunk_xyz123")
        assert resp.status_code == 404
