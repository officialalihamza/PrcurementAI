export interface Contract {
  id: string
  ocid: string
  title: string
  buyer: string
  supplier?: string
  value: number
  region: string
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
  documents?: number
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
