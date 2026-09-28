"""
src/api/support.py
------------------
Support ticket system and smart AI policy chatbot router.
Provides:
  - Database schema for support tickets, chat messages, and document attachments.
  - Real-time inquiry handling between Citizens and Government / Backend Officers.
  - Tracking of applicant current stage and submitted statutory forms.
  - Grounded AI chatbot answering questions about portal features and Maharashtra industrial policies.
"""

from __future__ import annotations

import os
import sqlite3
import random
import json
import re
from datetime import datetime
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

_HERE = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
DB_PATH = os.environ.get("SMSWS_DB_PATH", os.path.join(_PROJECT_ROOT, "db", "policy_engine.db"))

support_router = APIRouter(prefix="/api/support", tags=["Support & AI Assistant"])


def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _ensure_columns(conn: sqlite3.Connection, table: str, columns: Dict[str, str]) -> None:
    """Safely adds missing columns to an existing SQLite table."""
    try:
        existing = [row[1] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]
        for col, col_type in columns.items():
            if col not in existing:
                conn.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
        conn.commit()
    except Exception as e:
        print(f"Column check warning for {table}: {e}")


def init_support_tables() -> None:
    """Creates support tables and handles schema migrations."""
    conn = _get_conn()
    try:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS support_tickets (
                ticket_id TEXT PRIMARY KEY,
                applicant_name TEXT NOT NULL,
                entity_name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                district TEXT,
                department TEXT NOT NULL,
                subject TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING, IN_PROGRESS, RESOLVED
                priority TEXT NOT NULL DEFAULT 'NORMAL',  -- NORMAL, HIGH, URGENT
                assigned_officer TEXT,
                current_stage TEXT DEFAULT 'Pre-Establishment',
                sector TEXT DEFAULT 'General Industry',
                investment_inr REAL DEFAULT 0.0,
                project_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS support_ticket_messages (
                message_id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_id TEXT NOT NULL,
                sender TEXT NOT NULL,  -- user, officer, system
                sender_name TEXT NOT NULL,
                sender_title TEXT,
                text TEXT NOT NULL,
                attachment_name TEXT,
                attachment_type TEXT,
                attachment_data TEXT,
                attachment_size INTEGER,
                created_at TEXT NOT NULL,
                FOREIGN KEY (ticket_id) REFERENCES support_tickets (ticket_id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets (status);
            CREATE INDEX IF NOT EXISTS idx_support_tickets_dept ON support_tickets (department);
            CREATE INDEX IF NOT EXISTS idx_ticket_messages_tkt ON support_ticket_messages (ticket_id);
        """)
        conn.commit()

        # Ensure any newly added columns exist in older tables
        _ensure_columns(conn, "support_tickets", {
            "current_stage": "TEXT DEFAULT 'Pre-Establishment'",
            "sector": "TEXT DEFAULT 'General Industry'",
            "investment_inr": "REAL DEFAULT 0.0",
            "project_id": "TEXT"
        })

        _ensure_columns(conn, "support_ticket_messages", {
            "attachment_name": "TEXT",
            "attachment_type": "TEXT",
            "attachment_data": "TEXT",
            "attachment_size": "INTEGER"
        })

        # Seed realistic demonstration tickets if table is empty
        count = conn.execute("SELECT COUNT(*) FROM support_tickets").fetchone()[0]
        if count == 0:
            sample_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # Demo Ticket 1: Rajesh Sharma
            conn.execute("""
                INSERT INTO support_tickets (
                    ticket_id, applicant_name, entity_name, email, phone, district, department, subject,
                    status, priority, assigned_officer, current_stage, sector, investment_inr, project_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "TKT-2026-1042",
                "Rajesh Sharma",
                "Vidarbha Agro Logistics Pvt Ltd",
                "rajesh.sharma@vidarbhaagro.com",
                "+91 98230 45678",
                "Nagpur",
                "PSI-2019 Subsidies",
                "Clarification on Gross SGST Reimbursement for Zone D+ Cold Storage",
                "IN_PROGRESS",
                "HIGH",
                "Shri Sanjay Deshmukh (Joint Director)",
                "Pre-Establishment",
                "Food Processing & Agro-Logistics",
                185000000.0,
                "PROJ-NAG-2026-081",
                sample_time,
                sample_time
            ))

            conn.execute("""
                INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, sender_title, text, attachment_name, attachment_type, attachment_size, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "TKT-2026-1042",
                "user",
                "Rajesh Sharma",
                "Managing Director",
                "We are setting up a 5,000 MT controlled-atmosphere cold storage unit in Butibori MIDC, Nagpur (Zone D+). Our project investment is ₹18.5 Crores. Kindly clarify if 100% Gross SGST reimbursement applies for 10 years or 7 years. Attached is our preliminary project summary.",
                "Project_Summary_Butibori_ColdStorage.pdf",
                "application/pdf",
                1843200,
                sample_time
            ))

            conn.execute("""
                INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, sender_title, text, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                "TKT-2026-1042",
                "officer",
                "Shri Sanjay Deshmukh",
                "Joint Director of Industries (Nagpur Division)",
                "Namaskar Shri Sharma. Under PSI-2019, Agro-processing and Cold Storage in Zone D+ qualify for 100% Gross SGST refund for a ceiling of 10 years up to 100% of eligible FCI. Please submit CAF Form 10 along with your bank term loan sanction letter via MAITRI.",
                sample_time
            ))

            # Demo Ticket 2: Priya Kulkarni
            conn.execute("""
                INSERT INTO support_tickets (
                    ticket_id, applicant_name, entity_name, email, phone, district, department, subject,
                    status, priority, assigned_officer, current_stage, sector, investment_inr, project_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "TKT-2026-1088",
                "Priya Kulkarni",
                "Sahyadri Precision Autotech",
                "priya@sahyadri-auto.in",
                "+91 98811 22334",
                "Pune",
                "MPCB Environmental Consents",
                "Consent to Establish (CTE) fee calculation for auto components unit in Chakan",
                "PENDING",
                "NORMAL",
                None,
                "Pre-Operation",
                "Automotive & Engineering",
                62000000.0,
                "PROJ-PUN-2026-114",
                sample_time,
                sample_time
            ))

            conn.execute("""
                INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, sender_title, text, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                "TKT-2026-1088",
                "user",
                "Priya Kulkarni",
                "Operations Head",
                "We are applying for Consent to Establish (CTE) for CNC machining and metal fabrication at Chakan Industrial Area. Capital investment is ₹6.2 Crores. Please verify if our project falls under Orange or Green category.",
                sample_time
            ))

            # Seed sample form submissions for Vidarbha Agro & Sahyadri Precision so support team can inspect them
            conn.execute("""
                INSERT INTO form_submissions (
                    project_id, entity_name, form_requirement_id, form_name, form_number, status, collected_values_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "PROJ-NAG-2026-081",
                "Vidarbha Agro Logistics Pvt Ltd",
                10,
                "CAF Form 10 - Application for PSI-2019 Financial Incentives",
                "CAF-10",
                "SUBMITTED",
                json.dumps({
                    "entity_name": "Vidarbha Agro Logistics Pvt Ltd",
                    "district": "Nagpur",
                    "taluka": "Nagpur (Rural) - Butibori MIDC",
                    "sector": "Agro & Food Processing",
                    "eligible_fci_inr": "18,50,00,000",
                    "term_loan_sanctioned": "12,00,00,000",
                    "lending_bank": "State Bank of India (Nagpur SME Branch)",
                    "planned_employment": "85",
                    "power_sanction_kw": "450"
                }),
                sample_time,
                sample_time
            ))

            conn.execute("""
                INSERT INTO form_submissions (
                    project_id, entity_name, form_requirement_id, form_name, form_number, status, collected_values_json, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                "PROJ-PUN-2026-114",
                "Sahyadri Precision Autotech",
                1,
                "MPCB Form 1 - Application for Consent to Establish (CTE)",
                "MPCB-01",
                "UNDER_SCRUTINY",
                json.dumps({
                    "entity_name": "Sahyadri Precision Autotech",
                    "district": "Pune",
                    "industrial_area": "Chakan MIDC Phase II",
                    "gross_capital_investment": "6,20,00,000",
                    "pollution_category_claimed": "Orange",
                    "water_consumption_kld": "15",
                    "effluent_generation_kld": "2.5",
                    "dg_set_rating_kva": "125"
                }),
                sample_time,
                sample_time
            ))

            conn.commit()

    finally:
        conn.close()


