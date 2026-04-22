-- ProcurementAI Database Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ─── companies ────────────────────────────────────────────────────────────────
create table if not exists public.companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  company_number text,
  sic_codes   text[] default '{}',
  postcode    text,
  region      text,
  employees   integer,
  turnover    numeric,
  created_at  timestamptz default now()
);

alter table public.companies enable row level security;

create policy "Users can manage their own company"
  on public.companies
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── alerts ───────────────────────────────────────────────────────────────────
create table if not exists public.alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  filters     jsonb not null default '{}',
  frequency   text not null check (frequency in ('instant', 'daily', 'weekly')),
  active      boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.alerts enable row level security;

create policy "Users can manage their own alerts"
  on public.alerts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── alert_history ────────────────────────────────────────────────────────────
create table if not exists public.alert_history (
  id          uuid primary key default gen_random_uuid(),
  alert_id    uuid not null references public.alerts(id) on delete cascade,
  contracts   jsonb not null default '[]',
  sent_at     timestamptz default now()
);

alter table public.alert_history enable row level security;

create policy "Users can read history of their own alerts"
  on public.alert_history
  for select
  using (
    exists (
      select 1 from public.alerts
      where alerts.id = alert_history.alert_id
        and alerts.user_id = auth.uid()
    )
  );
