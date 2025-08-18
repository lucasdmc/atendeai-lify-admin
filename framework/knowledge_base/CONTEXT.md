# Contexto do Projeto — AtendeAI Lify

Este documento consolida a visão atual do projeto (arquitetura, serviços, endpoints, integrações, variáveis de ambiente e execução local). Fonte de verdade adicional: `docs/ATENDE-AI-Definicao-Tecnica.md` e `docs/CLINIC_CONTEXT_INTEGRATION.md`.

## Visão Geral

- **Frontend**: React + TypeScript (Vite), em `src/` (componentes em `src/components`, páginas em `src/pages`).
- **Backend**: Node.js + Express no diretório raiz, servidor em `server.js` com rotas em `routes/` e serviços em `services/`.
- **Serviços Core**: Orquestração de IA, contexto de clínicas e fluxo de agendamentos em `services/core/`.
- **Banco de dados**: Supabase (PostgreSQL) com tabelas de clínicas, conversas e mensagens de WhatsApp.
- **Integrações**: WhatsApp Business (Meta), Supabase e Google Calendar.

## Estrutura de Pastas (essencial)

```
.
├── server.js                      # Servidor Express (backend)
├── routes/                        # Rotas: webhook, whatsapp, simulação
├── services/
│   ├── core/                      # Serviços core (IA, contexto, calendário, fluxo)
│   │   ├── clinicContextManager.js
│   │   ├── llmOrchestratorService.js
│   │   ├── appointmentFlowManager.js
│   │   └── googleCalendarService.js
│   └── whatsappMetaService.js     # Envio via API Meta
├── data/                          # JSONs de contextualização por clínica
├── docs/                          # Documentação técnica
├── src/                           # Frontend (React + Vite)
└── supabase/                      # Functions e migrações SQL
```

## Principais Endpoints (backend)

- Saúde e informações:
  - `GET /` — status e lista de endpoints.
  - `GET /health` — verificação de saúde do serviço.
- IA:
  - `POST /api/ai/process` — processa mensagem com `LLMOrchestratorService`.
- Métricas (memória):
  - `POST /api/metrics/track` — registra evento por clínica.
  - `GET /api/metrics/appointments` — agregado por clínica.
- WhatsApp (envio):
  - `POST /api/whatsapp/send-message` — envia texto via API oficial da Meta.
- Webhook WhatsApp (entrada):
  - `GET /webhook/whatsapp-meta` — verificação (hub.challenge).
  - `POST /webhook/whatsapp-meta` — recebe e processa mensagens com contexto completo.
- Simulação:
  - `POST /api/simulation/test` — processa mensagem em modo simulação por `clinicId`.
  - `GET /api/simulation/clinics` — lista clínicas em modo simulação.
  - `GET /api/simulation/messages/:clinicId` — mensagens simuladas.

## Serviços Core e Fluxo

- `ClinicContextManager` — Carrega/mescla contexto de clínicas a partir do banco e dos JSONs em `data/contextualizacao-*.json`. Inicializado no boot do servidor.
- `LLMOrchestratorService` — Orquestra fluxo de IA (intents, ferramentas, respostas), usando contexto da clínica.
- `AppointmentFlowManager` — Regras de agendamento e continuidade de conversa.
- `GoogleCalendarService` — Integração com Google Calendar para disponibilidade/agenda.

Fluxo de webhook WhatsApp (alto nível):
1) Recebe payload em `/webhook/whatsapp-meta` → resolve `clinicId` determinístico (mapeamentos Supabase).
2) Persiste conversa/mensagem em `whatsapp_conversations_improved` e `whatsapp_messages_improved`.
3) Chama `LLMOrchestratorService.processMessage` com contexto (`ClinicContextManager`).
4) Salva resposta e envia via API Meta (se não estiver em simulação).

## Supabase — Tabelas e Mapeamentos (utilizadas no backend)

- `clinics`: `id`, `name`, `whatsapp_phone`, `simulation_mode`, `has_contextualization`.
- `clinic_whatsapp_numbers`: `whatsapp_number` (sem "+"), `clinic_id`, `is_active`.
- `whatsapp_conversations_improved`: agregado por clínica + paciente.
- `whatsapp_messages_improved`: mensagens (received/sent) com `conversation_id`.
- `whatsapp_connections`: mapeamentos de números ativos (uso auxiliar em buscas).

## JSONs de Contextualização (única fonte)

- Local: `data/contextualizacao-*.json` (ex.: `data/contextualizacao-esadi.json`).
- Regra: o sistema usa apenas os JSONs inseridos na tela de clínicas (não criar manualmente outros artefatos fora do padrão).
- Detalhes e exemplo: ver `docs/CLINIC_CONTEXT_INTEGRATION.md`.

## Variáveis de Ambiente (essenciais)

- Backend:
  - `PORT` (padrão `3001`), `NODE_ENV`.
  - `WEBHOOK_VERIFY_TOKEN` — verificação do webhook.
  - `WHATSAPP_META_ACCESS_TOKEN`, `WHATSAPP_META_PHONE_NUMBER_ID` — envio via Meta.
  - Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Frontend (Vite):
  - `VITE_API_URL` (ex.: `http://localhost:3001`).
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
  - `VITE_WHATSAPP_API_URL` (opcional).

## Execução Local

Em dois terminais, na raiz do projeto:

1) Backend
```bash
npm start
# Servidor: http://localhost:3001
```

2) Frontend (Vite)
```bash
npm run dev
# App: http://localhost:3000
```

Pré-requisitos: Node >= 18, variáveis `.env` configuradas (ver `env.example`).

## Segurança e Observações

- Configure chaves do Supabase e Meta via `.env`. Não use chaves de exemplo em produção.
- Em produção, ative HTTPS e verificação de origem (CORS) adequadas.
- O modo simulação é controlado por `clinics.simulation_mode` e evita envios reais ao WhatsApp.

## Referências

- Documentos principais:
  - `docs/ATENDE-AI-Definicao-Tecnica.md`
  - `docs/CLINIC_CONTEXT_INTEGRATION.md`
  - `docs/AI_IMPLEMENTATION_SUMMARY.md`
- Código relevante:
  - `server.js`, `routes/webhook-final.js`, `routes/whatsapp.js`, `routes/simulation-test.js`
  - `services/core/index.js` e arquivos relacionados

