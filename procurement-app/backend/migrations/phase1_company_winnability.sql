-- Phase 1: Enhanced Company Profile + Winnability
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New Query)

-- ── 1. Extend companies table ─────────────────────────────────────────────────

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS legal_structure          text,
  ADD COLUMN IF NOT EXISTS incorporation_date       date,
  ADD COLUMN IF NOT EXISTS primary_sectors          text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS geographic_coverage      text     DEFAULT 'regional',
  ADD COLUMN IF NOT EXISTS regions_active           text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_public_sector      integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS past_contract_count      integer  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS past_contract_total_value numeric,
  ADD COLUMN IF NOT EXISTS certifications           text[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS has_iso_9001             boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_iso_27001            boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_cyber_essentials     boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_modern_slavery       boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_gdpr_docs            boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_public_liability     boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS turnover_latest          numeric,
  ADD COLUMN IF NOT EXISTS credit_rating            text,
  ADD COLUMN IF NOT EXISTS onboarding_completed     boolean  DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step          integer  DEFAULT 0;

-- ── 2. Company documents ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS company_documents (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id   uuid        REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid        NOT NULL,
  file_name    text        NOT NULL,
  file_path    text        NOT NULL,
  doc_type     text        DEFAULT 'general',
  file_size    integer,
  uploaded_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_company_docs_company  ON company_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_company_docs_user     ON company_documents(user_id);

ALTER TABLE company_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own company_documents" ON company_documents;
CREATE POLICY "Users own company_documents" ON company_documents
  FOR ALL USING (auth.uid() = user_id);

-- ── 3. Contract matches ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contract_matches (
  id                        uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id                uuid        REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  user_id                   uuid        NOT NULL,
  contract_id               text        NOT NULL,
  total_score               numeric     NOT NULL,
  size_fit_score            numeric,
  sector_match_score        numeric,
  experience_score          numeric,
  capability_score          numeric,
  financial_health_score    numeric,
  geographic_fit_score      numeric,
  timeline_capacity_score   numeric,
  compliance_score          numeric,
  recommendation            text,
  contract_snapshot         jsonb,
  scored_at                 timestamptz DEFAULT now()
);

-- If table already exists without this column, add it:
ALTER TABLE contract_matches ADD COLUMN IF NOT EXISTS contract_snapshot jsonb;

CREATE INDEX IF NOT EXISTS idx_contract_matches_company ON contract_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_contract_matches_score   ON contract_matches(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_contract_matches_user    ON contract_matches(user_id);

ALTER TABLE contract_matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users own contract_matches" ON contract_matches;
CREATE POLICY "Users own contract_matches" ON contract_matches
  FOR ALL USING (auth.uid() = user_id);

-- ── 4. Storage bucket (run separately if bucket doesn't exist) ────────────────
-- In Supabase dashboard → Storage → New bucket → name: "company-documents" → private
-- Or via SQL (requires pg_net extension):
-- SELECT storage.create_bucket('company-documents', 'private');
