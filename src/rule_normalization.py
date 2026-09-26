"""
Deterministic Normalization Module for Candidate Rules.
Provides conservative, non-destructive normalization for rule comparison.
Never mutates original verbatim text.
"""

import re
import unicodedata
from typing import Dict, Any, List, Optional, Tuple

def normalize_text_for_comparison(text: Optional[str]) -> str:
    """
    Normalizes text for deterministic comparison:
    - Unicode normalization (NFKC)
    - Replaces smart quotes, em-dashes, and special bullets with ASCII
    - Collapses whitespace
    - Lowercases text
    - Standardizes currency prefix references (e.g., 'Rs.', 'INR', '₹' -> 'inr')
    - Strips non-alphanumeric punctuation from edges
    """
    if not text:
        return ""
    
    # 1. Unicode normalization
    norm = unicodedata.normalize("NFKC", str(text))
    
    # 2. Character replacements
    norm = norm.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    norm = norm.replace("—", "-").replace("–", "-")
    norm = norm.replace("•", " ").replace("·", " ").replace("▪", " ")
    
    # 3. Standardize common currency mentions without altering amounts
    norm = re.sub(r'(?:rs\.?|inr|₹)\s*', 'inr ', norm, flags=re.IGNORECASE)
    
    # 4. Standardize common crore / lakh / percent terms
    norm = re.sub(r'\bcr\.?\b', 'crore', norm, flags=re.IGNORECASE)
    norm = re.sub(r'\blakhs?\b', 'lakh', norm, flags=re.IGNORECASE)
    norm = re.sub(r'\bper\s*cent\b', '%', norm, flags=re.IGNORECASE)
    norm = re.sub(r'\bpercent\b', '%', norm, flags=re.IGNORECASE)

    # 5. Lowercase and collapse whitespace
    norm = norm.lower()
    norm = re.sub(r'\s+', ' ', norm).strip()
    
    # 6. Remove common boilerplate prefixes for comparison only
    boilerplate_prefixes = [
        r'^scheme for\s+',
        r'^guidelines for\s+',
        r'^policy for\s+',
        r'^incentives? for\s+',
        r'^provision of\s+',
        r'^rules? for\s+',
    ]
    for bp in boilerplate_prefixes:
        norm = re.sub(bp, '', norm)

    return norm.strip()


def normalize_sector(sector: Optional[str]) -> str:
    """Normalizes industry sector names to a canonical slug for comparison."""
    if not sector:
        return "general"
    
    s = normalize_text_for_comparison(sector)
    
    # Common mappings
    if any(k in s for k in ["it & ites", "it/ites", "information technology", "ites", "it & it-enabled"]):
        return "it_ites"
    if any(k in s for k in ["textile", "garment", "apparel", "spinning", "weaving"]):
        return "textile"
    if any(k in s for k in ["food processing", "agro processing", "agriculture processing"]):
        return "food_processing"
    if any(k in s for k in ["electronic", "esdm", "semiconductor"]):
        return "electronics_esdm"
    if any(k in s for k in ["electric vehicle", "ev manufacturing", "ev charging", "e-mobility"]):
        return "electric_vehicles"
    if any(k in s for k in ["biotechnology", "pharma", "pharmaceutical"]):
        return "biotech_pharma"
    if any(k in s for k in ["all industries", "general industrial", "all manufacturing", "general", "all sectors"]):
        return "general_industrial"
    
    # Clean generic slug
    slug = re.sub(r'[^a-z0-9]+', '_', s).strip('_')
    return slug or "general"


def normalize_eligibility(elig: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalizes eligibility criteria structure deterministically:
    - Preserves exact numbers (investment thresholds, employment)
    - Lowercases, strips, and sorts string lists
    - Preserves None vs False vs True
    """
    if not isinstance(elig, dict):
        return {}
    
    normalized = {}
    
    # Numerical / Exact threshold checks (preserved strictly)
    normalized["min_capital_investment_inr"] = elig.get("min_capital_investment_inr")
    normalized["employment_threshold"] = elig.get("employment_threshold")
    normalized["is_export_oriented"] = elig.get("is_export_oriented")
    
    # Normalized & sorted lists
    def _norm_sorted_list(key: str) -> List[str]:
        raw_list = elig.get(key) or []
        if isinstance(raw_list, list):
            cleaned = [normalize_text_for_comparison(x) for x in raw_list if x and str(x).strip()]
            return sorted(set(cleaned))
        return []

    normalized["eligible_entity_types"] = _norm_sorted_list("eligible_entity_types")
    normalized["eligible_taluka_categories"] = _norm_sorted_list("eligible_taluka_categories")
    normalized["target_demographics"] = _norm_sorted_list("target_demographics")
    normalized["negative_list_industries"] = _norm_sorted_list("negative_list_industries")
    normalized["specific_conditions"] = _norm_sorted_list("specific_conditions")
    
    return normalized


def normalize_incentive_detail(inc: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes a single incentive detail item."""
    if not isinstance(inc, dict):
        return {}
    
    norm = {}
    raw_type = inc.get("incentive_type") or ""
    norm["incentive_type_norm"] = normalize_text_for_comparison(raw_type)
    norm["max_amount_inr"] = inc.get("max_amount_inr")
    norm["percentage_reimbursement"] = inc.get("percentage_reimbursement")
    norm["duration_years"] = inc.get("duration_years")
    norm["is_additional_incentive"] = inc.get("is_additional_incentive")
    
    disb = inc.get("disbursement_frequency")
    norm["disbursement_frequency"] = normalize_text_for_comparison(disb) if disb else None
    
    conds = inc.get("conditions") or []
    if isinstance(conds, list):
        cleaned_conds = [normalize_text_for_comparison(c) for c in conds if c and str(c).strip()]
        norm["conditions"] = sorted(set(cleaned_conds))
    else:
        norm["conditions"] = []
        
    return norm


def normalize_incentives_list(inc_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Normalizes and deterministically sorts a list of incentive details."""
    if not isinstance(inc_list, list):
        return []
    
    normalized_items = [normalize_incentive_detail(item) for item in inc_list if isinstance(item, dict)]
    
    # Sort deterministically by incentive_type_norm, percentage, max_amount
    def _sort_key(item: Dict[str, Any]) -> Tuple:
        return (
            item.get("incentive_type_norm") or "",
            item.get("percentage_reimbursement") if item.get("percentage_reimbursement") is not None else -1.0,
            item.get("max_amount_inr") if item.get("max_amount_inr") is not None else -1.0,
            item.get("duration_years") if item.get("duration_years") is not None else -1.0,
        )

    return sorted(normalized_items, key=_sort_key)


def compute_rule_fingerprint(
    rule_name: str,
    policy_sector: str,
    eligibility_norm: Dict[str, Any],
    incentives_norm: List[Dict[str, Any]]
) -> str:
    """
    Computes a deterministic hash fingerprint representing the core legal/normative requirements.
    Rules with identical fingerprints have matching core criteria and benefits.
    """
    import hashlib
    import json
    
    norm_name = normalize_text_for_comparison(rule_name)
    norm_sec = normalize_sector(policy_sector)
    
    payload = {
        "name": norm_name,
        "sector": norm_sec,
        "eligibility": eligibility_norm,
        "incentives": incentives_norm
    }
    encoded = json.dumps(payload, sort_keys=True)
    return hashlib.sha256(encoded.encode("utf-8")).hexdigest()
