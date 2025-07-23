# 🚀 Plano de Integração Frontend-Backend 100%

## 📋 Status Atual
- ✅ **Backend**: 100% migrado (11/11 Edge Functions)
- ❌ **Frontend**: 10% integrado (apenas userService.ts)
- 🎯 **Objetivo**: Integração completa frontend-backend

---

## 🎯 TO-DOs POR PRIORIDADE

### 🔥 PRIORIDADE ALTA (Funcionalidades Críticas)

#### 📱 WhatsApp Integration
- [ ] **TODO**: Migrar `src/hooks/useConversationData.tsx`
  - [ ] Substituir `supabase.functions.invoke('whatsapp-integration/send-message')` por `fetch('/api/whatsapp-integration/send-message')`
  - [ ] Atualizar headers para incluir Authorization Bearer token
  - [ ] Testar envio de mensagens via novo backend

- [ ] **TODO**: Migrar `src/hooks/whatsapp/useWhatsAppActions.tsx`
  - [ ] Substituir `agent-whatsapp-manager/generate-qr` por `/api/agents/generate-qr`
  - [ ] Substituir `agent-whatsapp-manager/status` por `/api/agents/status`
  - [ ] Substituir `agent-whatsapp-manager/disconnect` por `/api/agents/disconnect`
  - [ ] Substituir `agent-whatsapp-manager/refresh-qr` por `/api/agents/refresh-qr`
  - [ ] Atualizar tipos de resposta para compatibilidade

- [ ] **TODO**: Migrar `src/hooks/whatsapp/useWhatsAppStatus.tsx`
  - [ ] Substituir `whatsapp-integration/status` por `/api/whatsapp-integration/status`
  - [ ] Atualizar polling de status

#### 📅 Calendar Management
- [ ] **TODO**: Migrar `src/hooks/useAgendamentos.tsx`
  - [ ] Substituir `calendar-manager` por `/api/calendar/events`
  - [ ] Substituir `calendar-manager` por `/api/calendar/events` (POST)
  - [ ] Substituir `calendar-manager` por `/api/calendar/events` (PUT)
  - [ ] Substituir `calendar-manager` por `/api/calendar/events` (DELETE)
  - [ ] Atualizar tipos de dados para compatibilidade

- [ ] **TODO**: Migrar `src/hooks/useMultiCalendar.tsx`
  - [ ] Substituir `calendar-manager` por `/api/calendar/events`
  - [ ] Substituir `calendar-manager` por `/api/calendar/calendars`
  - [ ] Substituir `calendar-manager` por `/api/calendar/sync`
  - [ ] Atualizar lógica de sincronização

- [ ] **TODO**: Migrar `src/hooks/useAgendamentosCalendar.tsx`
  - [ ] Substituir `appointment-manager` por `/api/calendar/events`
  - [ ] Atualizar criação de eventos
  - [ ] Atualizar atualização de eventos
  - [ ] Atualizar deleção de eventos

#### 👥 User Management
- [ ] **TODO**: Migrar `src/services/aiChatService.ts`
  - [ ] Substituir `create-user-auth` por `/api/auth/register`
  - [ ] Atualizar função `createUserDirectly`
  - [ ] Manter fallback para Edge Function se necessário

#### 🔐 Authentication
- [ ] **TODO**: Criar `src/services/authService.ts` (NOVO)
  - [ ] Implementar `login()` usando `/api/auth/login`
  - [ ] Implementar `logout()` usando `/api/auth/logout`
  - [ ] Implementar `refreshToken()` usando `/api/auth/refresh`
  - [ ] Implementar `resetPassword()` usando `/api/auth/reset-password`
  - [ ] Implementar `changePassword()` usando `/api/auth/change-password`
  - [ ] Implementar `verifyEmail()` usando `/api/auth/verify-email`

---

### ⚡ PRIORIDADE MÉDIA (Funcionalidades Importantes)

#### 🤖 AI Services
- [ ] **TODO**: Migrar `src/services/ai/intentRecognitionService.ts`
  - [ ] Substituir `ai-intent-recognition` por `/api/ai/intent-recognition`
  - [ ] Atualizar tipos de dados
  - [ ] Testar reconhecimento de intenções

- [ ] **TODO**: Criar `src/services/aiService.ts` (NOVO)
  - [ ] Implementar `processMessage()` usando `/api/ai/chat`
  - [ ] Implementar `processIntent()` usando `/api/ai/intent-recognition`
  - [ ] Implementar `getConversationHistory()` usando `/api/ai/conversations`

