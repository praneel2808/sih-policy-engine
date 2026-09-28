// lib/api.ts — API client for the SMSWS backend

import type { ApplicantProfile, AssessmentResponse, SourceEvidence, FormRequirement } from "@/types";

let activeApiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = path.startsWith("http") ? path : `${activeApiBase}${path}`;
  try {
    return await fetch(url, options);
  } catch (err) {
    if (activeApiBase.includes("localhost")) {
      activeApiBase = activeApiBase.replace("localhost", "127.0.0.1");
      const fallbackUrl = path.startsWith("http")
        ? path.replace("localhost", "127.0.0.1")
        : `${activeApiBase}${path}`;
      return await fetch(fallbackUrl, options);
    } else if (activeApiBase.includes("127.0.0.1")) {
      activeApiBase = activeApiBase.replace("127.0.0.1", "localhost");
      const fallbackUrl = path.startsWith("http")
        ? path.replace("127.0.0.1", "localhost")
        : `${activeApiBase}${path}`;
      return await fetch(fallbackUrl, options);
    }
    throw new Error(
      `Network Error: Could not connect to the Backend API at ${activeApiBase}. Please ensure the backend server is running on port 8000.`
    );
  }
}

export async function submitAssessment(
  profile: ApplicantProfile
): Promise<AssessmentResponse> {
  const res = await apiFetch(`/api/assessment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });

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
  const res = await apiFetch(`/api/sources/${encodeURIComponent(chunkId)}`);
  if (!res.ok) throw new Error("Source not found");
  return res.json();
}

export async function getForms(sector?: string): Promise<FormRequirement[]> {
  const params = new URLSearchParams({ limit: "200", deduplicate: "true" });
  if (sector) params.set("sector", sector);
  const res = await apiFetch(`/api/forms?${params.toString()}`);
  if (!res.ok) throw new Error("Could not load form requirements");
  return res.json();
}

export async function getFormFields(formRequirementId: number): Promise<any[]> {
  const res = await apiFetch(`/api/forms/${formRequirementId}/fields`);
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
  const res = await apiFetch(`/api/form-submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save form submissions");
  return res.json();
}

export async function healthCheck(): Promise<{ status: string; db_exists: boolean; gemini_active: boolean }> {
  const res = await apiFetch(`/api/health`);
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
  const res = await apiFetch(`/api/health/db`);
  if (!res.ok) throw new Error("Could not fetch DB health");
  return res.json();
}

export async function getCanonicalRules(sector?: string, limit = 50): Promise<{ total: number; rules: any[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (sector) params.set("sector", sector);
  const res = await apiFetch(`/api/canonical-rules?${params.toString()}`);
  if (!res.ok) throw new Error("Could not load canonical rules");
  return res.json();
}

export async function getDocuments(limit = 50): Promise<{ total: number; documents: any[] }> {
  const params = new URLSearchParams({ limit: String(limit) });
  const res = await apiFetch(`/api/documents?${params.toString()}`);
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
  const res = await apiFetch(`/api/auth/register`, {
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
  const res = await apiFetch(`/api/auth/login`, {
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
  const res = await apiFetch(`/api/auth/profile/${userId}`, {
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
  const res = await apiFetch(`/api/auth/assessment/${userId}`);
  if (!res.ok) throw new Error('Could not load assessment');
  return res.json();
}

export async function deleteAccount(userId: number): Promise<{ status: string; message: string }> {
  const res = await apiFetch(`/api/auth/account/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to delete account');
  }
  return res.json();
}

// ── Live Support & AI Bot API ────────────────────────────────────────────────

export interface SubmittedFormRecord {
  submission_id: number;
  project_id?: string;
  entity_name: string;
  form_requirement_id?: number;
  form_name: string;
  form_number?: string;
  status?: string;
  collected_values: Record<string, any>;
  created_at: string;
}

export interface SupportTicket {
  ticket_id: string;
  applicant_name: string;
  entity_name: string;
  email?: string;
  phone?: string;
  district?: string;
  department: string;
  subject: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
  current_stage?: string;
  sector?: string;
  investment_inr?: number;
  project_id?: string;
  assigned_officer?: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: SupportMessage[];
  submitted_forms?: SubmittedFormRecord[];
}

export interface SupportMessage {
  message_id?: number;
  ticket_id: string;
  sender: 'user' | 'officer' | 'system';
  sender_name: string;
  sender_title?: string;
  text: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_data?: string;
  attachment_size?: number;
  created_at: string;
}

export interface BotResponse {
  reply: string;
  action_links?: Array<{ label: string; url: string }>;
  suggested_questions?: string[];
  recommended_department?: string;
  prefill_inquiry?: string;
}

export async function askSupportBot(
  query: string,
  currentPage?: string,
  history?: Array<{ sender: 'user' | 'bot'; text: string }>,
  applicantContext?: Record<string, any>,
  geminiApiKey?: string,
  targetLanguage?: string
): Promise<BotResponse> {
  const res = await apiFetch(`/api/support/bot/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      current_page: currentPage,
      history,
      applicant_context: applicantContext,
      gemini_api_key: geminiApiKey,
      target_language: targetLanguage || 'en',
    }),
  });
  if (!res.ok) throw new Error('AI Assistant service unavailable');
  return res.json();
}

export async function createSupportTicket(data: {
  applicant_name: string;
  entity_name: string;
  email?: string;
  phone?: string;
  district?: string;
  department: string;
  subject: string;
  initial_message: string;
  priority?: string;
  current_stage?: string;
  sector?: string;
  investment_inr?: number;
  project_id?: string;
  attachment_name?: string;
  attachment_type?: string;
  attachment_data?: string;
  attachment_size?: number;
}): Promise<{ status: string; ticket_id: string; message: string }> {
  const res = await apiFetch(`/api/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Failed to create support ticket');
  }
  return res.json();
}

export async function getSupportTickets(department?: string, status?: string): Promise<SupportTicket[]> {
  const params = new URLSearchParams();
  if (department && department !== 'All') params.set('department', department);
  if (status && status !== 'All') params.set('status', status);
  const res = await apiFetch(`/api/support/tickets?${params.toString()}`);
  if (!res.ok) throw new Error('Could not fetch support tickets');
  return res.json();
}

export async function getSupportTicketDetail(ticketId: string): Promise<SupportTicket> {
  const res = await apiFetch(`/api/support/tickets/${encodeURIComponent(ticketId)}`);
  if (!res.ok) throw new Error('Could not load ticket detail');
  return res.json();
}

export async function postTicketMessage(
  ticketId: string,
  data: {
    sender: string;
    sender_name: string;
    sender_title?: string;
    text: string;
    attachment_name?: string;
    attachment_type?: string;
    attachment_data?: string;
    attachment_size?: number;
  }
): Promise<{ status: string; message: string }> {
  const res = await apiFetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function updateTicketStatus(
  ticketId: string,
  status: string,
  assignedOfficer?: string
): Promise<{ status: string; new_status: string }> {
  const res = await apiFetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, assigned_officer: assignedOfficer }),
  });
  if (!res.ok) throw new Error('Failed to update ticket status');
  return res.json();
}

