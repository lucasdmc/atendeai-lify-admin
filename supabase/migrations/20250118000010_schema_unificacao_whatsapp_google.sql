-- Migration: Unificação regras WhatsApp 1:1 e OAuth Google por clínica (multi-calendários)
-- Safe for re-run (IF NOT EXISTS / conditional guards)

-- 1) clinic_whatsapp_numbers
create table if not exists public.clinic_whatsapp_numbers (
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  whatsapp_number text not null,
  phone_number_id text,
  display_phone_number text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Garantir colunas opcionais existentes
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_whatsapp_numbers' and column_name = 'phone_number_id'
  ) then
    alter table public.clinic_whatsapp_numbers add column phone_number_id text;
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'clinic_whatsapp_numbers' and column_name = 'display_phone_number'
  ) then
    alter table public.clinic_whatsapp_numbers add column display_phone_number text;
  end if;
end $$;

-- PK opcional: usar clinic_id como unique para 1:1
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'clinic_whatsapp_numbers_clinic_id_key'
  ) then
    alter table public.clinic_whatsapp_numbers add constraint clinic_whatsapp_numbers_clinic_id_key unique (clinic_id);
  end if;
end $$;

-- Unicidade do número sem '+'
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'clinic_whatsapp_numbers_whatsapp_number_key'
  ) then
    alter table public.clinic_whatsapp_numbers add constraint clinic_whatsapp_numbers_whatsapp_number_key unique (whatsapp_number);
  end if;
end $$;

-- Unicidade do phone_number_id (quando presente)
create unique index if not exists clinic_whatsapp_numbers_phone_number_id_key
  on public.clinic_whatsapp_numbers (phone_number_id)
  where phone_number_id is not null;

create index if not exists clinic_whatsapp_numbers_is_active_idx on public.clinic_whatsapp_numbers (is_active);
create index if not exists clinic_whatsapp_numbers_display_phone_idx on public.clinic_whatsapp_numbers (display_phone_number);

-- 2) google_calendar_tokens_by_clinic (1:1 OAuth por clínica)
create table if not exists public.google_calendar_tokens_by_clinic (
  clinic_id uuid primary key references public.clinics(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  provider_user_id text,
  provider_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3) clinic_calendars (múltiplos calendários por clínica)
create table if not exists public.clinic_calendars (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  calendar_id text not null,
  calendar_summary text,
  is_primary boolean default false,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists clinic_calendars_unique on public.clinic_calendars (clinic_id, calendar_id);
create index if not exists clinic_calendars_active_idx on public.clinic_calendars (clinic_id, is_active);

-- 4) Conversas/Mensagens: índices úteis (idempotência/consultas)
-- whatsapp_conversations_improved
create index if not exists whatsapp_conversations_clinic_idx on public.whatsapp_conversations_improved (clinic_id);
create index if not exists whatsapp_conversations_last_msg_idx on public.whatsapp_conversations_improved (last_message_at);

-- whatsapp_messages_improved
create index if not exists whatsapp_messages_conv_idx on public.whatsapp_messages_improved (conversation_id);
create index if not exists whatsapp_messages_created_idx on public.whatsapp_messages_improved (created_at);

-- 5) Comentários
comment on table public.clinic_whatsapp_numbers is 'Mapeia número/phone_number_id do WhatsApp para clinic_id (1:1).';
comment on table public.google_calendar_tokens_by_clinic is 'Tokens OAuth do Google Calendar por clínica (1:1).';
comment on table public.clinic_calendars is 'Associação de múltiplos calendários do Google por clínica.';