#### 🔍 RAG Search
- [ ] **TODO**: Criar `src/services/ragService.ts` (NOVO)
  - [ ] Implementar `searchKnowledge()` usando `/api/rag/search`
  - [ ] Implementar `getKnowledgeBase()` usando `/api/rag/knowledge-base`
  - [ ] Implementar `addToKnowledgeBase()` usando `/api/rag/knowledge-base`
  - [ ] Implementar `getDocuments()` usando `/api/rag/documents`
  - [ ] Implementar `getStats()` usando `/api/rag/stats`

#### 🏥 Appointment Management
- [ ] **TODO**: Migrar `src/services/appointmentService.ts`
  - [ ] Substituir `appointment-manager` por `/api/calendar/events`
  - [ ] Atualizar criação de agendamentos
  - [ ] Atualizar atualização de agendamentos
  - [ ] Atualizar deleção de agendamentos
  - [ ] Atualizar listagem de agendamentos

---

### 🔧 PRIORIDADE BAIXA (Funcionalidades de Suporte)

#### 🌐 Google Services
- [ ] **TODO**: Migrar `src/services/googleServiceAccountService.ts`
  - [ ] Substituir `google-service-auth` por `/api/setup/google-service-auth`
  - [ ] Atualizar configuração de autenticação
  - [ ] Testar integração com Google Calendar

- [ ] **TODO**: Migrar `src/services/google/tokens.ts`
  - [ ] Substituir `google-user-auth` por `/api/setup/google-user-auth`
  - [ ] Atualizar gerenciamento de tokens
  - [ ] Testar autenticação de usuário

#### 📊 Dashboard & Metrics
- [ ] **TODO**: Migrar `src/hooks/useDashboardMetrics.tsx`
  - [ ] Substituir `update-dashboard-metrics` por `/api/dashboard/metrics`
  - [ ] Atualizar coleta de métricas
  - [ ] Testar atualização de dashboard

#### 🔗 Agent Management
- [ ] **TODO**: Migrar `src/hooks/useAgents.tsx`
  - [ ] Substituir `agent-whatsapp-manager/connections` por `/api/agents/connections`
  - [ ] Atualizar listagem de agentes
  - [ ] Testar gerenciamento de agentes

- [ ] **TODO**: Migrar `src/hooks/useAgentWhatsAppConnection.tsx`
  - [ ] Substituir `agent-whatsapp-manager/connections` por `/api/agents/connections`
  - [ ] Substituir `agent-whatsapp-manager/generate-qr` por `/api/agents/generate-qr`
  - [ ] Substituir `agent-whatsapp-manager/disconnect` por `/api/agents/disconnect`
  - [ ] Substituir `agent-whatsapp-manager/status` por `/api/agents/status`

---

## 🛠️ TO-DOs DE INFRAESTRUTURA

### 🔧 Configuração
- [ ] **TODO**: Atualizar `src/config/environment.ts`
  - [ ] Adicionar `VITE_BACKEND_URL` como variável principal
  - [ ] Configurar fallback para `config.whatsapp.serverUrl`
  - [ ] Adicionar validação de configuração

- [ ] **TODO**: Criar `src/services/apiClient.ts` (NOVO)
  - [ ] Implementar cliente HTTP centralizado
  - [ ] Adicionar interceptors para tokens
  - [ ] Adicionar tratamento de erros global
  - [ ] Adicionar retry logic
  - [ ] Adicionar cache de requisições

### 🔐 Autenticação
- [ ] **TODO**: Atualizar `src/contexts/ClinicContext.tsx`
  - [ ] Integrar com novo sistema de autenticação
  - [ ] Atualizar gerenciamento de sessão
  - [ ] Testar persistência de dados

### 🧪 Testes
- [ ] **TODO**: Criar testes para novos serviços
  - [ ] Testes unitários para `authService.ts`
  - [ ] Testes unitários para `ragService.ts`
  - [ ] Testes unitários para `aiService.ts`
  - [ ] Testes de integração para APIs

---

## 📋 TO-DOs DE MIGRAÇÃO POR ARQUIVO

### 📁 src/services/
- [ ] **TODO**: `userService.ts` ✅ (JÁ MIGRADO)
- [ ] **TODO**: `aiChatService.ts` → Migrar para novo backend
- [ ] **TODO**: `appointmentService.ts` → Migrar para novo backend
- [ ] **TODO**: `googleServiceAccountService.ts` → Migrar para novo backend
- [ ] **TODO**: `google/tokens.ts` → Migrar para novo backend
- [ ] **TODO**: `ai/intentRecognitionService.ts` → Migrar para novo backend
- [ ] **TODO**: `authService.ts` → CRIAR NOVO
- [ ] **TODO**: `ragService.ts` → CRIAR NOVO
- [ ] **TODO**: `aiService.ts` → CRIAR NOVO
- [ ] **TODO**: `apiClient.ts` → CRIAR NOVO

