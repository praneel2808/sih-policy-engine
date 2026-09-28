// types/index.ts — SMSWS shared TypeScript types

export type EntityType = "Company" | "LLP" | "Proprietorship";

export type Sector =
  | "Chemical"
  | "Textile"
  | "Engineering"
  | "Food Processing"
  | "EV / Automotive"
  | "Electronics"
  | "IT / ITES"
  | "Logistics"
  | "Aerospace"
  | "Startup"
  | "Other";

export type LocationType = "MIDC" | "Private industrial area" | "Other";

export type ProjectStage =
  | "Pre-establishment"
  | "Construction"
  | "Operational"
  | "Expansion";

export interface ApplicantProfile {
  entity_type: EntityType;
  entity_name: string;
  pan?: string;
  registration_number?: string;

  sector: Sector;
  nic_code?: string;
  product_description?: string;

  district?: string;
  taluka?: string;
  plot_address?: string;
  location_type?: LocationType;
  land_area?: number;
  survey_number?: string;
  land_document_filename?: string;

  investment_inr?: number;
  power_kw?: number;
  employment_expected?: number;

  stage: ProjectStage;

  is_export_oriented?: boolean;
  women_led_enterprise?: boolean;
  student_led_enterprise?: boolean;
  taluka_category?: string;
  built_up_area_sqft?: number;
}

export interface SourceEvidence {
  chunk_id: string;
  document_id: string;
  filename: string;
  source_url?: string;
  page_start: number;
  page_end: number;
  section_reference?: string;
  extraction_method?: string;
  relevance_score: number;
  text: string;
}

export interface PolicyPathway {
  name: string;
  status: string;
  reason: string;
  evidence: SourceEvidence[];
}

export interface ApprovalItem {
  name: string;
  stage: string;
  status: string;
  reason: string;
  authority?: string;
  evidence: SourceEvidence[];
}

export interface IncentiveItem {
  name: string;
  status: string;
  reason: string;
  evidence: SourceEvidence[];
}

export interface ProjectSummary {
  entity_name: string;
  entity_type: string;
  sector: string;
  district?: string;
  location_type?: string;
  investment_inr?: number;
  employment_expected?: number;
  stage: string;
}

export interface AssessmentResponse {
  project_summary: ProjectSummary;
  applicable_policies: PolicyPathway[];
  approvals: ApprovalItem[];
  incentives: IncentiveItem[];
  documents_required: string[];
  warnings: string[];
  sources: SourceEvidence[];
  disclaimer: string;
}

export interface FormField {
  form_field_id: number;
  form_requirement_id: number;
  field_order: number;
  field_name: string;
  official_field_label: string;
  input_type: string;
  required: number;
  options?: string;
  condition?: string;
  validation?: string;
}

export interface FormRequirement {
  form_requirement_id: number;
  canonical_rule_id?: string;
  rule_id?: number;
  document_id?: string;
  chunk_id?: string;
  form_name: string;
  form_number?: string;
  form_type?: string;
  required?: string;
  condition?: string;
  applicant_scope?: string;
  submission_method?: string;
  reference_type?: string;
  evidence_text?: string;
  page_start?: number;
  page_end?: number;
  confidence?: number;
  filename?: string;
  source_url?: string;
  rule_name?: string;
  policy_sector?: string;
  fields?: FormField[];
}

// ── Demo profiles ─────────────────────────────────────────────────────────────

export const DEMO_TEXTILE: ApplicantProfile = {
  entity_type: "Company",
  entity_name: "Maharashtra Textile Innovations Pvt. Ltd.",
  pan: "AABCT1234E",
  sector: "Textile",
  product_description: "Integrated textile manufacturing — spinning, weaving, and garment production",
  district: "Pune",
  taluka: "Haveli",
  location_type: "MIDC",
  land_area: 10000,
  investment_inr: 120_000_000,
  power_kw: 2500,
  employment_expected: 250,
  stage: "Pre-establishment",
};

export const DEMO_EV: ApplicantProfile = {
  entity_type: "Company",
  entity_name: "Maharashtra EV Systems Pvt. Ltd.",
  sector: "EV / Automotive",
  product_description: "Electric two-wheeler and three-wheeler manufacturing with battery assembly",
  district: "Aurangabad",
  taluka: "Aurangabad",
  location_type: "MIDC",
  land_area: 15000,
  investment_inr: 150_000_000,
  power_kw: 3000,
  employment_expected: 300,
  stage: "Pre-establishment",
};
