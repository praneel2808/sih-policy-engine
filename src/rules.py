"""
src/rules.py
------------
Deterministic rules engine for SMSWS MVP.

Rules map ApplicantProfile fields to candidate policy pathways, approvals,
and incentives. Rules are grounded in the real extracted government corpus.

IMPORTANT:
- Rules here reflect general policy applicability signals, NOT legal guarantees.
- All rule results use "potentially_applicable" language.
- Evidence is retrieved separately by the RAG layer; rules only decide which
  pathways to surface.
- Do NOT hardcode policy text — text comes from the DB via retrieval.py.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from src.models import ApplicantProfile, PolicyPathway, ApprovalItem, IncentiveItem


@dataclass
class RuleResult:
    """Internal result from the rules engine before evidence is attached."""
    policies: list[dict] = field(default_factory=list)
    approvals: list[dict] = field(default_factory=list)
    incentives: list[dict] = field(default_factory=list)
    documents_required: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    retrieval_hint_keywords: list[str] = field(default_factory=list)


def evaluate(profile: ApplicantProfile) -> RuleResult:
    """
    Deterministic rules engine entry point.

    Evaluates the ApplicantProfile and returns candidate policy pathways,
    approvals, incentives, and document requirements.

    All results are 'potentially applicable' — human verification required
    for any actual eligibility determination.
    """
    result = RuleResult()
    sector = profile.sector.value
    stage = profile.stage.value
    inv = profile.investment_inr or 0
    emp = profile.employment_expected or 0
    loc = profile.location_type.value if profile.location_type else ""
    district = (profile.district or "").strip()

    # ── RULE 1: Industrial Policy (universal baseline) ────────────────────────
    result.policies.append({
        "name": "Maharashtra Industrial Policy 2019",
        "status": "potentially_applicable",
        "reason": (
            "Maharashtra Industrial Policy 2019 provides a broad framework for "
            "industrial investment, incentive eligibility, and approval pathways. "
            "Applicable to manufacturing and service enterprises across sectors."
        ),
        "retrieval_keywords": ["industrial policy", "investment", "incentive", "Maharashtra"],
    })

    # ── RULE 2: Package Scheme of Incentives (PSI 2019) ───────────────────────
    # PSI 2019 applies to new/expansion projects in eligible sectors
    if stage in ("Pre-establishment", "Expansion") and inv > 0:
        result.policies.append({
            "name": "Package Scheme of Incentives 2019 (PSI-2019)",
            "status": "potentially_applicable",
            "reason": (
                f"PSI-2019 provides capital subsidy, power tariff subsidy, and other "
                f"incentives for new/expansion projects. Applicable to {sector} sector. "
                f"Eligibility depends on project location category and investment amount."
            ),
            "retrieval_keywords": [
                "package scheme", "incentive", "PSI", "subsidy", "eligible unit",
            ],
        })
        result.incentives.append({
            "name": "Capital Subsidy (PSI-2019)",
            "status": "potentially_applicable",
            "reason": (
                "New manufacturing units may be eligible for capital investment subsidy "
                "under PSI-2019, subject to project category (A/B/C/D/D+) and investment."
            ),
        })
        result.incentives.append({
            "name": "Power Tariff Subsidy (PSI-2019)",
            "status": "potentially_applicable",
            "reason": (
                "Manufacturing units in eligible categories may receive power tariff "
                "subsidies under PSI-2019 for a specified period."
            ),
        })

    # ── RULE 3: Sector-specific policies ─────────────────────────────────────

    if sector == "Textile":
        result.policies.append({
            "name": "Integrated and Sustainable Textile Policy 2023-28",
            "status": "potentially_applicable",
            "reason": (
                "Maharashtra's Textile Policy 2023-28 provides financial assistance, "
                "power subsidies, and support for textile, garment, and powerloom units. "
                "Investment and employment generate direct eligibility signals."
            ),
            "retrieval_keywords": [
                "textile", "fabric", "powerloom", "garment", "knitting", "yarn",
                "LT power", "subsidy",
            ],
        })
        result.incentives.append({
            "name": "Textile Sector Power Tariff Subsidy",
            "status": "potentially_applicable",
            "reason": (
                "Textile Policy 2023-28 mentions specific power subsidies for LT/HT "
                "powerloom and knitting units."
            ),
        })
        result.documents_required.extend([
            "Industry Registration Certificate",
            "Electricity connection application",
            "Project Report (DPR)",
            "Land ownership / lease documents",
        ])
        result.retrieval_hint_keywords.extend([
            "textile", "powerloom", "yarn", "LT category", "power subsidy",
        ])

    elif sector == "EV / Automotive":
        result.policies.append({
            "name": "Maharashtra Electric Vehicle Policy 2021",
            "status": "potentially_applicable",
            "reason": (
                "Maharashtra EV Policy 2021 promotes EV manufacturing and charging "
                "infrastructure through capital subsidies, GST waiver, and stamp duty "
                "exemptions. Applicable to EV and related component manufacturers."
            ),
            "retrieval_keywords": [
                "electric vehicle", "EV", "battery", "charging", "GST", "stamp duty",
                "manufacturing", "subsidy",
            ],
        })
        result.incentives.append({
            "name": "EV Capital Subsidy",
            "status": "potentially_applicable",
            "reason": (
                "EV Policy 2021 / Industrial Policy 2019 provide capital subsidies "
                "for EV manufacturers, subject to investment threshold and location."
            ),
        })
        result.documents_required.extend([
            "EV Manufacturing License / Registration",
            "FAME-II eligibility documentation (if applicable)",
            "Project Report (DPR)",
            "Land ownership / lease documents",
        ])
        result.retrieval_hint_keywords.extend([
            "electric vehicle", "EV", "charging infrastructure", "battery manufacturing",
        ])

    elif sector == "Electronics":
        result.policies.append({
            "name": "Maharashtra Electronics Policy 2016",
            "status": "potentially_applicable",
            "reason": (
                "Maharashtra Electronics Policy 2016 supports ESDM (Electronic System "
                "Design and Manufacturing) with incentives including capital subsidy, "
                "interest subsidy, and infrastructure support."
            ),
            "retrieval_keywords": [
                "electronics", "ESDM", "semiconductor", "PCB", "electronic manufacturing",
            ],
        })
        result.retrieval_hint_keywords.extend(["electronics", "ESDM", "hardware"])

    elif sector == "IT / ITES":
        result.policies.append({
            "name": "Maharashtra IT Policy 2023",
            "status": "potentially_applicable",
            "reason": (
                "IT Policy 2023 provides incentives and infrastructure support for "
                "IT/ITES companies, data centers, and startups. Applicable if the "
                "primary activity is software, services, or digital infrastructure."
            ),
            "retrieval_keywords": [
                "information technology", "IT", "ITES", "software", "data center",
                "startup", "innovation",
            ],
        })
        if emp < 50 or inv < 1_00_00_000:  # Small IT — startup angle
            result.policies.append({
                "name": "Maharashtra Startup Policy 2018",
                "status": "potentially_applicable",
                "reason": (
                    "Startup Policy 2018 may apply for early-stage technology companies "
                    "with fewer than 50 employees or investment below ₹1 crore. "
                    "Provides incubation, seed funding, and mentorship support."
                ),
                "retrieval_keywords": ["startup", "incubator", "seed fund", "innovation"],
            })
        result.retrieval_hint_keywords.extend(["IT", "ITES", "software", "data center"])

    elif sector == "Aerospace":
        result.policies.append({
            "name": "Maharashtra Aerospace and Defence Manufacturing Policy 2018",
            "status": "potentially_applicable",
            "reason": (
                "Maharashtra's Aerospace policy supports defence manufacturing, MRO, "
                "and aerospace component manufacturing with land, infrastructure, "
                "and financial incentives."
            ),
            "retrieval_keywords": [
                "aerospace", "defence", "MRO", "aviation", "manufacturing",
            ],
        })
        result.retrieval_hint_keywords.extend(["aerospace", "defence", "aviation"])

    elif sector == "Food Processing":
        result.policies.append({
            "name": "Maharashtra Food Processing Policy 2017",
            "status": "potentially_applicable",
            "reason": (
                "Food Processing Policy 2017 provides capital subsidies and other "
                "incentives for agro-processing and food manufacturing units."
            ),
            "retrieval_keywords": [
                "food processing", "agro", "dairy", "fruit", "vegetable",
                "MOFPI", "cold chain",
            ],
        })
        result.retrieval_hint_keywords.extend(["food processing", "agro", "cold storage"])

    else:  # Logistics, Chemical, Engineering, Other
        if emp < 50 or inv < 5_00_00_000:
            result.policies.append({
                "name": "MSME Development Policy (MSMED Act 2006)",
                "status": "potentially_applicable",
                "reason": (
                    "If classified as a Micro, Small, or Medium Enterprise under the "
                    "MSMED Act 2006, additional MSME-specific incentives and priority "
                    "sector benefits may apply."
                ),
                "retrieval_keywords": ["MSME", "micro enterprise", "small enterprise", "MSMED"],
            })

    # ── RULE 4: MAITRI / Single-Window ────────────────────────────────────────
    # Always applicable for new projects
    result.approvals.append({
        "name": "MAITRI — Single Window Clearance",
        "stage": stage,
        "status": "required",
        "reason": (
            "Under the Maharashtra Industry, Trade and Investment Facilitation Act "
            "(MAITRI) 2023 and MAITRI Rules 2025, all industrial projects must apply "
            "for clearances through the Unified Single Window portal. The Empowered "
            "Committee reviews applications within prescribed timelines."
        ),
        "authority": "Maharashtra Industry, Trade and Investment Facilitation Cell (MAITRIC)",
        "retrieval_keywords": [
            "MAITRI", "single window", "clearance", "Empowered Committee",
            "approval", "portal",
        ],
    })

    # ── RULE 5: Stage-specific approvals ─────────────────────────────────────
    if stage == "Pre-establishment":
        result.approvals.extend([
            {
                "name": "Environmental Clearance (EC)",
                "stage": "Pre-establishment",
                "status": "required",
                "reason": (
                    "Environmental Impact Assessment (EIA) and clearance from "
                    "MoEF&CC or State EAC required before project commencement, "
                    "depending on project category and scale."
                ),
                "authority": "Maharashtra Pollution Control Board (MPCB) / MoEF&CC",
                "retrieval_keywords": ["environmental clearance", "EIA", "pollution", "MPCB"],
            },
            {
                "name": "Factory Plan Approval (if manufacturing)",
                "stage": "Pre-establishment",
                "status": "required",
                "reason": (
                    "Building plans and factory layout must be approved by the "
                    "Directorate of Industrial Safety and Health before construction."
                ),
                "authority": "Directorate of Industrial Safety and Health (DISH)",
                "retrieval_keywords": ["factory", "plan approval", "construction", "DISH"],
            },
        ])
        result.documents_required.extend([
            "Application for MAITRI Single Window",
            "Project Report / DPR",
            "Land documents / 7/12 Extract",
            "MOA / Partnership Deed / Registration Certificate",
            "Environmental Clearance Application",
        ])

    elif stage == "Construction":
        result.approvals.append({
            "name": "Construction Permission",
            "stage": "Construction",
            "status": "required",
            "reason": (
                "Construction permission from local authority (MIDC / Municipality / "
                "Gram Panchayat) required before commencing construction work."
            ),
            "authority": "MIDC / Local Municipal Authority",
            "retrieval_keywords": ["construction permission", "building permission", "MIDC"],
        })

    elif stage == "Operational":
        result.approvals.append({
            "name": "Factory License (Factories Act 1948)",
            "stage": "Operational",
            "status": "required",
            "reason": (
                "Manufacturing units employing workers require a license under the "
                "Factories Act 1948 before commencing operations."
            ),
            "authority": "Directorate of Industrial Safety and Health (DISH)",
            "retrieval_keywords": ["factory license", "Factories Act", "manufacturing", "workers"],
        })

    elif stage == "Expansion":
        result.approvals.append({
            "name": "Expansion / Capacity Enhancement Permission",
            "stage": "Expansion",
            "status": "potentially_required",
            "reason": (
                "Expansion projects may require amendments to existing environmental "
                "clearances, factory licenses, and MAITRI approvals depending on scale."
            ),
            "authority": "Relevant sectoral authorities",
            "retrieval_keywords": ["expansion", "amendment", "capacity", "approval"],
        })

    # ── RULE 6: MIDC location ────────────────────────────────────────────────
    if loc == "MIDC":
        result.approvals.append({
            "name": "MIDC Plot Allotment / Lease Agreement",
            "stage": stage,
            "status": "required",
            "reason": (
                "Projects on MIDC land must have a valid plot allotment letter "
                "and lease agreement from MIDC before construction/operation."
            ),
            "authority": "Maharashtra Industrial Development Corporation (MIDC)",
            "retrieval_keywords": ["MIDC", "plot allotment", "lease", "industrial area"],
        })
        result.incentives.append({
            "name": "MIDC Infrastructure Benefits",
            "status": "potentially_applicable",
            "reason": (
                "MIDC-located units benefit from developed infrastructure: "
                "roads, drainage, power sub-stations, and water supply. "
                "MIDC areas are designated for industrial use with simplified approvals."
            ),
        })
        result.retrieval_hint_keywords.append("MIDC")

    # ── RULE 7: Investment-based classification signal ────────────────────────
    if inv >= 50_00_00_000:  # ≥ ₹50 crore
        result.policies.append({
            "name": "Large Industry Classification (MIDC / District Industries Centre)",
            "status": "potentially_applicable",
            "reason": (
                f"Investment of ₹{inv:,.0f} may classify this project as a Large "
                "Industry, qualifying for enhanced incentives and dedicated MIDC "
                "facilitation under Industrial Policy 2019."
            ),
            "retrieval_keywords": ["large industry", "mega project", "investment", "crore"],
        })

    # ── RULE 8: General warnings ──────────────────────────────────────────────
    if not district:
        result.warnings.append(
            "District not specified. Location-specific incentive categories (A/B/C/D) "
            "cannot be determined. Please provide district for accurate assessment."
        )
    if inv == 0:
        result.warnings.append(
            "Investment amount not specified. Incentive quantum calculations require "
            "the proposed investment value."
        )

    return result


def build_approval_items(rule_result: RuleResult) -> list[ApprovalItem]:
    return [
        ApprovalItem(
            name=a["name"],
            stage=a["stage"],
            status=a["status"],
            reason=a["reason"],
            authority=a.get("authority"),
        )
        for a in rule_result.approvals
    ]


def build_incentive_items(rule_result: RuleResult) -> list[IncentiveItem]:
    return [
        IncentiveItem(
            name=i["name"],
            status=i["status"],
            reason=i["reason"],
        )
        for i in rule_result.incentives
    ]


def build_policy_pathways(rule_result: RuleResult) -> list[PolicyPathway]:
    return [
        PolicyPathway(
            name=p["name"],
            status=p["status"],
            reason=p["reason"],
        )
        for p in rule_result.policies
    ]
