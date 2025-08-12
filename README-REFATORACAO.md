# Refatoração dos serviços (branch refactor/roadmap-phase-1)

Este README contém instruções para aplicar as mudanças da refatoração, configurar o ambiente e executar testes.

## Variáveis de ambiente mínimas

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY
- (opcional) OPENAI_API_BASE
- (opcional) WHATSAPP_API_VERSION (default v23.0)
- (opcional) HTTP_DEFAULT_TIMEOUT_MS (default 15000)
- (opcional) WHATSAPP_RATE_LIMIT_PER_MINUTE (default 60)

## Migrations (Supabase)

1) Verifique o diretório `supabase/migrations/`.
2) Aplique as migrations novas em ordem:
   - `20250701090000_create_routing_flow_calendar_tables.sql`

Observação: já existem migrations anteriores para tabelas de contexto e dados; mantenha a ordem cronológica.

## Estruturas novas de banco

- `clinic_whatsapp_numbers`: mapeia `phone_number_id` e `display_phone_number` para `clinic_id`.
- `conversation_flows`: armazena estado durável do fluxo por `id` (ex.: phoneNumber), com TTL gerenciado na aplicação.
- `google_calendar_tokens_by_clinic`: tokens OAuth do Google Calendar por clínica (JSON).

## Principais mudanças de código

- `services/config/index.js`: valida e centraliza envs/constantes.
- `services/utils/`: http com retry/backoff, idempotency, rate limiting, validate, logger estruturado, traceId, messageNormalization.
- `services/core/`: 
  - `clinicRoutingRepository.js`: roteamento determinístico de clínica.
  - `flowStateStore.js`: estado de fluxo durável.
  - `conversationMemoryRepository.js`: memória de conversa (Supabase).
  - `intentDetector.js`: detecção de intenção com OpenAI.
  - `responseFormatter.js`: prompt e mensagens para LLM.
  - `toolsRouter.js`: delega intents para ferramentas (agendamento).
  - `googleCalendarService.js`: tokens em DB; idempotência e anti-double-booking.

## Como rodar testes unitários mínimos

Execute os testes de unidade (node puro):

```bash
node tests/unit/idempotency.test.js && \
node tests/unit/messageNormalization.test.js && \
node tests/unit/httpRetry.test.js && \
node tests/unit/conversationMemoryRepository.test.js && \
node tests/unit/flowStateStore.test.js
```

## Plano de depreciação do código legacy

- Congelar `services/legacy/` (sem novos usos).
- Introduzir flags para alternar implementações (ver seção abaixo).
- Substituir chamadas para `core/` gradualmente; monitorar métricas.
- Remover `legacy/` após 2 ciclos estáveis em produção.

## Feature flags (ativação do core)

Use as variáveis (sugeridas):
- `FEATURE_CORE_ROUTING=true`
- `FEATURE_CORE_APPOINTMENT_FLOW=true`
- `FEATURE_CORE_WHATSAPP_RETRY=true`

A aplicação pode ler essas flags e escolher o caminho core (novo) versus legacy temporariamente.

## Próximos passos

- Escrever testes de integração (mocks de WhatsApp/Google) e E2E (fluxos completos multi-clínicas).
- Implementar dashboards de métricas.
- Deprecar `services/legacy/` com flags ativas por padrão.
