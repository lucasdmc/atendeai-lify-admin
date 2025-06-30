-- Criação da tabela
table if not exists public.google_calendar_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  scope text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índice para busca rápida por usuário
create index if not exists idx_google_calendar_tokens_user_id on public.google_calendar_tokens(user_id);

-- Habilita Row Level Security
alter table public.google_calendar_tokens enable row level security;

-- Permite que o usuário veja apenas seus próprios tokens
create policy "Users can view their own google calendar tokens"
  on public.google_calendar_tokens
  for select
  using (auth.uid() = user_id);

-- Permite que o usuário insira/atualize apenas seus próprios tokens
create policy "Users can upsert their own google calendar tokens"
  on public.google_calendar_tokens
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own google calendar tokens"
  on public.google_calendar_tokens
  for update
  using (auth.uid() = user_id);

-- Permite que o usuário delete apenas seus próprios tokens
create policy "Users can delete their own google calendar tokens"
  on public.google_calendar_tokens
  for delete
  using (auth.uid() = user_id);

-- Trigger para atualizar o updated_at automaticamente
create or replace function public.set_updated_at_google_calendar_tokens()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at_google_calendar_tokens on public.google_calendar_tokens;

create trigger set_updated_at_google_calendar_tokens
before update on public.google_calendar_tokens
for each row
execute procedure public.set_updated_at_google_calendar_tokens(); 