# SMSWS Rule Normalization & Deduplication Inspection Report

_Generated from live SQLite database `db/policy_engine.db`_

## 1. Overall Summary
| Metric | Count | Description |
| :--- | :--- | :--- |
| **Total Candidate Rules (Before)** | **1314** | Raw candidate rules extracted from document chunks |
| **Canonical Rules (After)** | **1279** | Cleaned deduplicated canonical policy rules |
| **Multi-Source Canonical Clusters** | **28** | Canonical rules merging 2+ identical candidate rules |
| **Independent Standalone Rules** | **1251** | Rules with unique normative requirements |
| **Exact Duplicate Relationships** | **4** | Exact identical fingerprint matches |
| **Near Duplicate Relationships** | **31** | High-similarity matches with equivalent benefits |
| **Possible Conflicts (Preserved)** | **52** | Conflicting rates/caps preserved as distinct rules |
| **Possible Amendments** | **0** | Rules flagged with explicit amendment/supersession signals |
| **Uncertain Relationships** | **34** | Pairs flagged for human legal review |

---

## 2. Duplicate Groups (Multi-Source Provenance)
Found **28** multi-source canonical rule groups:

### Canonical Rule `CANON-0058`: Maharashtra Logistics Policy 2024 Eligibility
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [SAME_RULE_DIFFERENT_SOURCE - conf: 1.00] Identical normalized rule requirements, criteria, and incentives across different documents (6e80e66a and 004514f1).

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 58 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 82-82 | `4793fcff7e90...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 1172 | `Duplicate` | `500_doc-20250708-wa0003-english_0.pdf` | p. 6-6 | `2601bc744a9d...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0060`: Classification of Large Logistics Park
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Classification of Large Logistics Park') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 60 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 105-105 | `61bb461a7841...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 1174 | `Duplicate` | `500_doc-20250708-wa0003-english_0.pdf` | p. 29-29 | `7d8e3a3fe2eb...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0061`: Classification of Mega Logistics Park
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Classification of Mega Logistics Park') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 61 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 105-105 | `61bb461a7841...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 1175 | `Duplicate` | `500_doc-20250708-wa0003-english_0.pdf` | p. 29-29 | `7d8e3a3fe2eb...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0062`: Classification of Ultra Mega Logistics Park
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `3`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Classification of Ultra Mega Logistics Park') and identical benefit parameters with minor condition phrasing variations.; [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Ultra Mega Logistics Park') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 62 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 105-105 | `61bb461a7841...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 462 | `Duplicate` | `093_Maharashtra-Logistics-Policy-2024.pdf` | p. 33-33 | `232229381298...` | [Link](https://midc.maharashtra.gov.in/en/investors/industrial-policies-and-incentives/) |
| 1176 | `Duplicate` | `500_doc-20250708-wa0003-english_0.pdf` | p. 29-29 | `7d8e3a3fe2eb...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0063`: Classification of Multi-Storeyed Logistics Park
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Classification of Multi-Storeyed Logistics Park') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 63 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 106-106 | `c851513d68a5...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 1177 | `Duplicate` | `500_doc-20250708-wa0003-english_0.pdf` | p. 30-30 | `6d0e5e8651ad...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0067`: Integrated Truck Terminals
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Integrated Truck Terminals') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 67 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 107-107 | `be1d1b3e5e70...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 467 | `Duplicate` | `093_Maharashtra-Logistics-Policy-2024.pdf` | p. 35-35 | `364bfdbc723e...` | [Link](https://midc.maharashtra.gov.in/en/investors/industrial-policies-and-incentives/) |

### Canonical Rule `CANON-0070`: Eligibility criteria for Green Logistics Park
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [SAME_RULE_DIFFERENT_SOURCE - conf: 1.00] Identical normalized rule requirements, criteria, and incentives across different documents (6e80e66a and 458eaed3).

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 70 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 124-124 | `3420cd98006b...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 471 | `Duplicate` | `093_Maharashtra-Logistics-Policy-2024.pdf` | p. 54-54 | `124224fd750e...` | [Link](https://midc.maharashtra.gov.in/en/investors/industrial-policies-and-incentives/) |

### Canonical Rule `CANON-0075`: Special Capital Incentives for Integrated Truck Terminals
- **Policy Sector:** `Logistics`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Special Capital Incentives for Integrated Truck Terminals') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 75 | `Primary` | `025a_Maharashtra Logistics Policy 2024 - GR.pdf` | p. 125-125 | `e406ab47443a...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 1189 | `Duplicate` | `500_doc-20250708-wa0003-english_0.pdf` | p. 49-49 | `8eb692ed081a...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0095`: Mega EV Enterprise - Areas A and B
- **Policy Sector:** `Electric Vehicle`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Mega EV Enterprise - Areas A and B') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 95 | `Primary` | `047_Electric_Vehicle.pdf` | p. 5-5 | `6fdfaebc0095...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 99 | `Duplicate` | `047_Electric_Vehicle.pdf` | p. 15-15 | `38f7bbd0d03e...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |

### Canonical Rule `CANON-0096`: Mega EV Enterprise - Areas C, D and D+
- **Policy Sector:** `Electric Vehicle`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Mega EV Enterprise - Areas C, D and D+') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 96 | `Primary` | `047_Electric_Vehicle.pdf` | p. 5-5 | `6fdfaebc0095...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 100 | `Duplicate` | `047_Electric_Vehicle.pdf` | p. 15-15 | `38f7bbd0d03e...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |

### Canonical Rule `CANON-0097`: Ultra Mega EV Enterprises
- **Policy Sector:** `Electric Vehicle`
- **Merged Source Count:** `3`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [EXACT_DUPLICATE - conf: 1.00] Identical normalized rule requirements, criteria, and incentives in same document (1220390f).; [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Ultra Mega EV Enterprises') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 97 | `Primary` | `047_Electric_Vehicle.pdf` | p. 5-5 | `6fdfaebc0095...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 101 | `Duplicate` | `047_Electric_Vehicle.pdf` | p. 15-15 | `38f7bbd0d03e...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 105 | `Duplicate` | `047_Electric_Vehicle.pdf` | p. 23-23 | `21f804c97a89...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |

### Canonical Rule `CANON-0098`: Large EV Enterprises
- **Policy Sector:** `Electric Vehicle`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [EXACT_DUPLICATE - conf: 1.00] Identical normalized rule requirements, criteria, and incentives in same document (1220390f).

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 98 | `Primary` | `047_Electric_Vehicle.pdf` | p. 5-5 | `6fdfaebc0095...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 102 | `Duplicate` | `047_Electric_Vehicle.pdf` | p. 15-15 | `38f7bbd0d03e...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |

### Canonical Rule `CANON-0118`: Maharashtra Industrial Policy 2019 Validity Period
- **Policy Sector:** `General Industry`
- **Merged Source Count:** `4`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Maharashtra Industrial Policy 2019 Validity Period') and identical benefit parameters with minor condition phrasing variations.; [NEAR_DUPLICATE - conf: 0.90] Highly similar rule name ('Maharashtra Industrial Policy 2019 Validity Period') and identical benefit parameters with minor condition phrasing variations.; [NEAR_DUPLICATE - conf: 0.85] Highly similar rule name ('Maharashtra Industrial Policy 2019 Validity Period') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 123 | `Primary` | `018b_Maharashtra New Industrial Policy-2019.pdf` | p. 59-59 | `2f2f6917c2c5...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 415 | `Duplicate` | `056f_Industrial Policy - 2019.pdf` | p. 7-7 | `c47d1d2073d9...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 960 | `Duplicate` | `100_Maharashtra-Industrial-Policy-2019.pdf` | p. 4-4 | `eba1323014e5...` | [Link](https://midc.maharashtra.gov.in/en/investors/industrial-policies-and-incentives/) |
| 1268 | `Duplicate` | `507_maharashtra-new-industrial-policy-2019-english.pdf` | p. 4-4 | `7e8ec11329b7...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0129`: Export Infrastructure Support - Testing and Quality Certification Laboratories
- **Policy Sector:** `Export Promotion`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.97] Highly similar rule name ('Export Infrastructure Support - Testing and Quality Certification Laboratories') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 134 | `Primary` | `018b_Maharashtra New Industrial Policy-2019.pdf` | p. 76-76 | `e775f340d1d4...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 429 | `Duplicate` | `056f_Industrial Policy - 2019.pdf` | p. 23-23 | `add09d8afbd9...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |

