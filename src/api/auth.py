import hashlib
import json
import os
import secrets
from typing import Optional

import sqlite3

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.models import ApplicantProfile, Sector, ProjectStage, LocationType, EntityType
from src.assessment import run_assessment

_HERE = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.abspath(os.path.join(_HERE, "..", ".."))
DB_PATH = os.environ.get("SMSWS_DB_PATH", os.path.join(_PROJECT_ROOT, "db", "policy_engine.db"))

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

auth_router = APIRouter(prefix="/api/auth", tags=["auth"])

def _ensure_auth_tables():
    conn = _get_conn()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_name TEXT NOT NULL,
                sector TEXT NOT NULL,
                stage TEXT NOT NULL,
                district TEXT,
                investment_inr REAL,
                employment_expected INTEGER,
                location_type TEXT,
                nic_code TEXT,
                pan TEXT,
                product_description TEXT,
                taluka TEXT,
                power_kw REAL,
                is_export_oriented INTEGER DEFAULT 0,
                women_led_enterprise INTEGER DEFAULT 0,
                student_led_enterprise INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_assessments (
                assessment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                assessment_json TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
        """)
        conn.commit()

        # Seed demo user if not exists
        demo = conn.execute("SELECT 1 FROM users WHERE username = 'sih130'").fetchone()
        if not demo:
            salt = secrets.token_hex(32)
            pw_hash = hashlib.pbkdf2_hmac('sha256', 'uias130@'.encode(), bytes.fromhex(salt), 100000).hex()
            cur = conn.execute("""
                INSERT INTO users (
                    username, password_hash, salt, entity_type, entity_name, sector, stage,
                    district, investment_inr, employment_expected, location_type
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'sih130', pw_hash, salt, 'Company', 'Industrial Officer Enterprise',
                'Textile', 'Pre-establishment', 'Pune', 120000000, 250, 'MIDC'
            ))
            demo_id = cur.lastrowid
            try:
                demo_p = ApplicantProfile(
                    entity_type=EntityType.company,
                    entity_name='Industrial Officer Enterprise',
                    sector=Sector.textile,
                    stage=ProjectStage.pre_establishment,
                    district='Pune',
                    investment_inr=120000000,
                    employment_expected=250,
                    location_type=LocationType.midc
                )
                res = run_assessment(demo_p, db_path=DB_PATH)
                conn.execute(
                    "INSERT INTO user_assessments (user_id, assessment_json) VALUES (?, ?)",
                    (demo_id, json.dumps(res.model_dump()))
                )
            except Exception:
                pass
            conn.commit()
    finally:
        conn.close()

_ensure_auth_tables()

class RegisterRequest(BaseModel):
    username: str
    password: str
    entity_type: str
    entity_name: str
    sector: Sector
    stage: ProjectStage
    district: Optional[str] = None
    investment_inr: Optional[float] = None
    employment_expected: Optional[int] = None
    location_type: Optional[LocationType] = None
    nic_code: Optional[str] = None
    pan: Optional[str] = None
    product_description: Optional[str] = None
    taluka: Optional[str] = None
    power_kw: Optional[float] = None
    is_export_oriented: Optional[bool] = None
    women_led_enterprise: Optional[bool] = None
    student_led_enterprise: Optional[bool] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdateRequest(BaseModel):
    entity_type: str
    entity_name: str
    sector: Sector
    stage: ProjectStage
    district: Optional[str] = None
    investment_inr: Optional[float] = None
    employment_expected: Optional[int] = None
    location_type: Optional[LocationType] = None
    nic_code: Optional[str] = None
    pan: Optional[str] = None
    product_description: Optional[str] = None
    taluka: Optional[str] = None
    power_kw: Optional[float] = None
    is_export_oriented: Optional[bool] = None
    women_led_enterprise: Optional[bool] = None
    student_led_enterprise: Optional[bool] = None

def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 100000).hex()

