// lib/api.ts — API client for the SMSWS backend

import type { ApplicantProfile, AssessmentResponse, SourceEvidence, FormRequirement } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function submitAssessment(
  profile: ApplicantProfile
): Promise<AssessmentResponse> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/assessment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  } catch {
    if (API_BASE.includes("localhost")) {
      try {
        const fallbackUrl = API_BASE.replace("localhost", "127.0.0.1");
        res = await fetch(`${fallbackUrl}/api/assessment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
        });
      } catch {
        throw new Error(
          `Network Error: Could not connect to the Backend API at ${API_BASE}. Please ensure the backend server is running on port 8000.`
        );
      }
    } else {
      throw new Error(
        `Network Error: Could not connect to the Backend API at ${API_BASE}. Please ensure the backend server is running on port 8000.`
      );
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    let errorMsg = "Assessment request failed";
    if (Array.isArray(err.detail)) {
      errorMsg = err.detail.map((e: { loc: string[]; msg: string }) => `${e.loc.join(".")}: ${e.msg}`).join(", ");
    } else if (typeof err.detail === "string") {
      errorMsg = err.detail;
    }
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function getSource(chunkId: string): Promise<SourceEvidence> {
  const res = await fetch(`${API_BASE}/api/sources/${encodeURIComponent(chunkId)}`);
  if (!res.ok) throw new Error("Source not found");
  return res.json();
}

export async function getForms(sector?: string): Promise<FormRequirement[]> {
  const params = new URLSearchParams({ limit: "200", deduplicate: "true" });
  if (sector) params.set("sector", sector);
  const res = await fetch(`${API_BASE}/api/forms?${params.toString()}`);
  if (!res.ok) throw new Error("Could not load form requirements");
  return res.json();
}

export async function getFormFields(formRequirementId: number): Promise<any[]> {
  const res = await fetch(`${API_BASE}/api/forms/${formRequirementId}/fields`);
  if (!res.ok) throw new Error("Could not load form fields");
  return res.json();
}

export async function submitFormSubmissions(payload: {
  project_id?: string;
  entity_name?: string;
  submissions: Array<{
    form_requirement_id: number;
    form_name?: string;
    form_number?: string;
    collected_values: Record<string, any>;
  }>;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/form-submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save form submissions");
  return res.json();
}

export async function healthCheck(): Promise<{ status: string; db_exists: boolean; gemini_active: boolean }> {
  const res = await fetch(`${API_BASE}/api/health`);
  if (!res.ok) throw new Error("Backend not reachable");
  return res.json();
}

export async function getDbHealth(): Promise<{
  status: string;
  documents: number;
  extracted: number;
  chunks: number;
  candidate_rules: number;
  canonical_rules: number;
  form_requirements: number;
}> {
  const res = await fetch(`${API_BASE}/api/health/db`);
  if (!res.ok) throw new Error("Could not fetch DB health");
  return res.json();
}

export async function getCanonicalRules(sector?: string, limit = 50): Promise<{ total: number; rules: any[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sector) params.set("sector", sector);
  const res = await fetch(`${API_BASE}/api/canonical-rules?${params.toString()}`);
  if (!res.ok) throw new Error("Could not load canonical rules");
  return res.json();
}

export async function getDocuments(limit = 50): Promise<{ total: number; documents: any[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(`${API_BASE}/api/documents?${params.toString()}`);
  if (!res.ok) throw new Error("Could not load documents");
  return res.json();
}

// ── Static data ───────────────────────────────────────────────────────────────

export const NIC_SUGGESTIONS = [
  { code: "13", description: "Manufacture of textiles", sector: "Textile" },
  { code: "14", description: "Manufacture of wearing apparel", sector: "Textile" },
  { code: "29", description: "Manufacture of motor vehicles, trailers", sector: "EV / Automotive" },
  { code: "27", description: "Manufacture of electrical equipment", sector: "Electronics" },
  { code: "26", description: "Manufacture of computer, electronic products", sector: "Electronics" },
  { code: "62", description: "Computer programming, consultancy activities", sector: "IT / ITES" },
  { code: "63", description: "Information service activities", sector: "IT / ITES" },
  { code: "10", description: "Manufacture of food products", sector: "Food Processing" },
  { code: "20", description: "Manufacture of chemicals and chemical products", sector: "Chemical" },
  { code: "25", description: "Manufacture of fabricated metal products", sector: "Engineering" },
  { code: "52", description: "Warehousing and support activities for transportation", sector: "Logistics" },
  { code: "30", description: "Manufacture of other transport equipment (incl. aircraft)", sector: "Aerospace" },
];

export const DISTRICTS = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed",
  "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
  "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
  "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
  "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani",
  "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
  "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
];

export async function registerUser(data: {
  username: string;
  password: string;
  entity_type: string;
  entity_name: string;
  sector: string;
  stage: string;
  district?: string;
  investment_inr?: number;
  employment_expected?: number;
  location_type?: string;
  nic_code?: string;
  pan?: string;
  product_description?: string;
  taluka?: string;
  power_kw?: number;
  is_export_oriented?: boolean;
  women_led_enterprise?: boolean;
  student_led_enterprise?: boolean;
}): Promise<{ user_id: number; username: string; entity_name: string; assessment: AssessmentResponse }> {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Registration failed');
  }
  return res.json();
}

export async function loginUser(username: string, password: string): Promise<{
  user_id: number;
  username: string;
  entity_name: string;
  profile: Record<string, any>;
  assessment: AssessmentResponse | null;
}> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Login failed');
  }
  return res.json();
}

export async function updateProfile(userId: number, data: Record<string, any>): Promise<{
  user_id: number;
  profile: Record<string, any>;
  assessment: AssessmentResponse;
}> {
  const res = await fetch(`${API_BASE}/api/auth/profile/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Profile update failed');
  }
  return res.json();
}

export async function getUserAssessment(userId: number): Promise<{ assessment: AssessmentResponse | null }> {
  const res = await fetch(`${API_BASE}/api/auth/assessment/${userId}`);
  if (!res.ok) throw new Error('Could not load assessment');
  return res.json();
}

export async function deleteAccount(userId: number): Promise<{ status: string; message: string }> {
  const res = await fetch(`${API_BASE}/api/auth/account/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to delete account');
  }
  return res.json();
}
