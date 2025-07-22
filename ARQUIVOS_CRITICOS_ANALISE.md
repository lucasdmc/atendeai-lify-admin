# 📁 ARQUIVOS CRÍTICOS PARA ANÁLISE - QR CODE INVÁLIDO

## 🎯 ARQUIVOS PRINCIPAIS (20 arquivos)

### 1. **Backend Principal**
- **`server-baileys-production.js`** - Servidor Node.js com Baileys
  - Endpoint `/api/whatsapp/generate-qr`
  - Função `generateSimpleQRCode()` (PROBLEMA)
  - Configuração do Baileys

### 2. **Supabase Functions**
- **`supabase/functions/agent-whatsapp-manager/index.ts`** - Edge Function principal
  - Função `handleGenerateQR()`
  - Comunicação com backend
  - Tratamento de erros

### 3. **Frontend - Hook Principal**
- **`src/hooks/useAgentWhatsAppConnection.tsx`** - Hook de conexão
  - Função `generateQRCode()`
  - Verificação de status
  - Comunicação com Supabase

### 4. **Frontend - Componente UI**
- **`src/components/agentes/AgentWhatsAppManager.tsx`** - Componente principal
  - Exibição do QR Code
  - Estados de loading/error
  - Interface do usuário

### 5. **Configuração de Ambiente**
- **`src/config/environment.ts`** - Configurações do frontend
  - URLs dos servidores
  - Chaves de API

### 6. **Variáveis de Ambiente**
- **`.env.production`** - Configurações de produção
  - `VITE_WHATSAPP_SERVER_URL`
  - Chaves do Supabase

### 7. **Dependências**
- **`package.json`** - Dependências do projeto
  - Versões do Baileys
  - Outras bibliotecas

### 8. **Estrutura do Banco**
- **`supabase/migrations/20250101000002_create_agent_whatsapp_tables.sql`** - Tabelas WhatsApp
  - Estrutura da tabela `agent_whatsapp_connections`

### 9. **Scripts de Deploy**
- **`scripts/deploy-whatsapp.sh`** - Script de deploy
  - Configuração do PM2
  - Deploy do backend

### 10. **Refatorações Temporárias**
- **`temp-refactor/conversation-memory-service.ts`** - Serviços temporários
  - Possíveis melhorias

### 11. **Análises Anteriores**
- **`whatsapp-analysis-for-claude/EXECUTIVE_SUMMARY.md`** - Resumo executivo
  - Problemas identificados anteriormente

### 12. **Logs e Debug**
- **`opus-analysis-20250715-190406/backend-logs.txt`** - Logs do backend
  - Erros e warnings

### 13. **Componentes WhatsApp**
- **`src/components/whatsapp/QRCodeDisplay.tsx`** - Componente de QR Code
  - Exibição do QR Code
  - Estados visuais

### 14. **Serviços AI**
- **`src/services/ai/aiChatService.ts`** - Serviço de IA
  - Integração com ChatGPT
  - Processamento de mensagens

### 15. **Tipos TypeScript**
- **`src/types/conversation.ts`** - Tipos de conversa
  - Interfaces do WhatsApp

### 16. **Utilitários**
- **`src/utils/conversationUtils.ts`** - Utilitários
  - Funções auxiliares

### 17. **Hooks Específicos**
- **`src/hooks/whatsapp/useWhatsAppActions.tsx`** - Hook de ações
  - Ações do WhatsApp

### 18. **Configuração do Supabase**
- **`supabase/functions/ai-chat-gpt4/index.ts`** - Função de IA
  - Integração com GPT-4

### 19. **Scripts de Setup**
- **`scripts/setup-whatsapp-env.js`** - Setup do ambiente
  - Configuração inicial

### 20. **Documentação**
- **`ADVANCED_AI_INTEGRATION_GUIDE.md`** - Guia de integração
  - Documentação técnica

## 🔍 FOCOS DE ANÁLISE

### Arquivos Críticos para o Problema:
1. **`server-baileys-production.js`** - Backend principal
2. **`supabase/functions/agent-whatsapp-manager/index.ts`** - Supabase Function
3. **`src/hooks/useAgentWhatsAppConnection.tsx`** - Hook frontend
4. **`src/components/agentes/AgentWhatsAppManager.tsx`** - Componente UI
5. **`.env.production`** - Configurações

### Arquivos de Suporte:
6. **`package.json`** - Dependências
7. **`src/config/environment.ts`** - Configurações
8. **`supabase/migrations/`** - Estrutura do banco
9. **`scripts/`** - Scripts de deploy
10. **`temp-refactor/`** - Refatorações

### Arquivos de Análise:
11. **`whatsapp-analysis-*/`** - Análises anteriores
12. **`opus-analysis-*/`** - Logs de debug
13. **`ADVANCED_AI_INTEGRATION_GUIDE.md`** - Documentação
14. **`AGENDAMENTOS_FIX_SUMMARY.md`** - Fixes anteriores

### Arquivos de Componentes:
15. **`src/components/whatsapp/`** - Componentes WhatsApp
16. **`src/services/ai/`** - Serviços de IA
17. **`src/hooks/whatsapp/`** - Hooks específicos
18. **`src/types/`** - Tipos TypeScript
19. **`src/utils/`** - Utilitários
20. **`src/config/`** - Configurações

## 🎯 PRIORIDADE DE ANÁLISE

### **ALTA PRIORIDADE** (Problema direto):
1. `server-baileys-production.js`
2. `supabase/functions/agent-whatsapp-manager/index.ts`
3. `src/hooks/useAgentWhatsAppConnection.tsx`
4. `src/components/agentes/AgentWhatsAppManager.tsx`
5. `.env.production`

### **MÉDIA PRIORIDADE** (Suporte):
6. `package.json`
7. `src/config/environment.ts`
8. `supabase/migrations/`
9. `scripts/`
10. `temp-refactor/`

### **BAIXA PRIORIDADE** (Contexto):
11-20. Arquivos de análise e componentes

---

**Total de arquivos:** 20 arquivos críticos
**Foco principal:** 5 arquivos de alta prioridade
**Status:** Pronto para análise detalhada 