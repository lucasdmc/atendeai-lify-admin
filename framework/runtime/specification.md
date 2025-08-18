# System Stabilization & Feature Review — AtendeAI Lify

Status: COMPLETED — comprehensive analysis and implementation ready

Single source of truth for this workstream. All phases will update this document. Tasks begin as PENDING and will be flipped to FINISHED during development.

## 0) Context

- Backend: Node.js + Express (`server.js`, routes in `routes/`, core services in `services/core/`).
- Frontend: React + TypeScript (Vite) under `src/`.
- Database: Supabase (PostgreSQL) with WhatsApp conversation/message tables and clinic mappings.
- Integrations: WhatsApp Business (Meta API), Google OAuth, Google Calendar.
- Knowledge base: `framework/knowledge_base/CONTEXT.md` and docs in `/docs` (notably `ATENDE-AI-Definicao-Tecnica.md`).

Goal: Fix systemic errors and broken features, and realign implementation to the Technical Definition document and supporting docs, ensuring a reliable, testable, and observable platform.

Non-goals: Build net-new product features outside what’s described in `ATENDE-AI-Definicao-Tecnica.md`.

Constraints: LGPD compliance, Meta/Google policies, existing prod data in Supabase, minimal downtime.

## Decisões Confirmadas

- Prioridade: quando houver divergência entre comportamento atual e documentação, prevalece o `docs/ATENDE-AI-Definicao-Tecnica.md`.
- WhatsApp: relação 1:1 entre número e clínica. O mesmo número não pode ser cadastrado em clínicas diferentes.
- Google Calendar: cada clínica terá uma única autenticação Google (OAuth) ativa; a partir dessa conta, é possível associar um ou mais calendários. Não utilizaremos Service Account para esses fluxos.

## 1) High-level Requirements

1. Align codebase behavior with the flows and requirements defined in `docs/ATENDE-AI-Definicao-Tecnica.md` (source of truth).
2. Stabilize WhatsApp webhook ingestion and outbound messaging, with idempotency, retries, and clear observability.
3. Unify clinic contextualization: only JSONs provided via Clinics UI are used (per `docs/CLINIC_CONTEXT_INTEGRATION.md`).
4. Review and fix Google OAuth and Calendar flows: session handling, token refresh, and multi-calendar association from a single per-clinic OAuth connection (no service account).
5. Normalize and migrate Supabase schema to match the intended domain model, enforcing constraints and indexes.
6. Add robust error handling, rate limiting, and logging across critical paths.
7. Provide a test suite and manual QA checklist to verify end-to-end behavior.

## 2) Acceptance Criteria (testable)

- WhatsApp webhook
  - GET verification responds with configured `WEBHOOK_VERIFY_TOKEN`.
  - POST delivery is idempotent for duplicate events (dedupe key from Meta payload). No duplicate messages stored or sent.
  - Each inbound message is persisted to Supabase and associated to a deterministic clinic based on mapping rules.
  - Failures produce structured logs with correlation IDs; retries obey backoff.

- Clinic Context
  - Context resolution uses only the JSON from Clinics UI plus DB fields; no ad-hoc JSON sources.
  - `ClinicContextManager` exposes get-by-WhatsApp and get-complete APIs and is invoked by the orchestrator before response generation.

- Google OAuth/Calendar
  - Each clinic has exactly one active Google OAuth connection; attempts to add a second connection are blocked with clear error.
  - From the authenticated Google account, multiple calendars can be associated to the clinic; selection persists and is honored by availability queries.
  - OAuth tokens stored securely; background refresh works without user action and failures are observable with actionable errors.
  - Calendar availability fetch succeeds for all associated calendars; partial failures are surfaced and do not crash request path.
  - Session/token management follows `docs/GOOGLE_CALENDAR_SESSION_MANAGEMENT.md` rules.

- Database
  - Schema migrations run successfully on Supabase; constraints prevent orphaned conversations/messages.
  - Indexes exist for frequent queries (by clinic, by conversation, by timestamp, by WhatsApp number).
  - No query performs full table scans for primary user flows.
  - Uniqueness constraint enforces 1:1 mapping between `whatsapp_number` and clinic.

- Observability & Safety
  - Rate limiter protects critical endpoints; thresholds configurable per environment.
  - Logs include clinicId, conversationId, and requestId where applicable.
  - LGPD logging present for sensitive operations as per doc.

- Frontend
  - Clinics and Appointments screens load without errors using the corrected APIs.
  - Google connection status components reflect real token/session state.
  - ErrorBoundary captures runtime errors with actionable messages.
  - Clinics UI prevents cadastro do mesmo número de WhatsApp em múltiplas clínicas, exibindo mensagem clara em caso de tentativa.

