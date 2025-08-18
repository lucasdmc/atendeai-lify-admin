# Desenho Técnico — APIs e Integrações (Meta/Google)

Fonte: `framework/runtime/specification.md` (decisões confirmadas), `docs/ATENDE-AI-Definicao-Tecnica.md` e `docs/CLINIC_CONTEXT_INTEGRATION.md`.

## Objetivos
- Estabilizar Webhook WhatsApp (verificação, idempotência, persistência, logs/correlação, retries/backoff).
- Unificar contextualização de clínica no orquestrador antes da resposta.
- Padronizar OAuth Google por clínica (1 conexão OAuth por clínica) com associação de múltiplos calendários.

## WhatsApp — Design
- Verificação GET: comparar `hub.verify_token` com `WEBHOOK_VERIFY_TOKEN`.
- Resolução de clínica: usar `clinic_whatsapp_numbers` com número sem `+` ou `phone_number_id` quando disponível; exigir `is_active = true`.
- Idempotência de mensagens: deduplicar por `(meta_message_id)` e/ou `(clinic_id, from, timestamp)` quando `meta_message_id` ausente. Ideal: índice único condicional em `whatsapp_messages_improved(meta_message_id)` quando coluna existir.
- Persistência: criar/atualizar conversa em `whatsapp_conversations_improved` e inserir mensagem em `whatsapp_messages_improved`.
- Envio outbound: confirmar status/erros, logar `requestId` e `messageId` retornado pela Meta.
- Erros e retries: backoff exponencial para temporários; falhas definitivas não reprocessam; logs estruturados com `clinicId`, `conversationId`, `requestId`.
- Rate limiting: limites configuráveis por ambiente.

## Contextualização — Design
- `ClinicContextManager.getClinicContextByWhatsApp(display_phone_number | phone_number_id)` resolve contexto completo (DB + JSON UI).
- Orquestrador (`llmOrchestratorService`) sempre injeta contexto antes da geração de resposta.

## Google OAuth/Calendar — Design
- Regra: 1 conexão OAuth por clínica (tabela `google_calendar_tokens_by_clinic`), múltiplos calendários em `clinic_calendars`.
- Fluxo OAuth:
  1. Frontend inicia fluxo com `clinicId` (state assinado).
  2. Backend gera URL de consentimento e salva `state`.
  3. Callback do Google no backend troca `code` por tokens e armazena em `google_calendar_tokens_by_clinic` (por `clinic_id`).
  4. Frontend apenas consulta status; tokens nunca ficam no cliente.
- Associação de calendários:
  - Endpoint para listar calendários da conta conectada e associar `calendar_id[]` a `clinicId` (tabela `clinic_calendars`).
  - Disponibilidade: backend agrega eventos dos calendários ativos associados.
- Renovação de tokens:
  - Serviço em background no backend renova antes de expirar; falhas geram alertas e status de reconexão.

## Endpoints (propostos/alinhados)
- WhatsApp
  - `GET /webhook/whatsapp-meta` — verificação.
  - `POST /webhook/whatsapp-meta` — ingestão, idempotência e persistência.
- Google
  - `POST /api/google/oauth/start` (body: `{ clinicId }`) → URL de consentimento + `state` assinado.
  - `GET /api/google/oauth/callback?code&state` → troca tokens e persiste em `google_calendar_tokens_by_clinic`.
  - `GET /api/google/session/status?clinicId` → status da conexão (conectado, válido, expiraEm).
  - `GET /api/google/calendars/list?clinicId` → lista de calendários da conta conectada.
  - `POST /api/google/calendars/associate` (body: `{ clinicId, calendarIds: string[] }`) → upsert em `clinic_calendars`.
  - `DELETE /api/google/oauth/disconnect?clinicId` → revoga e apaga tokens + calendários associados.

## Erros — Taxonomia
- 4xx: input inválido, `clinicId` inexistente, duplicidade de WhatsApp, falta de OAuth.
- 5xx: Meta/Google temporário, timeouts, falhas de DB, inconsistências inesperadas.
- Padrão de resposta de erro: `{ requestId, code, message, hint?, details? }`.

## Segurança
- Tokens no backend (Supabase), nunca no frontend.
- `state` OAuth assinado e expira.
- Logs mascaram segredos; CORS estrito; validação forte de entrada.

## Observabilidade
- Correlation-ID por requisição.
- Métricas por clínica: entregas WhatsApp, latência, erros, status de OAuth e volume por calendário.

## Compatibilidade e Transição
- UI de Google deve migrar para fluxo por clínica.
- Qualquer endpoint legacy deve ser mantido sob flag até depreciação.