init_support_tables()


# ── Pydantic Request / Response Models ────────────────────────────────────────

class TicketCreateRequest(BaseModel):
    applicant_name: str = Field(..., description="Full Name of applicant")
    entity_name: str = Field(..., description="Company / Enterprise Name")
    email: Optional[str] = None
    phone: Optional[str] = None
    district: Optional[str] = "Maharashtra"
    department: str = Field(..., description="Inquiry department or category")
    subject: str = Field(..., description="Brief inquiry subject")
    initial_message: str = Field(..., description="Detailed question or problem statement")
    priority: Optional[str] = "NORMAL"
    current_stage: Optional[str] = "Pre-Establishment"
    sector: Optional[str] = "General Industry"
    investment_inr: Optional[float] = 0.0
    project_id: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_data: Optional[str] = None
    attachment_size: Optional[int] = None


class MessageCreateRequest(BaseModel):
    sender: str = Field(..., description="'user' or 'officer'")
    sender_name: str = Field(..., description="Name of person typing")
    sender_title: Optional[str] = None
    text: str = Field(..., description="Message text")
    attachment_name: Optional[str] = None
    attachment_type: Optional[str] = None
    attachment_data: Optional[str] = None
    attachment_size: Optional[int] = None


class TicketStatusUpdateRequest(BaseModel):
    status: str = Field(..., description="'PENDING', 'IN_PROGRESS', or 'RESOLVED'")
    assigned_officer: Optional[str] = None


class BotQueryRequest(BaseModel):
    query: str = Field(..., description="User prompt or question")
    current_page: Optional[str] = None
    history: Optional[List[Dict[str, str]]] = None
    applicant_context: Optional[Dict[str, Any]] = None
    gemini_api_key: Optional[str] = None
    target_language: Optional[str] = "en"


# ── AI Chatbot Knowledge Base & Logic ─────────────────────────────────────────

