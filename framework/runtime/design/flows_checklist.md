# Checklist de Fluxos Mapeados - ATENDE-AI

## 1. Fluxos Principais Identificados na Documentação

### 1.1 WhatsApp → Backend
- **RF05**: Webhook recebe mensagens do WhatsApp
- **Requisitos**: Verificação, idempotência, persistência no DB
- **Módulos**: `routes/webhook-final.js`, `services/whatsappMetaService.js`
- **Status**: ✅ IMPLEMENTADO (idempotência melhorada)

### 1.2 Contextualização de Clínicas
- **RF02**: Chatbot absorve contexto via JSON da tela de clínicas
- **RF10**: Tela de relatório executivo das configurações
- **Requisitos**: APENAS JSONs da tela de clínicas, sem criatividade do chatbot
- **Módulos**: `services/core/clinicContextManager.js`
- **Status**: ✅ IMPLEMENTADO

### 1.3 Agendamento via WhatsApp
- **RF07**: Solicitar agendamento via chatbot
- **RF08**: Sistema de priorização automática
- **RF09**: Confirmação de agendamento
- **Requisitos**: Consultar Google Calendar, inserir eventos, priorização
- **Módulos**: `services/core/appointmentFlowManager.js`, `services/core/googleCalendarService.js`
- **Status**: ⚠️ PENDENTE REVISÃO

### 1.4 Google Calendar Integration  
- **RF06**: Integração OAuth + múltiplos calendários
- **Requisitos**: OAuth por clínica (1:1), múltiplos calendários associados
- **Módulos**: `routes/google.js`, `services/core/googleCalendarService.js`
- **Status**: ✅ IMPLEMENTADO (OAuth enforced)

### 1.5 Tela de Conversas
- **RF05**: Interface WhatsApp-like
- **RF03**: Toggle simulação ON/OFF
- **Requisitos**: Assumir atendimento, envio de arquivos, etiquetas
- **Módulos**: Frontend `src/pages/Conversas.tsx`, backend webhook
- **Status**: ⚠️ PARCIALMENTE IMPLEMENTADO

### 1.6 CRUD de Clínicas e Usuários
- **RF01**: CRUD Clínicas com WhatsApp 1:1
- **RF04**: CRUD Usuários com perfis e permissões
- **Requisitos**: Validação de números únicos, controle de permissões
- **Módulos**: Frontend clínicas/usuários, backend APIs
- **Status**: ✅ IMPLEMENTADO (1:1 WhatsApp enforced)

## 2. Arquitetura Técnica Requerida

### 2.1 Stack Confirmada
- **Frontend**: React + TypeScript (Vite, Tailwind CSS) ✅
- **Backend**: Node.js (Express) + Funções Edge Supabase ✅  
- **Database**: PostgreSQL (Supabase) ✅
- **Hosting**: Vercel (frontend), Railway (backend), Supabase (DB) ✅

### 2.2 Integrações Críticas
- **WhatsApp API Meta**: Webhook bi-direcional ✅
- **Google OAuth 2.0**: Por clínica, múltiplos calendários ✅
- **Supabase Auth**: Gestão de usuários ✅

### 2.3 Requisitos de Performance (RNF01)
- Páginas principais: < 3s ⚠️ A VALIDAR
- Operações busca: < 2s ⚠️ A VALIDAR  
- 100 usuários simultâneos ⚠️ A VALIDAR

### 2.4 Requisitos de Segurança (RNF02)
- Senhas com hash ✅
- Sessões expiram 2h inatividade ✅

## 3. Gaps Identificados para Validação

### 3.1 AppointmentFlowManager
❓ **PENDENTE**: Verificar se regras de priorização (RF08) estão implementadas
❓ **PENDENTE**: Validar slots selection e continuidade de conversa

### 3.2 Performance & Testing
❓ **PENDENTE**: Testes de carga para validar RNF01
❓ **PENDENTE**: Suíte de testes unitários e integração

### 3.3 Error Handling
❓ **PENDENTE**: ErrorBoundary e toasts review no frontend
❓ **PENDENTE**: Logging centralizado com correlation IDs

### 3.4 Migration & Data Scripts
❓ **PENDENTE**: Aplicação de migração schema no Supabase
❓ **PENDENTE**: Scripts de backfill para mudanças breaking

## 4. Próximos Passos

1. **Revisar appointmentFlowManager.js** ← EM ANDAMENTO
2. **Aplicar migração Supabase** 
3. **Implementar testes unitários**
4. **Review ErrorBoundary/toasts**
5. **QA checklist end-to-end**

---
*Documento gerado como parte do processo de análise de gaps*
