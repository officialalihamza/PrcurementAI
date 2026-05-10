export interface ContractDocument {
  url: string
  type?: string
  label?: string
  title?: string
}

export interface Contract {
  id: string
  ocid: string
  title: string
  buyer: string
  supplier?: string
  value: number
  region: string
  url?: string
  // snake_case matches actual API response
  cpv_code?: string
  cpvCode?: string       // alias kept for compat
  sector?: string
  sme_flag: boolean | null
  smeFlag?: boolean | null  // alias kept for compat
  deadline?: string
  published?: string
  status?: string
  source?: string
  documents?: ContractDocument[]
  description?: string
  authority_type?: string
}

export interface SavedContract extends Contract {
  savedId: string
  notes?: string
  savedAt: string
}

export interface Barrier {
  bundlingScore: number
  complexityScore: number
  requirementStringency: number
  timelinePressure: number
  incumbentReferenceFlag: boolean
  frameworkAgreementFlag: boolean
  valueBand: string
  compositeScore: number
}

export interface BarrierCorrelation {
  key: string
  barrier: string
  correlation?: number
  cramers_v?: number
  p_value: string
  significant: boolean
  interpretation: string
}

export interface SectorProfile {
  sector: string
  sme_rate: number
  bundling: number
  stringency: number
  complexity: number
  timeline: number
  framework: number
  composite: number
  contracts?: number
}

export interface AuthorityProfile {
  authority_type: string
  sme_rate: number
  bundling: number
  stringency: number
  complexity: number
  timeline: number
  framework: number
  composite: number
  avg_value: number
  contracts: number
  insight: string
}

export interface WinnabilityResult {
  probability: number
  probability_pct: number
  risk_level: 'Low' | 'Medium' | 'High'
  sector: string
  sector_baseline: number
  ci_low: number
  ci_high: number
  recommendation: string
  factors: { factor: string; adjustment: number; direction: 'positive' | 'negative' }[]
}

export interface LanguageResult {
  overall_score: number
  risk_level: 'Low' | 'Medium' | 'High'
  barrier_count: number
  total_words: number
  barriers_detected: {
    type: string
    label: string
    severity: 'high' | 'medium' | 'low'
    count: number
    matches: string[]
    suggestion: string
  }[]
  positive_indicators: string[]
  readability: { level: string; avg_sentence_length: number; flesch_score: number }
  highlighted_html: string
}

export interface DashboardStats {
  total_contracts: number
  sme_rate: number
  avg_value: number
  growth_rate?: number
  by_region?: { region: string; sme_rate: number; count: number }[]
  by_month?: { month: string; sme_rate: number; total: number }[]
  by_value_band?: { band: string; count: number; sme_count: number }[]
  top_sectors?: { sector: string; count: number; sme_rate: number }[]
}

export interface Company {
  id: string
  user_id: string
  name: string
  company_number?: string
  sic_codes?: string[]
  postcode?: string
  region?: string
  employees?: number
  turnover?: number
  legal_structure?: string
  incorporation_date?: string
  primary_sectors?: string[]
  geographic_coverage?: string
  regions_active?: string[]
  years_public_sector?: number
  past_contract_count?: number
  past_contract_total_value?: number
  certifications?: string[]
  has_iso_9001?: boolean
  has_iso_27001?: boolean
  has_cyber_essentials?: boolean
  has_modern_slavery?: boolean
  has_gdpr_docs?: boolean
  has_public_liability?: boolean
  turnover_latest?: number
  credit_rating?: string
  onboarding_completed?: boolean
  onboarding_step?: number
  created_at?: string
}

export interface ContractSnapshot {
  title?: string
  buyer?: string
  sector?: string
  region?: string
  value_low?: number
  value_high?: number
  cpv_code?: string
  status?: string
  url?: string
  source?: string
}

export interface ContractMatch {
  id: string
  company_id: string
  contract_id: string
  total_score: number
  size_fit_score: number
  sector_match_score: number
  experience_score: number
  capability_score: number
  financial_health_score: number
  geographic_fit_score: number
  timeline_capacity_score: number
  compliance_score: number
  recommendation: string
  scored_at: string
  contract_snapshot?: ContractSnapshot
  contract?: Contract
}

export interface CompanyDocument {
  id: string
  company_id: string
  file_name: string
  file_path: string
  doc_type: string
  file_size?: number
  uploaded_at: string
  signed_url?: string
}

export interface User {
  id: string
  email: string
  company?: string
}

export interface Alert {
  id: string
  name: string
  keywords: string[]
  regions: string[]
  min_value?: number
  max_value?: number
  active: boolean
  created_at: string
}

export interface HypothesisTest {
  test: string
  hypothesis: string
  statistic_label: string
  statistic: number
  p_value: number
  p_label: string
  effect_size_label: string
  effect_size: number
  significant: boolean
  interpretation: string
  category: string
}