def generate_bot_response(
    query_text: str,
    current_page: Optional[str] = None,
    history: Optional[List[Dict[str, str]]] = None,
    applicant_context: Optional[Dict[str, Any]] = None,
    gemini_api_key: Optional[str] = None,
    target_language: Optional[str] = "en"
) -> Dict[str, Any]:
    """
    Intelligently takes any question from the user and delivers refined, highly structured,
    grounded answers regarding portal functions, policies, schemes, and statutory procedures.
    """
    from src.api.ai_policy_assistant import get_ai_bot_response
    return get_ai_bot_response(
        query_text=query_text,
        current_page=current_page,
        history=history,
        applicant_context=applicant_context,
        api_key=gemini_api_key,
        target_language=target_language
    )
    q = query_text.strip().lower()

    # 1. Project Assessment / Evaluation
    if any(k in q for k in ["assess", "evaluation", "start project", "evaluate", "wizard", "check eligibility", "how to use", "input", "profile"]):
        return {
            "reply": (
                "### 🎯 Project Assessment Engine (`/assess`)\n\n"
                "The **Project Assessment Engine** evaluates your industrial enterprise against codified Maharashtra Government gazettes to produce an instant compliance roadmap.\n\n"
                "**How to Complete the 3-Step Assessment:**\n"
                "- **Step 1: Enterprise Profile** — Specify your Sector (e.g. *Textile, EV, Food Processing, IT/ITES*), Project Stage (*Pre-Establishment, Pre-Operation, Expansion*), and Scale.\n"
                "- **Step 2: Location & Economics** — Enter your District, Taluka, MIDC Industrial Area vs Private Land, and Planned Fixed Capital Investment (₹ INR).\n"
                "- **Step 3: Utilities & Special Categories** — Enter Power load (KW), Water requirement (KLD), and special status (*Women-led, SC/ST, Export-Oriented, Green Unit*).\n\n"
                "👉 Click **'Start Project Assessment'** below to view your statutory approvals checklist, timeline, and subsidy calculation!"
            ),
            "action_links": [
                {"label": "Start Project Assessment", "url": "/assess"},
                {"label": "View Assessment Results", "url": "/results"}
            ],
            "suggested_questions": [
                "What documents are required for assessment?",
                "What incentives do I get under PSI-2019?",
                "How is my Taluka zone determined?"
            ],
            "recommended_department": "General Inquiries",
            "prefill_inquiry": "I need assistance running the Project Assessment for my enterprise."
        }

    # 2. Results & Clearances Checklist
    if any(k in q for k in ["result", "roadmap", "checklist", "clearance list", "what clearances", "approval required"]):
        return {
            "reply": (
                "### 📊 Assessment Results & Clearances Roadmap (`/results`)\n\n"
                "Once your assessment is completed, the **Results Dashboard** presents an executive regulatory roadmap:\n\n"
                "- **Pre-Establishment Clearances**: MPCB Consent to Establish (CTE), Maharashtra Fire Services NOC, MIDC Plot Allotment, Factory Inspectorate Building Approval.\n"
                "- **Pre-Operation Clearances**: MPCB Consent to Operate (CTO), Factory License (DISHT), Boiler Inspection, HT/LT Power Sanction.\n"
                "- **Statutory RTS SLA Timelines**: Track legal deadlines under the Maharashtra Right to Public Services Act (usually 15 to 45 working days).\n"
                "- **Incentive Amortization**: Detailed breakdown of eligible Gross SGST refund, interest subsidy, and electricity duty waiver.\n"
                "- **Required CAF Forms**: Codified government application blueprints ready for filling."
            ),
            "action_links": [
                {"label": "Open Assessment Results", "url": "/results"},
                {"label": "Explore Required Approvals", "url": "/approvals"}
            ],
            "suggested_questions": [
                "How do I auto-fill CAF forms?",
                "How do I calculate MPCB consent fees?",
                "Can I download an executive summary PDF?"
            ],
            "recommended_department": "General Inquiries",
            "prefill_inquiry": "Please assist with interpreting my assessment results and clearance checklist."
        }

    # 3. Incentives, Subsidies & PSI-2019
    if any(k in q for k in ["psi", "psi-2019", "incentive", "subsidy", "subsidies", "sgst", "ips", "stamp duty", "electricity duty", "power tariff"]):
        return {
            "reply": (
                "### 💰 Maharashtra Package Scheme of Incentives (PSI-2019)\n\n"
                "The **PSI-2019 Scheme** provides substantial financial incentives to promote industrial growth across Maharashtra:\n\n"
                "- **Industrial Promotion Subsidy (IPS)**: Reimbursement of **30% to 100% of Gross SGST** paid on local sales for a period of 7 to 10 years (capped at eligible FCI).\n"
                "- **Interest Subsidy**: **5% per annum** on term loans for MSMEs (maximum ₹25 to ₹35 Lakhs per year).\n"
                "- **Electricity Duty Exemption**: **100% exemption** from electricity duty for 7 to 10 years in Zones C, D, and D+.\n"
                "- **Power Tariff Concession**: ₹1.50 to ₹2.00 per unit for 3 years in Vidarbha, Marathwada, and North Maharashtra.\n"
                "- **Stamp Duty Exemption**: 100% waiver on land purchase and lease agreements in designated industrial parks.\n\n"
                "Visit the **Incentives & Schemes** tab to use the interactive 10-Year Subsidy Amortization Calculator!"
            ),
            "action_links": [
                {"label": "Interactive Incentives Calculator", "url": "/incentives"},
                {"label": "Run Policy Assessment", "url": "/assess"}
            ],
            "suggested_questions": [
                "What are the benefits for Women-led enterprises?",
                "Which Talukas belong to Zone D+?",
                "How do I claim power tariff concessions?"
            ],
            "recommended_department": "PSI-2019 Subsidies",
            "prefill_inquiry": "We require guidance on our eligibility for Gross SGST refund and interest subsidy under PSI-2019."
        }

    # 4. MPCB & Environmental Consents
    if any(k in q for k in ["mpcb", "pollution", "cte", "cto", "consent to establish", "consent to operate", "red", "orange", "green", "white"]):
        return {
            "reply": (
                "### 🌿 MPCB Environmental Clearances & Categorization\n\n"
                "The **Maharashtra Pollution Control Board (MPCB)** categorizes industries based on Pollution Index (PI):\n\n"
                "- **🔴 Red Category (PI Score 60+)**: Heavy manufacturing (Chemical, Pharma, Electroplating, Sugar). Requires Consent to Establish (CTE), public hearing/EIA, and Consent to Operate (CTO) with online continuous effluent monitoring.\n"
                "- **🟠 Orange Category (PI Score 41–59)**: Moderate pollution (Food processing, Textile processing, Auto assembly, Light engineering). Requires CTE, CTO, and Effluent Treatment Plant (ETP).\n"
                "- **🟢 Green Category (PI Score 21–40)**: Low pollution (Packaging, Small fabrication). Fast-track clearance within 15–30 days.\n"
                "- **⚪ White Category (PI Score up to 20)**: Non-polluting (Solar assembly, IT/ITES). **Completely exempt from MPCB consent!** Only intimation required.\n\n"
                "All consent applications must be submitted via the MAITRI Single Window portal."
            ),
            "action_links": [
                {"label": "Approvals & Compliance", "url": "/approvals"},
                {"label": "Download MPCB Forms", "url": "/forms"}
            ],
            "suggested_questions": [
                "What is the fee for Consent to Establish?",
                "How long does MPCB take to grant CTO?",
                "What documents are needed for White category?"
            ],
            "recommended_department": "MPCB Environmental Consents",
            "prefill_inquiry": "We need verification of our MPCB pollution category and Consent to Establish requirements."
        }

    # 5. Form Repository & Auto-Fill
    if any(k in q for k in ["form", "forms", "fill", "caf", "auto-fill", "blueprint", "download"]):
        return {
            "reply": (
                "### 📝 Forms Repository & Smart Auto-Fill (`/forms` & `/fill-forms`)\n\n"
                "Our portal codifies over **186 official Maharashtra Government Application Forms**:\n\n"
                "- **Unified Enterprise Profile Mapping**: Once you complete your profile or assessment, common fields (PAN, GSTIN, registered address, director details, power load) automatically populate into statutory forms.\n"
                "- **Deduplication Engine**: Eliminates redundant questions across MIDC, MPCB, DISHT, and Fire forms.\n"
                "- **Combined Application Form (CAF)**: File single-window applications for all departments at once.\n"
                "- **Export Options**: Download filled forms in standardized JSON or PDF formats ready for MAITRI dispatch."
            ),
            "action_links": [
                {"label": "Browse Forms Repository", "url": "/forms"},
                {"label": "Smart Form Filler", "url": "/fill-forms"}
            ],
            "suggested_questions": [
                "Which form is required for Fire NOC?",
                "How do I submit CAF Form 10 for subsidies?",
                "Can I save form drafts?"
            ],
            "recommended_department": "General Inquiries",
            "prefill_inquiry": "I need help with auto-filling and submitting CAF forms for single window clearance."
        }

    # 6. MIDC, Land & Infrastructure
    if any(k in q for k in ["midc", "land", "plot", "infrastructure", "water connection", "drainage", "estate"]):
        return {
            "reply": (
                "### 🏗️ MIDC Land & Infrastructure Clearances\n\n"
                "**Maharashtra Industrial Development Corporation (MIDC)** handles industrial infrastructure:\n\n"
                "- **Plot Allotment**: Apply online via MAITRI with Detailed Project Report (DPR) and 5% Earnest Money Deposit (EMD).\n"
                "- **Building Plan Approval**: Special Planning Authority (SPA) scrutiny within 30 days.\n"
                "- **Water Supply Connection**: Allocated on daily volumetric requirement (KLD) from MIDC supply mains.\n"
                "- **CETP Drainage Allotment**: Common Effluent Treatment Plant membership for chemical and textile estates."
            ),
            "action_links": [
                {"label": "Approvals Guide", "url": "/approvals"},
                {"label": "Official Documents", "url": "/documents"}
            ],
            "suggested_questions": [
                "What is the MIDC water tariff?",
                "How do I transfer an MIDC plot lease?",
                "What is the timeline for building plan approval?"
            ],
            "recommended_department": "MIDC Land Allotment",
            "prefill_inquiry": "Inquiring regarding industrial plot allotment and water supply sanction from MIDC."
        }

    # 7. Electricity, Power & MSEDCL
    if any(k in q for k in ["power", "electricity", "msedcl", "ht", "lt", "substation", "tariff", "feeder"]):
        return {
            "reply": (
                "### ⚡ Industrial Power Sanction & Tariff Concessions (MSEDCL)\n\n"
                "- **LT vs HT Sanction**: Up to 100 KW on Low Tension (LT); above 100 KW requires High Tension (HT 11KV/22KV/33KV) connection.\n"
                "- **Tariff Subsidies**: Eligible units in Vidarbha, Marathwada, and backward districts receive a concession of **₹1.50 to ₹2.00 per unit** for 3 years.\n"
                "- **Electricity Duty Waiver**: 100% exemption from state electricity duty for 7 to 10 years under PSI-2019.\n"
                "- **Process**: Submit load sanction request via MAITRI; feasibility report issued by Executive Engineer within 15 days."
            ),
            "action_links": [
                {"label": "Approvals & Compliance", "url": "/approvals"},
                {"label": "Incentives Calculator", "url": "/incentives"}
            ],
            "suggested_questions": [
                "How do I claim electricity duty exemption?",
                "What documents are needed for HT load sanction?",
                "What is the power subsidy for textile mills?"
            ],
            "recommended_department": "MSEDCL Power Connection",
            "prefill_inquiry": "We require assistance with industrial power load sanction and electricity duty exemption."
        }

    # 8. Fire Safety NOC
    if any(k in q for k in ["fire", "fire noc", "fire safety", "hydrant", "smoke", "setback"]):
        return {
            "reply": (
                "### 🚒 Maharashtra Fire Services NOC\n\n"
                "- **Provisional Fire NOC**: Mandatory prior to starting industrial civil construction. Submitted with architectural drawings.\n"
                "- **Final Fire NOC**: Mandatory prior to factory commissioning and issuance of Factory License.\n"
                "- **Key Requirements**:\n"
                "  - Minimum 6.00-meter clear peripheral driveway for fire tenders.\n"
                "  - Dedicated static fire water reservoir (50,000 to 200,000 Liters based on hazard category).\n"
                "  - Internal fire hydrants, automated sprinkler network, and smoke alarms."
            ),
            "action_links": [
                {"label": "Approvals & Compliance", "url": "/approvals"},
                {"label": "Fire Forms Blueprint", "url": "/forms"}
            ],
            "suggested_questions": [
                "Is Fire NOC mandatory for Green category units?",
                "What is the fee for Fire Services scrutiny?",
                "How do I apply for Provisional Fire NOC?"
            ],
            "recommended_department": "Fire Safety NOC",
            "prefill_inquiry": "Need verification of Fire Safety NOC requirements and setback norms for our factory."
        }

    # 9. Sector Policies: Textile, EV, IT, Food Processing
    if any(k in q for k in ["textile", "loom", "weaving", "spinning", "garment"]):
        return {
            "reply": (
                "### 🧵 Integrated & Sustainable Textile Policy 2023–2028\n\n"
                "- **Capital Subsidy**: **25% to 45%** on eligible plant & machinery for ginning, spinning, weaving, and garmenting units.\n"
                "- **Power Concession**: Additional **₹2.00 to ₹3.00 per unit** power tariff subsidy for powerlooms and textile processing plants.\n"
                "- **Special Textile Parks**: Capital grant up to ₹50 Crores for developing integrated textile infrastructure.\n"
                "- **Women & SC/ST Entrepreneurs**: Additional 5% to 10% capital subsidy on machinery."
            ),
            "action_links": [
                {"label": "Test Textile Demo Project", "url": "/assess?demo=textile"},
                {"label": "Explore Incentives", "url": "/incentives"}
            ],
            "suggested_questions": [
                "What is the subsidy for powerloom units?",
                "How do I claim textile power concession?",
                "What are the benefits for garment export units?"
            ],
            "recommended_department": "PSI-2019 Subsidies",
            "prefill_inquiry": "Requesting details on capital subsidy and power concessions under Textile Policy 2023-2028."
        }

    if any(k in q for k in ["ev", "electric vehicle", "battery", "charging"]):
        return {
            "reply": (
                "### 🚗 Maharashtra Electric Vehicle (EV) Policy 2025\n\n"
                "- **Pioneer EV Manufacturer Status**: Capital subsidy up to **15% of eligible FCI** for EV assembly and battery pack manufacturing.\n"
                "- **Tax Waivers**: **100% exemption** on road tax and vehicle registration fees for EV purchases within Maharashtra.\n"
                "- **Charging Infrastructure**: Subsidies for public charging stations; industrial electricity tariff applicability.\n"
                "- **Stamp Duty**: 100% stamp duty waiver on factory land acquisition."
            ),
            "action_links": [
                {"label": "Start EV Assessment", "url": "/assess"},
                {"label": "View Incentives", "url": "/incentives"}
            ],
            "suggested_questions": [
                "What incentives are given for battery manufacturing?",
                "Are EV charging stations exempt from MPCB consent?",
                "What is the power tariff for EV charging stations?"
            ],
            "recommended_department": "PSI-2019 Subsidies",
            "prefill_inquiry": "Seeking details on capital incentives for Electric Vehicle and Battery manufacturing."
        }

    # 10. Special Categories: Women, SC/ST, Export Units
    if any(k in q for k in ["women", "woman", "sc", "st", "backward", "social"]):
        return {
            "reply": (
                "### 👩‍💼 Special Incentives for Women & SC/ST Entrepreneurs\n\n"
                "The Government of Maharashtra provides special affirmative benefits:\n\n"
                "- **Additional Capital Subsidy**: **+10% to +20% higher subsidy** over standard PSI-2019 rates.\n"
                "- **Dr. Babasaheb Ambedkar Special PSI Scheme**: Tailored incentives for SC/ST industrialists with up to 100% SGST refund for 10 years.\n"
                "- **MIDC Plot Allotment Reservation**: **20% priority reservation** in MIDC industrial clusters for women and backward class entrepreneurs.\n"
                "- **Interest Subventions**: Extra 2% interest subvention on bank term loans."
            ),
            "action_links": [
                {"label": "Run Policy Assessment", "url": "/assess"},
                {"label": "Incentives Calculator", "url": "/incentives"}
            ],
            "suggested_questions": [
                "What documents prove Women-led enterprise status?",
                "How is the extra 20% subsidy disbursed?",
                "How do I apply for reserved MIDC plots?"
            ],
            "recommended_department": "PSI-2019 Subsidies",
            "prefill_inquiry": "We wish to claim special incentives under Women-led / SC-ST enterprise provisions."
        }

    # 11. Zone & Taluka Categorization
    if any(k in q for k in ["zone", "taluka", "district", "zone a", "zone b", "zone c", "zone d"]):
        return {
            "reply": (
                "### 🗺️ Maharashtra Industrial Zone Categorization\n\n"
                "Under PSI-2019, all 350+ Talukas are categorized into economic development zones:\n\n"
                "- **Zone A**: Developed metropolitan areas (Mumbai City, Mumbai Suburban, Thane, Pune Urban).\n"
                "- **Zone B**: Moderately developed industrial hubs (Nashik, Chakan, Ranjangaon, Kolhapur).\n"
                "- **Zone C**: Developing regions (Solapur, Ahmednagar, Jalgaon, Satara).\n"
                "- **Zone D**: Industrializing districts (Amravati, Dhule, Jalna, Latur, Nanded).\n"
                "- **Zone D+ & No Industry Districts**: High incentive areas (Gadchiroli, Hingoli, Washim, Nandurbar) eligible for **100% Gross SGST reimbursement for 10 years**."
            ),
            "action_links": [
                {"label": "Select District in Assessment", "url": "/assess"},
                {"label": "Incentives Calculator", "url": "/incentives"}
            ],
            "suggested_questions": [
                "Which zone is Nagpur district in?",
                "What is the subsidy percentage in Zone D+?",
                "How do I check my taluka category?"
            ],
            "recommended_department": "PSI-2019 Subsidies",
            "prefill_inquiry": "Clarification needed regarding our taluka's industrial zone categorization under PSI-2019."
        }

    # 12. Dynamic Database Search across 1,279 Rules and 184 Forms
    try:
        conn = _get_conn()
        clean_words = re.findall(r'[a-zA-Z]{4,}', q)
        clean_words = [w for w in clean_words if w not in {"what", "when", "where", "which", "about", "have", "with", "from", "need", "help", "please", "want", "does", "make"}]

        if clean_words:
            search_term = f"%{clean_words[0]}%"

            # Query rules
            rule = conn.execute("""
                SELECT rule_name, policy_sector, eligibility_criteria_json, incentive_details_json, confidence
                FROM canonical_rules
                WHERE rule_name LIKE ? OR policy_sector LIKE ? OR eligibility_criteria_json LIKE ?
                ORDER BY confidence DESC LIMIT 1
            """, (search_term, search_term, search_term)).fetchone()

            # Query forms
            form = conn.execute("""
                SELECT form_name, form_number, submission_method, evidence_text
                FROM form_requirements
                WHERE form_name LIKE ? OR evidence_text LIKE ?
                ORDER BY confidence DESC LIMIT 1
            """, (search_term, search_term)).fetchone()

            if rule or form:
                reply_parts = ["### 📜 Official Maharashtra Policy Gazette Findings\n"]
                if rule:
                    r = dict(rule)
                    reply_parts.append(f"**Codified Policy Rule**: {r.get('rule_name')}\n")
                    reply_parts.append(f"• **Sector**: {r.get('policy_sector', 'Industrial Promotion')}\n")
                    if r.get('eligibility_criteria_json') and r.get('eligibility_criteria_json') != "{}":
                        try:
                            crit = json.loads(r.get('eligibility_criteria_json'))
                            if isinstance(crit, dict) and crit:
                                first_crit = next(iter(crit.items()))
                                reply_parts.append(f"• **Eligibility Criteria**: {first_crit[0]} — {first_crit[1]}\n")
                        except Exception:
                            pass

                if form:
                    f = dict(form)
                    reply_parts.append(f"\n**Associated Statutory Form**: {f.get('form_name')} ({f.get('form_number', 'CAF')})\n")
                    reply_parts.append(f"• **Submission Mode**: {f.get('submission_method', 'MAITRI Single Window Portal')}\n")

                reply_parts.append("\nYou can directly evaluate your project under these rules using the **Project Assessment** engine or browse all 186+ forms in the repository.")

                return {
                    "reply": "\n".join(reply_parts),
                    "action_links": [
                        {"label": "Evaluate in Assessment", "url": "/assess"},
                        {"label": "Search Knowledge Base", "url": "/knowledge"}
                    ],
                    "suggested_questions": [
                        "What documents are needed for this rule?",
                        "What is the statutory approval timeline?",
                        "Connect to Live Officer for this"
                    ],
                    "recommended_department": "General Inquiries",
                    "prefill_inquiry": f"I need official clarification on: {query_text.strip()}"
                }
    except Exception:
        pass

    # Generic intelligent fallback
    return {
        "reply": (
            "### 🏛️ Maharashtra UIAS Digital Assistant\n\n"
            "I can assist you with all procedures, incentives, and clearances across the **Smart Maharashtra Single Window System**:\n\n"
            "- **Project Assessment (`/assess`)**: Determine clearances and subsidy eligibility based on your investment and district.\n"
            "- **Approvals & Compliance (`/approvals`)**: Requirements for MPCB (CTE/CTO), Fire NOC, MIDC, and DISHT licenses.\n"
            "- **PSI-2019 Incentives (`/incentives`)**: Gross SGST refund, interest subsidies, and power tariff discounts.\n"
            "- **Forms Repository (`/forms`)**: 186+ codified government application forms with auto-fill blueprints.\n"
            "- **Live Officer Desk**: Connect with a Government Single-Window Officer via the **Live Agent** tab above."
        ),
        "action_links": [
            {"label": "Start Project Assessment", "url": "/assess"},
            {"label": "Explore Incentives", "url": "/incentives"},
            {"label": "Forms Repository", "url": "/forms"}
        ],
        "suggested_questions": [
            "How do I assess my project?",
            "What incentives are offered under PSI-2019?",
            "How do I get MPCB Consent?",
            "Connect me with a Live Officer"
        ],
        "recommended_department": "General Inquiries",
        "prefill_inquiry": query_text.strip()
    }