### Canonical Rule `CANON-0179`: MSME Capital Subsidy
- **Policy Sector:** `AVGC-XR`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('MSME Capital Subsidy') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 184 | `Primary` | `108_AVGCXR Policy GR 03112025.pdf` | p. 55-55 | `581d583cb1dd...` | [Link](https://maitri.maharashtra.gov.in/wp-content/themes/maitri/PDF/AVGCXR%20Policy%20GR%2003112025.pdf) |
| 1291 | `Duplicate` | `506_maharashtra-animation-visual-effects-gaming-comics-and-extended-reality-2_1.pdf` | p. 55-55 | `7a43509ba9b0...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0181`: Exemption of Electricity Duty
- **Policy Sector:** `AVGC-XR`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Exemption of Electricity Duty') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 186 | `Primary` | `108_AVGCXR Policy GR 03112025.pdf` | p. 56-56 | `0f9db9aa43e9...` | [Link](https://maitri.maharashtra.gov.in/wp-content/themes/maitri/PDF/AVGCXR%20Policy%20GR%2003112025.pdf) |
| 1293 | `Duplicate` | `506_maharashtra-animation-visual-effects-gaming-comics-and-extended-reality-2_1.pdf` | p. 56-56 | `3fb7ecc0f6a2...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0183`: Recruitment Assistance
- **Policy Sector:** `AVGC-XR`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Recruitment Assistance') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 188 | `Primary` | `108_AVGCXR Policy GR 03112025.pdf` | p. 57-57 | `338974feb46b...` | [Link](https://maitri.maharashtra.gov.in/wp-content/themes/maitri/PDF/AVGCXR%20Policy%20GR%2003112025.pdf) |
| 1296 | `Duplicate` | `506_maharashtra-animation-visual-effects-gaming-comics-and-extended-reality-2_1.pdf` | p. 57-57 | `6fd8117c17b6...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0421`: Large Scale Industries Electricity Duty Exemption
- **Policy Sector:** `Large Scale Industries`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Large Scale Industries Electricity Duty Exemption') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 427 | `Primary` | `056f_Industrial Policy - 2019.pdf` | p. 17-17 | `cf11dc1d6ee5...` | [Link](https://maitri.maharashtra.gov.in/resources/policies/) |
| 1279 | `Duplicate` | `507_maharashtra-new-industrial-policy-2019-english.pdf` | p. 14-14 | `70050aba60ee...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |

### Canonical Rule `CANON-0556`: Low Risk Category Building Permission
- **Policy Sector:** `Real Estate / Construction`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.89] Highly similar rule name ('Low Risk Category Building Permission') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 566 | `Primary` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 396-396 | `9383ff06c346...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |
| 567 | `Duplicate` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 396-396 | `9383ff06c346...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |

### Canonical Rule `CANON-0640`: Additional FSI for Pharma Industry
- **Policy Sector:** `Pharmaceuticals`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Additional FSI for Pharma Industry') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 651 | `Primary` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 896-896 | `18015a3d34c1...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |
| 701 | `Duplicate` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 1695-1696 | `4c024d902a99...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |

### Canonical Rule `CANON-0653`: Regulations for Development of Information Technology Establishment
- **Policy Sector:** `Information Technology`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 1.00] Highly similar rule name ('Regulations for Development of Information Technology Establishment') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 664 | `Primary` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 1117-1117 | `1b938c6d5245...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |
| 758 | `Duplicate` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 3346-3346 | `f055d2d8e7ee...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |

### Canonical Rule `CANON-0705`: Purely Residential Zone (R1) Regulations
- **Policy Sector:** `Real Estate and Urban Development`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.88] Highly similar rule name ('Purely Residential Zone (R1) Regulations') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 717 | `Primary` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 2702-2702 | `03eade4d0f35...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |
| 718 | `Duplicate` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 2705-2705 | `3ad0fce75608...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |

### Canonical Rule `CANON-0708`: Public-Semi Public Zone Regulations
- **Policy Sector:** `Real Estate / Urban Development`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.86] Highly similar rule name ('Public-Semi Public Zone Regulations') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 721 | `Primary` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 2709-2709 | `1ec30fbd27e2...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |
| 723 | `Duplicate` | `062_Comprehensive Uniform Building Bye Law.pdf` | p. 2711-2711 | `7acf579eaf04...` | [Link](https://maitri.maharashtra.gov.in/resources/acts-and-rules/) |

### Canonical Rule `CANON-0863`: Bank Guarantee for Health Care Establishments - Consent to Establish
- **Policy Sector:** `Healthcare / Pollution Control`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.91] Highly similar rule name ('Bank Guarantee for Health Care Establishments - Consent to Establish') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 878 | `Primary` | `173_Circular_20250624_18103224_rotated.pdf` | p. 1-1 | `f9b4bc1c7907...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |
| 879 | `Duplicate` | `173_Circular_20250624_18103224_rotated.pdf` | p. 2-2 | `e3d96aaeedda...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |

### Canonical Rule `CANON-0864`: EPR Registration Fee for Producers (> 1,00,000 MT)
- **Policy Sector:** `Used Oil Management`
- **Merged Source Count:** `5`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.92] Highly similar rule name ('EPR Registration Fee for Producers (> 1,00,000 MT)') and identical benefit parameters with minor condition phrasing variations.; [NEAR_DUPLICATE - conf: 0.94] Highly similar rule name ('EPR Registration Fee for Producers (> 1,00,000 MT)') and identical benefit parameters with minor condition phrasing variations.; [NEAR_DUPLICATE - conf: 0.90] Highly similar rule name ('EPR Registration Fee for Producers (> 1,00,000 MT)') and identical benefit parameters with minor condition phrasing variations.; [NEAR_DUPLICATE - conf: 0.92] Highly similar rule name ('EPR Registration Fee for Producers (> 1,00,000 MT)') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 880 | `Primary` | `332_Used_Oil_SoP_Producer_Registration_2024.pdf` | p. 15-17 | `a616af2cb306...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |
| 881 | `Duplicate` | `332_Used_Oil_SoP_Producer_Registration_2024.pdf` | p. 15-17 | `a616af2cb306...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |
| 882 | `Duplicate` | `332_Used_Oil_SoP_Producer_Registration_2024.pdf` | p. 15-17 | `a616af2cb306...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |
| 883 | `Duplicate` | `332_Used_Oil_SoP_Producer_Registration_2024.pdf` | p. 15-17 | `a616af2cb306...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |
| 884 | `Duplicate` | `332_Used_Oil_SoP_Producer_Registration_2024.pdf` | p. 15-17 | `a616af2cb306...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |

### Canonical Rule `CANON-0979`: Fly Ash Utilization Targets for Existing Thermal Power Stations
- **Policy Sector:** `Environment / Energy`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.93] Highly similar rule name ('Fly Ash Utilization Targets for Existing Thermal Power Stations') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1000 | `Primary` | `245_Flyash.pdf` | p. 3-3 | `111531028309...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |
| 1001 | `Duplicate` | `245_Flyash.pdf` | p. 4-4 | `e711b718c593...` | [Link](https://www.mpcb.gov.in/en/circulars-types/all) |

### Canonical Rule `CANON-1096`: Time-limit for review of lay-off order
- **Policy Sector:** `Labour`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.87] Highly similar rule name ('Time-limit for review of lay-off order') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1118 | `Primary` | `464_code-on-ir-draft-rules-2026_0.pdf` | p. 150-151 | `2efb4c40d775...` | [Link](https://labour.maharashtra.gov.in/en/publication/new-labour-code) |
| 1121 | `Duplicate` | `464_code-on-ir-draft-rules-2026_0.pdf` | p. 152-153 | `24ef8af99129...` | [Link](https://labour.maharashtra.gov.in/en/publication/new-labour-code) |

### Canonical Rule `CANON-1268`: Financial Assistance to Innovation Labs (Animation Films)
- **Policy Sector:** `AVGC-XR`
- **Merged Source Count:** `2`
- **Deduplication Confidence:** `0.95`
- **Deduplication Justification:** [NEAR_DUPLICATE - conf: 0.94] Highly similar rule name ('Financial Assistance to Innovation Labs (Animation Films)') and identical benefit parameters with minor condition phrasing variations.

**Underlying Sources Preserved:**

| Rule ID | Role | Source Document | Page(s) | Chunk ID | Official URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1302 | `Primary` | `506_maharashtra-animation-visual-effects-gaming-comics-and-extended-reality-2_1.pdf` | p. 59-59 | `050bd2fcae76...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |
| 1303 | `Duplicate` | `506_maharashtra-animation-visual-effects-gaming-comics-and-extended-reality-2_1.pdf` | p. 59-59 | `050bd2fcae76...` | [Link](https://industry.maharashtra.gov.in/index.php/en/services/policies) |


---

## 3. Ambiguous & Conflict Groups Requiring Human Verification
Found **86** pairs flagged with potential conflicts, amendments, or uncertainties.

> [!IMPORTANT]
> Conflicting rules were **NOT** merged or overwritten. Both candidate rules were preserved as independent rules to maintain legal fidelity.

| Rel ID | Type | Rule A (ID / Name / Doc) | Rule B (ID / Name / Doc) | Classification Reason | Verification Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 686 | `POSSIBLE_CONFLICT` | **#4** Stamp Duty Exemption for IT, ITeS, AVGC, Data Centre & Emerging Technology Units (`505_it-policy-2023.pdf`) | **#773** Stamp Duty Exemption for IT/ITES Units (`050_Information Technology Policy (IT_ITES_Policy_2015_final_English).pdf`) | Conflicting reimbursement percentages for incentive 'stamp duty exemption': 50.0% vs 100.0%. | Verify which rate applies to current financial year |
| 691 | `POSSIBLE_CONFLICT` | **#8** Market Development Assistance for IT MSMEs and Startups (`505_it-policy-2023.pdf`) | **#20** M-Hub Market Development Assistance (`505_it-policy-2023.pdf`) | Conflicting maximum amounts for incentive 'market development assistance': INR 300,000 vs INR 2,500,000. | Verify which rate applies to current financial year |
| 704 | `POSSIBLE_CONFLICT` | **#769** Additional FSI for IT and AVGC Parks (Upto 100%) (`050_Information Technology Policy (IT_ITES_Policy_2015_final_English).pdf`) | **#770** Additional FSI for IT and AVGC Parks (Above 100% and upto 200%) (`050_Information Technology Policy (IT_ITES_Policy_2015_final_English).pdf`) | Conflicting reimbursement percentages for incentive 'additional fsi': 100.0% vs 200.0%. | Verify which rate applies to current financial year |
| 917 | `POSSIBLE_CONFLICT` | **#75** Special Capital Incentives for Integrated Truck Terminals (`025a_Maharashtra Logistics Policy 2024 - GR.pdf`) | **#472** Special Capital Incentives for Logistics Parks (`093_Maharashtra-Logistics-Policy-2024.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 10,000,000 vs INR 400,000,000. | Verify which rate applies to current financial year |
| 923 | `POSSIBLE_CONFLICT` | **#77** Interest Subsidy for Standalone Logistics Units inside Parks (`025a_Maharashtra Logistics Policy 2024 - GR.pdf`) | **#78** Interest Subsidy for Standalone Logistics Units outside Parks (`025a_Maharashtra Logistics Policy 2024 - GR.pdf`) | Conflicting reimbursement percentages for incentive 'interest subsidy': 3.0% vs 2.0%. | Verify which rate applies to current financial year |
| 924 | `POSSIBLE_CONFLICT` | **#77** Interest Subsidy for Standalone Logistics Units inside Parks (`025a_Maharashtra Logistics Policy 2024 - GR.pdf`) | **#473** Interest Subsidy and Stamp Duty Exemption for Standalone Logistics Units (`093_Maharashtra-Logistics-Policy-2024.pdf`) | Conflicting reimbursement percentages for incentive 'interest subsidy': 3.0% vs 2.0%. | Verify which rate applies to current financial year |
| 1026 | `POSSIBLE_CONFLICT` | **#472** Special Capital Incentives for Logistics Parks (`093_Maharashtra-Logistics-Policy-2024.pdf`) | **#1189** Special Capital Incentives for Integrated Truck Terminals (`500_doc-20250708-wa0003-english_0.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 400,000,000 vs INR 10,000,000. | Verify which rate applies to current financial year |
| 1162 | `POSSIBLE_CONFLICT` | **#271** Solar Power Plant Capital Subsidy for Existing Textile Units (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#921** IPDS Scheme Capital Subsidy for Processing Projects (`103_Textile-Policy-2018-2023.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 48,000,000 vs INR 375,000,000. | Verify which rate applies to current financial year |
| 1166 | `POSSIBLE_CONFLICT` | **#274** Solar Power Plant Guidelines and Electricity Subsidy Capping for Textile Units (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#276** Cooperative Powerlooms Electricity Subsidy and Maha-TUFS CIS Rates (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 48,000,000 vs INR 96,000,000. | Verify which rate applies to current financial year |
| 1167 | `POSSIBLE_CONFLICT` | **#275** Maha Technology Upgradation Fund Scheme (Maha-TUFS) for Spinning Units & Cooperative Powerlooms Share Capital (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#279** Maha Technology Upgradation Fund Scheme (MAHA-TUFS) (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | Conflicting reimbursement percentages for incentive 'capital investment subsidy (cis)': 40.0% vs 25.0%. | Verify which rate applies to current financial year |
| 1169 | `POSSIBLE_CONFLICT` | **#276** Cooperative Powerlooms Electricity Subsidy and Maha-TUFS CIS Rates (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#278** Private Powerlooms Solar Power Plant and Electricity Subsidy Guidelines (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 96,000,000 vs INR 48,000,000. | Verify which rate applies to current financial year |
| 1174 | `POSSIBLE_CONFLICT` | **#282** Processing Sector Capital and Electricity Subsidy (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#289** Non-Conventional Yarn/Fiber and Synthetic Yarn/Fiber Capital and Electricity Subsidy (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 30.0% vs 25.0%. | Verify which rate applies to current financial year |
| 1175 | `POSSIBLE_CONFLICT` | **#284** Support for Effluent Treatment Plants (ETP) and Common Effluent Treatment Plant (CETP) (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#293** Support for Setting up common Steam Generation Plant (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 50,000,000 vs INR 10,000,000. | Verify which rate applies to current financial year |
| 1176 | `POSSIBLE_CONFLICT` | **#285** Support for Zero Liquid Discharge (ZLD) (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#291** Support for Effluent Treatment Plants (ETP) and Zero Liquid Discharge (ZLD) (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 100,000,000 vs INR 50,000,000. | Verify which rate applies to current financial year |
| 1177 | `POSSIBLE_CONFLICT` | **#297** Technical Textile Parks Eligibility and Incentives (`097_Integrated-and-Sustainable-Textile-Policy-2023.pdf`) | **#484** Scheme for Integrated Textile Parks (SITP) Financial Assistance (`040_New_Maharashtra_Textile_Policy-2011-17.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 55.0% vs 9.0%. | Verify which rate applies to current financial year |
| 1180 | `POSSIBLE_CONFLICT` | **#480** 10% Capital Subsidy for New Textile Units in Vidarbha, Marathwada and North Maharashtra (`040_New_Maharashtra_Textile_Policy-2011-17.pdf`) | **#495** General Capital Subsidy Scheme for Textile Units (`056m_Textile Policy - 2018.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 10.0% vs 5.0%. | Verify which rate applies to current financial year |
| 1181 | `POSSIBLE_CONFLICT` | **#482** 10% Capital Subsidy for Textile Units (`040_New_Maharashtra_Textile_Policy-2011-17.pdf`) | **#495** General Capital Subsidy Scheme for Textile Units (`056m_Textile Policy - 2018.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 10.0% vs 5.0%. | Verify which rate applies to current financial year |
| 1182 | `POSSIBLE_CONFLICT` | **#482** 10% Capital Subsidy for Textile Units (`040_New_Maharashtra_Textile_Policy-2011-17.pdf`) | **#920** Capital Subsidy in lieu of Interest Subsidy (`103_Textile-Policy-2018-2023.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 10.0% vs 40.0%. | Verify which rate applies to current financial year |
| 1183 | `POSSIBLE_CONFLICT` | **#482** 10% Capital Subsidy for Textile Units (`040_New_Maharashtra_Textile_Policy-2011-17.pdf`) | **#921** IPDS Scheme Capital Subsidy for Processing Projects (`103_Textile-Policy-2018-2023.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 10.0% vs 25.0%. | Verify which rate applies to current financial year |
| 1184 | `POSSIBLE_CONFLICT` | **#487** Capital Subsidy Scheme under State Textile Policy for Cotton Growing Talukas (`040_New_Maharashtra_Textile_Policy-2011-17.pdf`) | **#495** General Capital Subsidy Scheme for Textile Units (`056m_Textile Policy - 2018.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 10.0% vs 5.0%. | Verify which rate applies to current financial year |
| 1188 | `POSSIBLE_CONFLICT` | **#495** General Capital Subsidy Scheme for Textile Units (`056m_Textile Policy - 2018.pdf`) | **#920** Capital Subsidy in lieu of Interest Subsidy (`103_Textile-Policy-2018-2023.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 5.0% vs 40.0%. | Verify which rate applies to current financial year |
| 1189 | `POSSIBLE_CONFLICT` | **#495** General Capital Subsidy Scheme for Textile Units (`056m_Textile Policy - 2018.pdf`) | **#921** IPDS Scheme Capital Subsidy for Processing Projects (`103_Textile-Policy-2018-2023.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 5.0% vs 25.0%. | Verify which rate applies to current financial year |
| 1190 | `POSSIBLE_CONFLICT` | **#805** Maharashtra Integrated & Sustainable Textile Policy 2023 - Technical Textile Parks (`495_202512311332497910.pdf`) | **#806** Maharashtra Integrated & Sustainable Textile Policy 2023 - Maha-TUFS Scheme (`495_202512311332497910.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 55.0% vs 40.0%. | Verify which rate applies to current financial year |
| 1191 | `POSSIBLE_CONFLICT` | **#805** Maharashtra Integrated & Sustainable Textile Policy 2023 - Technical Textile Parks (`495_202512311332497910.pdf`) | **#807** Maharashtra Integrated & Sustainable Textile Policy 2023 - Mini Textile Complexes (`495_202512311332497910.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 55.0% vs 40.0%. | Verify which rate applies to current financial year |
| 1192 | `POSSIBLE_CONFLICT` | **#805** Maharashtra Integrated & Sustainable Textile Policy 2023 - Technical Textile Parks (`495_202512311332497910.pdf`) | **#808** Maharashtra Integrated & Sustainable Textile Policy 2023 - Solar and ETP Subsidies (`495_202512311332497910.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 55.0% vs 20.0%. | Verify which rate applies to current financial year |
| 1193 | `POSSIBLE_CONFLICT` | **#806** Maharashtra Integrated & Sustainable Textile Policy 2023 - Maha-TUFS Scheme (`495_202512311332497910.pdf`) | **#807** Maharashtra Integrated & Sustainable Textile Policy 2023 - Mini Textile Complexes (`495_202512311332497910.pdf`) | Conflicting maximum amounts for incentive 'capital subsidy': INR 250,000,000 vs INR 300,000,000. | Verify which rate applies to current financial year |
| 1194 | `POSSIBLE_CONFLICT` | **#806** Maharashtra Integrated & Sustainable Textile Policy 2023 - Maha-TUFS Scheme (`495_202512311332497910.pdf`) | **#808** Maharashtra Integrated & Sustainable Textile Policy 2023 - Solar and ETP Subsidies (`495_202512311332497910.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 40.0% vs 20.0%. | Verify which rate applies to current financial year |
| 1195 | `POSSIBLE_CONFLICT` | **#807** Maharashtra Integrated & Sustainable Textile Policy 2023 - Mini Textile Complexes (`495_202512311332497910.pdf`) | **#808** Maharashtra Integrated & Sustainable Textile Policy 2023 - Solar and ETP Subsidies (`495_202512311332497910.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 40.0% vs 20.0%. | Verify which rate applies to current financial year |
| 1266 | `POSSIBLE_CONFLICT` | **#1234** Maharashtra Bamboo Industry Policy 2025 - Capital Subsidy (`498_bamboo-policy-2025_0.pdf`) | **#1240** Maharashtra Bamboo Industry Policy 2025 - Subsidy for Tissue Culture Labs and R&D Units (`498_bamboo-policy-2025_0.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 20.0% vs 50.0%. | Verify which rate applies to current financial year |
| 1280 | `POSSIBLE_CONFLICT` | **#1239** Maharashtra Bamboo Industry Policy 2025 - Technology Adoption Support (`498_bamboo-policy-2025_0.pdf`) | **#1240** Maharashtra Bamboo Industry Policy 2025 - Subsidy for Tissue Culture Labs and R&D Units (`498_bamboo-policy-2025_0.pdf`) | Conflicting reimbursement percentages for incentive 'capital subsidy': 25.0% vs 50.0%. | Verify which rate applies to current financial year |
| 1294 | `POSSIBLE_CONFLICT` | **#513** Higher FSI for Educational Buildings (`062_Comprehensive Uniform Building Bye Law.pdf`) | **#514** Higher FSI for Other Educational Buildings and Hostels (`062_Comprehensive Uniform Building Bye Law.pdf`) | Conflicting reimbursement percentages for incentive 'premium fsi': 5.0% vs 10.0%. | Verify which rate applies to current financial year |
| 1301 | `POSSIBLE_CONFLICT` | **#850** Export Promotion Policy Package of Incentives for MSMEs Outside EOIP (`096_Maharashtra-State-Export-Promotion-Policy-2023.pdf`) | **#852** Export Promotion Policy Package of Incentives for MSMEs within EOIP (`096_Maharashtra-State-Export-Promotion-Policy-2023.pdf`) | Conflicting reimbursement percentages for incentive 'special export incentive': 1.0% vs 2.0%. | Verify which rate applies to current financial year |
| 1302 | `POSSIBLE_CONFLICT` | **#857** Special Export Promotion Package for Special Large-Scale Industries (LSI) Outside EOIP (`096_Maharashtra-State-Export-Promotion-Policy-2023.pdf`) | **#858** Special Export Promotion Package for Special Large-Scale Industries (LSI) Within EOIP (`096_Maharashtra-State-Export-Promotion-Policy-2023.pdf`) | Conflicting maximum amounts for incentive 'special capital incentive (technology upgradation)': INR 10,000,000 vs INR 15,000,000. | Verify which rate applies to current financial year |
| 1321 | `POSSIBLE_CONFLICT` | **#1192** Educational Assistance for Children 1st to 10th Standard (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1193** Educational Assistance for 10th, 12th, Higher Secondary and Graduation (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'educational assistance': INR 5,000 vs INR 10,000. | Verify which rate applies to current financial year |
| 1322 | `POSSIBLE_CONFLICT` | **#1192** Educational Assistance for Children 1st to 10th Standard (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1194** Educational Assistance for Medical, Engineering, Diploma, Post-Graduation and MS-CIT (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'educational assistance': INR 5,000 vs INR 20,000. | Verify which rate applies to current financial year |
| 1323 | `POSSIBLE_CONFLICT` | **#1193** Educational Assistance for 10th, 12th, Higher Secondary and Graduation (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1194** Educational Assistance for Medical, Engineering, Diploma, Post-Graduation and MS-CIT (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'educational assistance': INR 10,000 vs INR 20,000. | Verify which rate applies to current financial year |
| 1324 | `POSSIBLE_CONFLICT` | **#1195** Financial Assistance for Natural and Cesarean Delivery (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1198** Financial Assistance for 75% Disability (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 20,000 vs INR 200,000. | Verify which rate applies to current financial year |
| 1325 | `POSSIBLE_CONFLICT` | **#1195** Financial Assistance for Natural and Cesarean Delivery (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1199** Financial Assistance on Death During Employment (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 20,000 vs INR 500,000. | Verify which rate applies to current financial year |
| 1326 | `POSSIBLE_CONFLICT` | **#1195** Financial Assistance for Natural and Cesarean Delivery (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1200** Financial Assistance on Natural Death (Age 51 to 60) (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 20,000 vs INR 200,000. | Verify which rate applies to current financial year |
| 1327 | `POSSIBLE_CONFLICT` | **#1195** Financial Assistance for Natural and Cesarean Delivery (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1203** Financial Assistance to Widow or Widower (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 20,000 vs INR 24,000. | Verify which rate applies to current financial year |
| 1328 | `POSSIBLE_CONFLICT` | **#1195** Financial Assistance for Natural and Cesarean Delivery (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1208** Financial Assistance for Daughter's Marriage (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 20,000 vs INR 51,000. | Verify which rate applies to current financial year |
| 1329 | `POSSIBLE_CONFLICT` | **#1198** Financial Assistance for 75% Disability (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1199** Financial Assistance on Death During Employment (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 200,000 vs INR 500,000. | Verify which rate applies to current financial year |
| 1330 | `POSSIBLE_CONFLICT` | **#1198** Financial Assistance for 75% Disability (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1203** Financial Assistance to Widow or Widower (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 200,000 vs INR 24,000. | Verify which rate applies to current financial year |
| 1331 | `POSSIBLE_CONFLICT` | **#1198** Financial Assistance for 75% Disability (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1208** Financial Assistance for Daughter's Marriage (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 200,000 vs INR 51,000. | Verify which rate applies to current financial year |
| 1332 | `POSSIBLE_CONFLICT` | **#1199** Financial Assistance on Death During Employment (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1200** Financial Assistance on Natural Death (Age 51 to 60) (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 500,000 vs INR 200,000. | Verify which rate applies to current financial year |
| 1333 | `POSSIBLE_CONFLICT` | **#1199** Financial Assistance on Death During Employment (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1203** Financial Assistance to Widow or Widower (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 500,000 vs INR 24,000. | Verify which rate applies to current financial year |
| 1334 | `POSSIBLE_CONFLICT` | **#1199** Financial Assistance on Death During Employment (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1208** Financial Assistance for Daughter's Marriage (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 500,000 vs INR 51,000. | Verify which rate applies to current financial year |
| 1335 | `POSSIBLE_CONFLICT` | **#1200** Financial Assistance on Natural Death (Age 51 to 60) (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1203** Financial Assistance to Widow or Widower (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 200,000 vs INR 24,000. | Verify which rate applies to current financial year |
| 1336 | `POSSIBLE_CONFLICT` | **#1200** Financial Assistance on Natural Death (Age 51 to 60) (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1208** Financial Assistance for Daughter's Marriage (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 200,000 vs INR 51,000. | Verify which rate applies to current financial year |
| 1337 | `POSSIBLE_CONFLICT` | **#1203** Financial Assistance to Widow or Widower (`483_rts-services-gazette-4th-september-2025_0.pdf`) | **#1208** Financial Assistance for Daughter's Marriage (`483_rts-services-gazette-4th-september-2025_0.pdf`) | Conflicting maximum amounts for incentive 'financial assistance': INR 24,000 vs INR 51,000. | Verify which rate applies to current financial year |

_... and 36 additional relationships recorded in `rule_relationships` table._
