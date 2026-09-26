"""
src/assessment.py
-----------------
Assessment orchestrator: connects rules engine + RAG retrieval into
a single AssessmentResponse.

Flow:
  ApplicantProfile
    ↓
  rules.evaluate()     → candidate pathways/approvals/incentives
    ↓
  retrieval.retrieve() → evidence chunks from actual DB
    ↓
  attach evidence to each pathway/approval/incentive
    ↓
  AssessmentResponse
"""

from __future__ import annotations

from src.models import (
    ApplicantProfile,
    AssessmentResponse,
    PolicyPathway,
    ApprovalItem,
    IncentiveItem,
    ProjectSummary,
    SourceEvidence,
)
from src.rules import evaluate, build_policy_pathways, build_approval_items, build_incentive_items
from src.retrieval import LexicalRetriever


# Maximum evidence items to attach per pathway/approval
_MAX_EVIDENCE_PER_ITEM = 3
# Global retrieval top-k
_RETRIEVAL_TOP_K = 10


def run_assessment(
    profile: ApplicantProfile,
    db_path: str = "db/policy_engine.db",
) -> AssessmentResponse:
    """
    Full assessment pipeline.

    1. Build project summary.
    2. Run deterministic rules engine.
    3. Retrieve evidence from the knowledge base.
    4. Attach evidence to policies, approvals, incentives.
    5. Return structured AssessmentResponse.
    """

    # 1. Project summary
    project_summary = ProjectSummary(
        entity_name=profile.entity_name,
        entity_type=profile.entity_type.value,
        sector=profile.sector.value,
        district=profile.district,
        location_type=profile.location_type.value if profile.location_type else None,
        investment_inr=profile.investment_inr,
        employment_expected=profile.employment_expected,
        stage=profile.stage.value,
    )

    # 2. Deterministic rules
    rule_result = evaluate(profile)

    # 3. RAG retrieval
    retriever = LexicalRetriever(db_path=db_path, top_k=_RETRIEVAL_TOP_K)
    all_evidence = retriever.retrieve(profile, extra_keywords=rule_result.retrieval_hint_keywords)

    # 4. Build typed items (without evidence attached yet)
    policy_items = build_policy_pathways(rule_result)
    approval_items = build_approval_items(rule_result)
    incentive_items = build_incentive_items(rule_result)

    # 5. Match evidence to items by keyword overlap
    def _attach_evidence(
        items: list[PolicyPathway | ApprovalItem | IncentiveItem],
        evidence_pool: list[SourceEvidence],
        rule_dicts: list[dict],
    ) -> None:
        """
        Attach the most relevant evidence chunks to each item.
        Uses the retrieval_keywords from the rule dict to score evidence.
        """
        for item, rule_dict in zip(items, rule_dicts):
            rule_kws = rule_dict.get("retrieval_keywords", [])
            if not rule_kws:
                # Attach top-1 generic evidence
                item.evidence = evidence_pool[:1]
                continue

            # Score evidence chunks by keyword overlap with this rule's keywords
            scored: list[tuple[float, SourceEvidence]] = []
            for ev in evidence_pool:
                text_lower = (ev.text or "").lower()
                hits = sum(1 for kw in rule_kws if kw.lower() in text_lower)
                if hits > 0:
                    scored.append((hits, ev))
            scored.sort(key=lambda x: x[0], reverse=True)
            item.evidence = [ev for _, ev in scored[:_MAX_EVIDENCE_PER_ITEM]]

    # Attach evidence to each item category
    _attach_evidence(policy_items, all_evidence, rule_result.policies)
    _attach_evidence(approval_items, all_evidence, rule_result.approvals)
    _attach_evidence(incentive_items, all_evidence, rule_result.incentives)

    # Deduplicate sources list (unique chunk_ids, ordered by relevance)
    seen_chunks: set[str] = set()
    unique_sources: list[SourceEvidence] = []
    for ev in all_evidence:
        if ev.chunk_id not in seen_chunks:
            seen_chunks.add(ev.chunk_id)
            unique_sources.append(ev)

    # If zero evidence found, add a clear warning
    warnings = list(rule_result.warnings)
    if not all_evidence:
        warnings.append(
            "No sufficiently supported source passages were found in the current "
            "demo knowledge base for this sector. The rules above are general applicability "
            "signals only — consult the relevant government documents for authoritative guidance."
        )

    return AssessmentResponse(
        project_summary=project_summary,
        applicable_policies=policy_items,
        approvals=approval_items,
        incentives=incentive_items,
        documents_required=rule_result.documents_required,
        warnings=warnings,
        sources=unique_sources[:8],  # limit to 8 top sources in summary
    )