# ── Support API Endpoints ─────────────────────────────────────────────────────

@support_router.post("/bot/query")
def bot_query(payload: BotQueryRequest) -> Dict[str, Any]:
    """Endpoint for AI chatbot to return rich answers and action links."""
    return generate_bot_response(
        query_text=payload.query,
        current_page=payload.current_page,
        history=payload.history,
        applicant_context=payload.applicant_context,
        gemini_api_key=payload.gemini_api_key,
        target_language=payload.target_language or "en",
    )


@support_router.post("/tickets")
def create_ticket(payload: TicketCreateRequest) -> Dict[str, Any]:
    """Creates a new citizen inquiry ticket and notifies the officer desk."""
    init_support_tables()
    conn = _get_conn()
    ticket_id = f"TKT-2026-{random.randint(1000, 9999)}"
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    try:
        conn.execute("""
            INSERT INTO support_tickets (
                ticket_id, applicant_name, entity_name, email, phone, district, department, subject,
                status, priority, assigned_officer, current_stage, sector, investment_inr, project_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, NULL, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id,
            payload.applicant_name,
            payload.entity_name,
            payload.email or "",
            payload.phone or "",
            payload.district or "Maharashtra",
            payload.department,
            payload.subject,
            payload.priority or "NORMAL",
            payload.current_stage or "Pre-Establishment",
            payload.sector or "General Industry",
            payload.investment_inr or 0.0,
            payload.project_id or "",
            now,
            now
        ))

        # Insert citizen's message with optional media/document attachment
        conn.execute("""
            INSERT INTO support_ticket_messages (
                ticket_id, sender, sender_name, sender_title, text,
                attachment_name, attachment_type, attachment_data, attachment_size, created_at
            ) VALUES (?, 'user', ?, 'Applicant', ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id,
            payload.applicant_name,
            payload.initial_message,
            payload.attachment_name,
            payload.attachment_type,
            payload.attachment_data,
            payload.attachment_size,
            now
        ))

        # Refined professional government acknowledgment
        system_ack = (
            f"🏛️ MAITRI Single Window Desk: Namaskar! Your inquiry has been registered under Reference #{ticket_id} "
            f"with the Government of Maharashtra Directorate of Industries. It has been routed to the {payload.department} "
            "desk. An assigned Single Window Officer is reviewing your submission. Typical response time is 2 to 5 minutes."
        )
        conn.execute("""
            INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, sender_title, text, created_at)
            VALUES (?, 'system', 'MAITRI Dispatch Cell', 'Government Record', ?, ?)
        """, (
            ticket_id,
            system_ack,
            now
        ))

        conn.commit()
    finally:
        conn.close()

    return {
        "status": "ok",
        "ticket_id": ticket_id,
        "message": "Inquiry successfully submitted to the Government Officer Desk."
    }


