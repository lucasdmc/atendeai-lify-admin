-- Criação da tabela user_calendars
create table if not exists public.user_calendars (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  google_calendar_id text not null,
  calendar_name text not null,
  calendar_color text default '#4285f4',
  is_primary boolean default false,
  is_active boolean default true,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, google_calendar_id)
);

-- Índices para performance
create index if not exists idx_user_calendars_user_id on public.user_calendars(user_id);
create index if not exists idx_user_calendars_google_id on public.user_calendars(google_calendar_id);
create index if not exists idx_user_calendars_primary on public.user_calendars(user_id, is_primary) where is_primary = true;

-- Habilita Row Level Security
alter table public.user_calendars enable row level security;

-- Políticas de segurança
drop policy if exists "Users can view their own calendars" on public.user_calendars;
create policy "Users can view their own calendars"
  on public.user_calendars
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own calendars" on public.user_calendars;
create policy "Users can insert their own calendars"
  on public.user_calendars
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own calendars" on public.user_calendars;
create policy "Users can update their own calendars"
  on public.user_calendars
  for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own calendars" on public.user_calendars;
create policy "Users can delete their own calendars"
  on public.user_calendars
  for delete
  using (auth.uid() = user_id);

-- Trigger para atualizar o updated_at automaticamente
create or replace function public.update_user_calendars_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_user_calendars_timestamp_trigger on public.user_calendars;

create trigger update_user_calendars_timestamp_trigger
before update on public.user_calendars
for each row
execute function public.update_user_calendars_timestamp();