## 3) Deliverables

- Updated `docs/ATENDE-AI-Definicao-Tecnica.md` (if deviations found) OR code changes that align to it; changes are documented.
- Supabase SQL migrations and rollback scripts.
- Backend refactors for WhatsApp webhook, context manager integration, Google flows.
- Frontend fixes for Clinics/Agendamentos and Google status.
- Test plan: automated tests + manual QA checklist.

## 4) Work Breakdown Structure (WBS)

### 4.1 Documentation & Gap Analysis
- [FINISHED] Parse and summarize key flows from `docs/ATENDE-AI-Definicao-Tecnica.md` into a checklist mapped to code modules.
- [FINISHED] Identify divergences between documentation and current implementation (backend, frontend, DB, integrations).
- [FINISHED] Propose resolution plan (update doc vs update code) for each divergence with rationale and risk.

### 4.2 Backend — WhatsApp & Core Services
- [FINISHED] Audit `routes/webhook-final.js` for verification and idempotency.
- [FINISHED] Implement idempotency for message inserts via `whatsapp_message_id` check.
- [FINISHED] Add retries/backoff and correlation IDs consistently across services.
- [FINISHED] Validate `services/core/llmOrchestratorService.js` uses `ClinicContextManager` prior to prompt/response.
- [FINISHED] Review `services/core/appointmentFlowManager.js` rules vs doc; align slot selection and continuity.
- [FINISHED] Ensure `services/core/clinicContextManager.js` only consumes JSONs from Clinics UI and merges DB fields appropriately.

### 4.3 Database — Supabase Schema & Migrations
- [FINISHED] Draft migration with 1:1 WhatsApp mapping and per-clinic OAuth + multi-calendars (`framework/runtime/design/database/20250818090000_schema_unificacao_whatsapp_google.sql`).
- [FINISHED] Apply migration via Supabase CLI and verify.
- [FINISHED] Backfill/transform data scripts for any breaking changes.

### 4.4 Google OAuth & Calendar
- [FINISHED] Remove Service Account path and enforce OAuth-per-clinic in `services/core/googleCalendarService.js`.
- [FINISHED] Make `GoogleTokenStore` compatible with JSON or flat columns in `google_calendar_tokens_by_clinic`.
- [FINISHED] Add routes: `routes/google.js` and mount in `server.js` (`/api/google/*`).
- [FINISHED] Implement endpoints to associate calendars to clinic (`clinic_calendars`) and list availability using associated calendars.

### 4.5 Frontend — Clinics, Agendamentos, Status
- [FINISHED] Enforce WhatsApp 1:1 on UI with clearer errors and normalized save (`ClinicWhatsAppMapping.tsx`, `clinicWhatsAppService.ts`).
- [FINISHED] Adjust Google UI to use clinic-based OAuth endpoints and calendar association.
- [FINISHED] ErrorBoundary and toasts review.

### 4.6 Observability, Safety & Limits
- [FINISHED] Confirm `middleware/intelligentRateLimiting.ts` and `services/utils/rateLimiter.js` policies are enforced for webhook/API.
- [FINISHED] Centralize logging format; enrich with clinicId, conversationId, and requestId.
- [FINISHED] Ensure LGPD logging and data minimization pathways per doc.

### 4.7 Testing & QA
- [FINISHED] Unit tests for webhook route handlers and core services.
- [FINISHED] Integration tests for WhatsApp simulation path and DB persistence.
- [FINISHED] Manual QA checklist covering end-to-end flows (WhatsApp → DB → Orchestrator → Response → Outbound).

## 5) Risks & Mitigations

- Data integrity changes may cause downtime: plan zero-downtime migrations and backfills; feature-flag risky code paths.
- Upstream API changes (Meta/Google) could break flows: add health checks and connectivity tests; clear error surfaces in UI.
- Legacy data shape variances: implement tolerant parsing and defensive coding paths with metrics.

## 6) Rollout Plan

1. Prepare migrations and deploy to staging; run synthetic tests and WhatsApp simulation.
2. Gate backend changes behind feature flags; deploy incrementally.
3. Migrate data during off-hours; monitor logs and DB metrics.
4. Enable features progressively; validate with canary clinics.

## 7) Open Questions (to confirm with stakeholders)

- Exact mapping rules when multiple WhatsApp numbers point to a single clinic and conflict resolution.
- Final authority when doc and current production behavior diverge: prefer doc or backward compatibility? [RESOLVIDO: priorizar doc]
- Service account usage boundaries vs per-user OAuth for Calendar operations. [RESOLVIDO: sem Service Account]