@support_router.get("/tickets")
def list_tickets(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
) -> List[Dict[str, Any]]:
    """List tickets for the Government Officer portal."""
    init_support_tables()
    conn = _get_conn()
    try:
        query = "SELECT * FROM support_tickets WHERE 1=1"
        params: list = []
        if department and department != "All":
            query += " AND department = ?"
            params.append(department)
        if status and status != "All":
            query += " AND status = ?"
            params.append(status)

        query += " ORDER BY updated_at DESC LIMIT ?"
        params.append(limit)

        rows = conn.execute(query, params).fetchall()
        tickets = []
        for r in rows:
            d = dict(r)
            msg_count = conn.execute("SELECT COUNT(*) FROM support_ticket_messages WHERE ticket_id = ?", (d["ticket_id"],)).fetchone()[0]
            d["message_count"] = msg_count
            tickets.append(d)
        return tickets
    finally:
        conn.close()


@support_router.get("/tickets/{ticket_id}")
def get_ticket_detail(ticket_id: str) -> Dict[str, Any]:
    """
    Retrieve full ticket detail, chat thread messages, media attachments,
    applicant's current stage, and all statutory forms submitted by the enterprise.
    """
    init_support_tables()
    conn = _get_conn()
    try:
        tkt = conn.execute("SELECT * FROM support_tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
        if not tkt:
            raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
        ticket_data = dict(tkt)

        # Chat messages with attachments
        messages = conn.execute(
            "SELECT * FROM support_ticket_messages WHERE ticket_id = ? ORDER BY message_id ASC",
            (ticket_id,)
        ).fetchall()
        ticket_data["messages"] = [dict(m) for m in messages]

        # Retrieve all submitted forms for this enterprise or project
        entity_name = ticket_data.get("entity_name") or ""
        project_id = ticket_data.get("project_id") or ""

        form_rows = conn.execute("""
            SELECT submission_id, project_id, entity_name, form_requirement_id, form_name, form_number, status, collected_values_json, created_at
            FROM form_submissions
            WHERE entity_name LIKE ? OR (project_id != '' AND project_id = ?)
            ORDER BY created_at DESC
        """, (f"%{entity_name}%", project_id)).fetchall()

        submitted_forms = []
        for fr in form_rows:
            fd = dict(fr)
            try:
                fd["collected_values"] = json.loads(fd.get("collected_values_json") or "{}")
            except Exception:
                fd["collected_values"] = {}
            submitted_forms.append(fd)

        ticket_data["submitted_forms"] = submitted_forms

        return ticket_data
    finally:
        conn.close()


@support_router.post("/tickets/{ticket_id}/messages")
def post_ticket_message(ticket_id: str, payload: MessageCreateRequest) -> Dict[str, Any]:
    """Add a new message from citizen or officer to an existing ticket, with media/document support."""
    init_support_tables()
    conn = _get_conn()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        tkt = conn.execute("SELECT * FROM support_tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
        if not tkt:
            raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

        conn.execute("""
            INSERT INTO support_ticket_messages (
                ticket_id, sender, sender_name, sender_title, text,
                attachment_name, attachment_type, attachment_data, attachment_size, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_id,
            payload.sender,
            payload.sender_name,
            payload.sender_title or ("Government Officer" if payload.sender == "officer" else "Applicant"),
            payload.text,
            payload.attachment_name,
            payload.attachment_type,
            payload.attachment_data,
            payload.attachment_size,
            now
        ))

        new_status = tkt["status"]
        if payload.sender == "officer":
            new_status = "IN_PROGRESS" if tkt["status"] == "PENDING" else tkt["status"]
            conn.execute("""
                UPDATE support_tickets
                SET updated_at = ?, status = ?, assigned_officer = COALESCE(assigned_officer, ?)
                WHERE ticket_id = ?
            """, (now, new_status, payload.sender_name, ticket_id))
        else:
            conn.execute("""
                UPDATE support_tickets SET updated_at = ? WHERE ticket_id = ?
            """, (now, ticket_id))

        conn.commit()
    finally:
        conn.close()

    return {"status": "ok", "message": "Message sent successfully."}


@support_router.patch("/tickets/{ticket_id}/status")
def update_ticket_status(ticket_id: str, payload: TicketStatusUpdateRequest) -> Dict[str, Any]:
    """Allows officer to update ticket status (PENDING, IN_PROGRESS, RESOLVED)."""
    init_support_tables()
    conn = _get_conn()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        tkt = conn.execute("SELECT * FROM support_tickets WHERE ticket_id = ?", (ticket_id,)).fetchone()
        if not tkt:
            raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")

        conn.execute("""
            UPDATE support_tickets
            SET status = ?, assigned_officer = COALESCE(?, assigned_officer), updated_at = ?
            WHERE ticket_id = ?
        """, (payload.status, payload.assigned_officer, now, ticket_id))

        if payload.status == "RESOLVED":
            officer_name = payload.assigned_officer or "Government Officer"
            conn.execute("""
                INSERT INTO support_ticket_messages (ticket_id, sender, sender_name, sender_title, text, created_at)
                VALUES (?, 'system', 'MAITRI Resolution Desk', 'Case Closed', ?, ?)
            """, (
                ticket_id,
                f"✅ This inquiry has been marked as RESOLVED by {officer_name}. You may continue messaging below at any time if you have further inquiries.",
                now
            ))

        conn.commit()
    finally:
        conn.close()

    return {"status": "ok", "new_status": payload.status}


# ── Department Officer Authentication & Directory ─────────────────────────────

OFFICER_DIRECTORY = [
    {
        "username": "psi.officer",
        "password": "psi@123",
        "name": "Shri Sanjay Deshmukh",
        "designation": "Joint Director of Industries",
        "department": "PSI-2019 Subsidies",
        "badge": "💰 Incentives & Subsidies Cell",
        "avatar": "SD"
    },
    {
        "username": "mpcb.officer",
        "password": "mpcb@123",
        "name": "Er. Vivek Patil",
        "designation": "Sub-Regional Officer",
        "department": "MPCB Environmental Consents",
        "badge": "🌿 Environmental Clearance Cell",
        "avatar": "VP"
    },
    {
        "username": "midc.officer",
        "password": "midc@123",
        "name": "Shri Anand Gokhale",
        "designation": "Executive Engineer",
        "department": "MIDC Land Allotment",
        "badge": "🏗️ Industrial Land & Plots Cell",
        "avatar": "AG"
    },
    {
        "username": "msedcl.officer",
        "password": "power@123",
        "name": "Er. Nitin Shinde",
        "designation": "Superintending Engineer",
        "department": "MSEDCL Power Connection",
        "badge": "⚡ Industrial Power Sanction Cell",
        "avatar": "NS"
    },
    {
        "username": "fire.officer",
        "password": "fire@123",
        "name": "Chief Fire Officer M. Kadam",
        "designation": "Directorate of Fire Services",
        "department": "Fire Safety NOC",
        "badge": "🚒 Fire Safety & Town Planning",
        "avatar": "MK"
    },
    {
        "username": "general.officer",
        "password": "general@123",
        "name": "Smt. Sunita Joshi",
        "designation": "Single Window Facilitation Officer",
        "department": "General Inquiries",
        "badge": "📝 Single Window Help Desk",
        "avatar": "SJ"
    },
    {
        "username": "super.admin",
        "password": "admin@123",
        "name": "Adv. Radhika Kulkarni",
        "designation": "MAITRI Single Window Commissioner",
        "department": "All",
        "badge": "🏛️ State Single Window Oversight",
        "avatar": "RK"
    }
]

class OfficerLoginRequest(BaseModel):
    username: str
    password: str

@support_router.post("/officer-login")
def officer_login(payload: OfficerLoginRequest) -> Dict[str, Any]:
    """Authenticates an officer by username/password and returns departmental role."""
    u = payload.username.strip().lower()
    p = payload.password.strip()
    for off in OFFICER_DIRECTORY:
        if off["username"].lower() == u and off["password"] == p:
            return {
                "status": "ok",
                "officer": {
                    "username": off["username"],
                    "name": off["name"],
                    "designation": off["designation"],
                    "department": off["department"],
                    "badge": off["badge"],
                    "avatar": off["avatar"]
                }
            }
    raise HTTPException(status_code=401, detail="Invalid officer username or password. Check credentials.")

@support_router.get("/officers")
def list_officers() -> List[Dict[str, Any]]:
    """Returns directory of departmental officers for demonstration selection."""
    return [
        {
            "username": o["username"],
            "name": o["name"],
            "designation": o["designation"],
            "department": o["department"],
            "badge": o["badge"],
            "avatar": o["avatar"]
        }
        for o in OFFICER_DIRECTORY
    ]