@auth_router.post("/register")
def register(req: RegisterRequest):
    conn = _get_conn()
    try:
        user_exists = conn.execute("SELECT 1 FROM users WHERE username = ?", (req.username,)).fetchone()
        if user_exists:
            raise HTTPException(status_code=409, detail="Username already exists")

        salt = secrets.token_hex(32)
        password_hash = hash_password(req.password, salt)

        cur = conn.execute("""
            INSERT INTO users (
                username, password_hash, salt, entity_type, entity_name, sector, stage,
                district, investment_inr, employment_expected, location_type, nic_code,
                pan, product_description, taluka, power_kw, is_export_oriented,
                women_led_enterprise, student_led_enterprise
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            req.username, password_hash, salt, req.entity_type, req.entity_name,
            req.sector.value, req.stage.value, req.district, req.investment_inr,
            req.employment_expected, req.location_type.value if req.location_type else None,
            req.nic_code, req.pan, req.product_description, req.taluka, req.power_kw,
            int(req.is_export_oriented) if req.is_export_oriented is not None else 0,
            int(req.women_led_enterprise) if req.women_led_enterprise is not None else 0,
            int(req.student_led_enterprise) if req.student_led_enterprise is not None else 0,
        ))
        user_id = cur.lastrowid
        conn.commit()

        # Run assessment
        profile_kwargs = req.model_dump(exclude={"username", "password"})
        profile = ApplicantProfile(**profile_kwargs)
        assessment = run_assessment(profile, db_path=DB_PATH)
        
        assessment_json = json.dumps(assessment.model_dump(), ensure_ascii=False)
        conn.execute("""
            INSERT INTO user_assessments (user_id, assessment_json) VALUES (?, ?)
        """, (user_id, assessment_json))
        conn.commit()

        return {
            "user_id": user_id,
            "username": req.username,
            "entity_name": req.entity_name,
            "assessment": assessment.model_dump()
        }
    finally:
        conn.close()

@auth_router.post("/login")
def login(req: LoginRequest):
    conn = _get_conn()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (req.username,)).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user_dict = dict(user)
        expected_hash = hash_password(req.password, user_dict["salt"])
        if expected_hash != user_dict["password_hash"]:
            raise HTTPException(status_code=401, detail="Invalid username or password")

        latest_assessment = conn.execute(
            "SELECT assessment_json FROM user_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_dict["user_id"],)
        ).fetchone()

        assessment_data = json.loads(latest_assessment["assessment_json"]) if latest_assessment else None

        # Build profile dict (exclude auth fields and internal IDs)
        exclude_keys = {"user_id", "username", "password_hash", "salt", "created_at"}
        profile_dict = {k: v for k, v in user_dict.items() if k not in exclude_keys}

        return {
            "user_id": user_dict["user_id"],
            "username": user_dict["username"],
            "entity_name": user_dict["entity_name"],
            "profile": profile_dict,
            "assessment": assessment_data
        }
    finally:
        conn.close()

@auth_router.put("/profile/{user_id}")
def update_profile(user_id: int, req: ProfileUpdateRequest):
    conn = _get_conn()
    try:
        user = conn.execute("SELECT 1 FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        conn.execute("""
            UPDATE users SET
                entity_type = ?, entity_name = ?, sector = ?, stage = ?,
                district = ?, investment_inr = ?, employment_expected = ?, location_type = ?,
                nic_code = ?, pan = ?, product_description = ?, taluka = ?, power_kw = ?,
                is_export_oriented = ?, women_led_enterprise = ?, student_led_enterprise = ?
            WHERE user_id = ?
        """, (
            req.entity_type, req.entity_name, req.sector.value, req.stage.value,
            req.district, req.investment_inr, req.employment_expected,
            req.location_type.value if req.location_type else None,
            req.nic_code, req.pan, req.product_description, req.taluka, req.power_kw,
            int(req.is_export_oriented) if req.is_export_oriented is not None else 0,
            int(req.women_led_enterprise) if req.women_led_enterprise is not None else 0,
            int(req.student_led_enterprise) if req.student_led_enterprise is not None else 0,
            user_id
        ))
        conn.commit()

        profile = ApplicantProfile(**req.model_dump())
        assessment = run_assessment(profile, db_path=DB_PATH)
        assessment_json = json.dumps(assessment.model_dump(), ensure_ascii=False)

        conn.execute("""
            INSERT INTO user_assessments (user_id, assessment_json) VALUES (?, ?)
        """, (user_id, assessment_json))
        conn.commit()

        return {
            "user_id": user_id,
            "profile": req.model_dump(),
            "assessment": assessment.model_dump()
        }
    finally:
        conn.close()

@auth_router.get("/assessment/{user_id}")
def get_assessment(user_id: int):
    conn = _get_conn()
    try:
        latest_assessment = conn.execute(
            "SELECT assessment_json FROM user_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
            (user_id,)
        ).fetchone()

        assessment_data = json.loads(latest_assessment["assessment_json"]) if latest_assessment else None
        return {"assessment": assessment_data}
    finally:
        conn.close()

@auth_router.delete("/account/{user_id}")
def delete_account(user_id: int):
    conn = _get_conn()
    try:
        user = conn.execute("SELECT 1 FROM users WHERE user_id = ?", (user_id,)).fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        conn.execute("DELETE FROM user_assessments WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE user_id = ?", (user_id,))
        conn.commit()
        return {"status": "ok", "message": "Account successfully deleted"}
    finally:
        conn.close()
