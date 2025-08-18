# Desenho Técnico — Persistência de Dados (Supabase)

Fonte: `framework/runtime/specification.md` (decisões confirmadas) e `docs/ATENDE-AI-Definicao-Tecnica.md`.

## Objetivos
- Garantir relação 1:1 entre número de WhatsApp e clínica.
- Tornar explícita a conexão única Google OAuth por clínica e permitir múltiplos calendários associados.
- Assegurar integridade referencial e índices para fluxos críticos (WhatsApp, Conversas/Mensagens, Calendário).

## Tabelas e Restrições

### 1) clinic_whatsapp_numbers (1:1 número ↔ clínica)
- Finalidade: resolver `clinic_id` de forma determinística a partir do número (ou `phone_number_id`) recebido no webhook.
- Colunas principais:
  - `clinic_id uuid not null` → FK `clinics(id)` ON DELETE CASCADE
  - `whatsapp_number text not null` (sem "+")
  - `phone_number_id text` (Meta Phone Number ID) — opcional
  - `display_phone_number text` (com "+") — opcional
  - `is_active boolean default true`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
- Restrições/Índices:
  - UNIQUE(`clinic_id`) — garante que cada clínica tenha no máx. 1 número (1:1)
  - UNIQUE(`whatsapp_number`) — impede o mesmo número em clínicas diferentes
  - UNIQUE(`phone_number_id`) WHERE `phone_number_id IS NOT NULL` — evita duplicidade de mapeamento por Meta ID
  - INDEX em (`is_active`), (`display_phone_number`)

### 2) google_calendar_tokens_by_clinic (OAuth por clínica)
- Finalidade: armazenar tokens OAuth do Google por clínica (uma conexão ativa por clínica).
- Colunas principais:
  - `clinic_id uuid primary key` → PK e FK `clinics(id)` ON DELETE CASCADE (garante 1:1)
  - `access_token text not null`, `refresh_token text`, `expires_at timestamptz not null`, `scope text`
  - `provider_user_id text`, `provider_email text`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`

### 3) clinic_calendars (múltiplos calendários por clínica)
- Finalidade: relacionar uma clínica a um ou mais calendários da conta autenticada.
- Colunas principais:
  - `id uuid primary key default gen_random_uuid()`
  - `clinic_id uuid not null` → FK `clinics(id)` ON DELETE CASCADE
  - `calendar_id text not null` (ID do Google Calendar)
  - `calendar_summary text`, `is_primary boolean default false`, `is_active boolean default true`
  - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
- Restrições/Índices:
  - UNIQUE(`clinic_id`, `calendar_id`)
  - INDEX em (`clinic_id`, `is_active`)

### 4) WhatsApp — conversas e mensagens
- Garantir FKs e índices para consultas por `clinic_id`, `conversation_id`, `created_at`.
- Se as constraints já existirem, a migration ignora (checagem condicional).

## Estratégia de Migração
1. Criar as três tabelas acima se não existirem.
2. Adicionar índices e constraints de unicidade.
3. Validar dados existentes:
   - Remover duplicatas em `clinic_whatsapp_numbers` (guardar backup antes).
   - Caso haja mais de um número por clínica, manter apenas o ativo (regra 1:1) — decisão operacional assistida.
4. Planejar transição de `google_calendar_tokens` (por usuário) para `google_calendar_tokens_by_clinic` (por clínica):
   - UI passará a vincular OAuth a uma clínica explicitamente.
   - Tokens existentes não serão migrados automaticamente por falta de vínculo inequívoco; exigir reconexão por clínica.

## Considerações de Segurança e LGPD
- Tokens armazenados apenas no backend (via Supabase) e nunca expostos diretamente ao cliente.
- Logs devem mascarar `access_token`/`refresh_token`.
- Revogar tokens ao desvincular clínica.

## Rollback
- Remover tabelas criadas (se necessário) e reverter índices/constraints.
- Manter backup das linhas afetadas ao normalizar duplicatas em `clinic_whatsapp_numbers`.

## Observabilidade
- Métricas: contagem de mapeamentos ativos, clínicas com OAuth ativo, calendários associados por clínica.
- Alertas: expiração de token próxima (falhas de refresh), colisões de unicidade.