### 📁 src/hooks/
- [ ] **TODO**: `useAgendamentos.tsx` → Migrar para novo backend
- [ ] **TODO**: `useMultiCalendar.tsx` → Migrar para novo backend
- [ ] **TODO**: `useAgendamentosCalendar.tsx` → Migrar para novo backend
- [ ] **TODO**: `useConversationData.tsx` → Migrar para novo backend
- [ ] **TODO**: `useAgentWhatsAppConnection.tsx` → Migrar para novo backend
- [ ] **TODO**: `useAgents.tsx` → Migrar para novo backend
- [ ] **TODO**: `useDashboardMetrics.tsx` → Migrar para novo backend
- [ ] **TODO**: `whatsapp/useWhatsAppActions.tsx` → Migrar para novo backend
- [ ] **TODO**: `whatsapp/useWhatsAppStatus.tsx` → Migrar para novo backend

---

## 🎯 TO-DOs DE VALIDAÇÃO

### ✅ Testes de Integração
- [ ] **TODO**: Testar autenticação completa
  - [ ] Login/logout funcionando
  - [ ] Refresh token funcionando
  - [ ] Proteção de rotas funcionando

- [ ] **TODO**: Testar WhatsApp Integration
  - [ ] Inicialização funcionando
  - [ ] Envio de mensagens funcionando
  - [ ] Status funcionando
  - [ ] Desconexão funcionando

- [ ] **TODO**: Testar Calendar Management
  - [ ] Criação de eventos funcionando
  - [ ] Atualização de eventos funcionando
  - [ ] Deleção de eventos funcionando
  - [ ] Sincronização funcionando

- [ ] **TODO**: Testar RAG Search
  - [ ] Busca funcionando
  - [ ] Adição de conhecimento funcionando
  - [ ] Estatísticas funcionando

- [ ] **TODO**: Testar AI Services
  - [ ] Processamento de mensagens funcionando
  - [ ] Reconhecimento de intenções funcionando
  - [ ] Histórico de conversas funcionando

### 🔧 Testes de Performance
- [ ] **TODO**: Testar tempo de resposta das APIs
- [ ] **TODO**: Testar cache de requisições
- [ ] **TODO**: Testar retry logic
- [ ] **TODO**: Testar tratamento de erros

---

## 📊 PROGRESSO GERAL

### 📈 Métricas de Progresso
- **Serviços Migrados**: 1/9 (11%)
- **Hooks Migrados**: 0/9 (0%)
- **Funcionalidades Testadas**: 0/15 (0%)
- **Integração Geral**: 10%

### 🎯 Próximos Passos Imediatos
1. **Criar `apiClient.ts`** - Cliente HTTP centralizado
2. **Migrar `authService.ts`** - Sistema de autenticação
3. **Migrar WhatsApp hooks** - Funcionalidade crítica
4. **Migrar Calendar hooks** - Funcionalidade crítica
5. **Testar integração básica**

---

## 🚀 ESTRATÉGIA DE MIGRAÇÃO

### 📋 Fase 1: Infraestrutura (Dia 1)
- [ ] Criar `apiClient.ts`
- [ ] Atualizar `environment.ts`
- [ ] Criar `authService.ts`

### 📋 Fase 2: Funcionalidades Críticas (Dia 2-3)
- [ ] Migrar WhatsApp hooks
- [ ] Migrar Calendar hooks
- [ ] Migrar User services

### 📋 Fase 3: Funcionalidades Importantes (Dia 4-5)
- [ ] Migrar AI services
- [ ] Migrar RAG services
- [ ] Migrar Appointment services

### 📋 Fase 4: Funcionalidades de Suporte (Dia 6-7)
- [ ] Migrar Google services
- [ ] Migrar Dashboard services
- [ ] Migrar Agent services

### 📋 Fase 5: Testes e Validação (Dia 8-10)
- [ ] Testes de integração
- [ ] Testes de performance
- [ ] Validação completa

---

## 🎉 OBJETIVO FINAL

**Status Alvo**: 100% integrado com novo backend
**Tempo Estimado**: 10 dias
**Benefícios**: Performance melhorada, manutenibilidade, escalabilidade

**Quer começar pela Fase 1 (Infraestrutura)?** 🚀 