-- Clinic WhatsApp numbers mapping
create table if not exists public.clinic_whatsapp_numbers (
  id uuid default gen_random_uuid() primary key,
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  phone_number_id text not null unique,
  display_phone_number text,
  created_at timestamptz default now()
);
create index if not exists idx_cwn_clinic_id on public.clinic_whatsapp_numbers(clinic_id);

-- Conversation flows (durable state)
create table if not exists public.conversation_flows (
  id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
-- Basic RLS off for server-side usage; enable if needed with service role
alter table public.conversation_flows disable row level security;

-- Google Calendar tokens by clinic
create table if not exists public.google_calendar_tokens_by_clinic (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  tokens jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists idx_gctbc_updated_at on public.google_calendar_tokens_by_clinic(updated_at);

-- Trigger to update updated_at on upsert/update
create or replace function public.set_updated_at_generic()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to conversation_flows
drop trigger if exists trg_conversation_flows_updated on public.conversation_flows;
create trigger trg_conversation_flows_updated
before update on public.conversation_flows
for each row execute procedure public.set_updated_at_generic();

-- Apply trigger to google_calendar_tokens_by_clinic
drop trigger if exists trg_gctbc_updated on public.google_calendar_tokens_by_clinic;
create trigger trg_gctbc_updated
before update on public.google_calendar_tokens_by_clinic
for each row execute procedure public.set_updated_at_generic();
