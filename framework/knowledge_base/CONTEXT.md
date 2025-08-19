# 📋 CONTEXT - AtendeAI Lify Admin System

## 🏗️ **ARQUITETURA GERAL DO SISTEMA**

### **Sistema de IA para Atendimento WhatsApp com Integração Google Calendar**

**Descrição:** Sistema completo de atendimento automatizado via WhatsApp com IA, integrado ao Google Calendar para agendamentos médicos/clínicos.

**Domínios:**
- **Produção:** https://atendeai.lify.com.br/
- **Backend:** https://atendeai-lify-backend-production.up.railway.app/

---

## 🔧 **STACK TECNOLÓGICO**

### **Frontend:**
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5.4
- **Styling:** TailwindCSS + Radix UI
- **State Management:** Zustand
- **HTTP Client:** Axios + TanStack Query
- **Routing:** React Router DOM

### **Backend:**
- **Runtime:** Node.js (Express.js)
- **Deploy:** Railway
- **APIs:** Google Calendar API, WhatsApp Meta API
- **IA:** OpenAI GPT-4o + Anthropic Claude

### **Database & Auth:**
- **Database:** Supabase (PostgreSQL)
- **Edge Functions:** Supabase (Deno runtime)
- **Auth:** Supabase Auth + Google OAuth 2.0

### **Infraestrutura:**
- **Monitoramento:** Winston Logger
- **Rate Limiting:** Express middleware
- **CORS:** Configurado para múltiplos domínios

---

## 📁 **ESTRUTURA DE DIRETÓRIOS**

```
atendeai-lify-admin/
├── src/
│   ├── components/          # Componentes React reutilizáveis
│   │   ├── agendamentos/   # Específicos do Google Calendar
│   │   ├── clinics/        # Gestão de clínicas
│   │   ├── conversations/  # Interface WhatsApp
│   │   └── ui/            # Componentes base (Radix UI)
│   ├── config/            # Configurações de ambiente
│   ├── hooks/             # Custom React hooks
│   ├── pages/             # Páginas principais da aplicação
│   ├── services/          # Integrações com APIs externas
│   └── types/             # Definições TypeScript
├── supabase/              # Edge Functions e migrations
│   └── functions/         # Edge Functions (Deno)
├── routes/                # Rotas do backend Express
├── services/              # Serviços backend
│   └── core/             # Serviços principais (IA, Calendar)
└── framework/             # Framework de desenvolvimento
    ├── knowledge_base/    # Documentação do sistema
    └── runtime/          # Especificações ativas
```

---

## 🔐 **AUTENTICAÇÃO E INTEGRAÇÃO GOOGLE CALENDAR**

### **Arquitetura OAuth Implementada (Atualização Recente):**

#### **Problema Resolvido:**
- **Issue:** OAuth redirecionando para `localhost:8080` em produção
- **Causa:** URLs hardcoded para desenvolvimento
- **Solução:** Sistema de detecção automática de ambiente

#### **Implementação Atual:**

**1. Detecção Automática de URLs:**
```typescript
// src/config/environment.ts & frontend-config.ts
const getRedirectUri = (): string => {
  // Detecta automaticamente baseado no hostname
  if (hostname === 'atendeai.lify.com.br') {
    return 'https://atendeai.lify.com.br/agendamentos';
  }
  // Fallback para desenvolvimento
  return 'http://localhost:8080/agendamentos';
};
```

**2. Edge Function Supabase:**
```
supabase/functions/google-user-auth/
├── index.ts        # Função principal de troca de tokens
├── README.md       # Documentação da função
└── .edge-runtime   # Configuração Deno
```

**Funcionalidades:**
- Troca segura de código OAuth por tokens
- Tratamento específico de erros (`redirect_uri_mismatch`)
- Obtenção de perfil do usuário Google
- Suporte completo a CORS

**3. Painel de Debug OAuth:**
```typescript
// src/components/agendamentos/OAuthDebugPanel.tsx
- Validação automática de configuração
- Teste de Edge Function em tempo real
- Informações de ambiente dinâmicas
- Instruções de correção contextuais
```

### **Fluxo OAuth Completo:**
1. **Usuário clica "Conectar Google Calendar"**
2. **Frontend detecta ambiente automaticamente**
3. **Redirecionamento para Google OAuth com URL correta**
4. **Google redireciona para URL de produção**
5. **Edge Function `google-user-auth` processa tokens**
6. **Tokens salvos no Supabase por usuário**
7. **Calendários sincronizados e disponíveis**

---

## 🏥 **SISTEMA MULTI-CLÍNICAS**

### **Modelo de Dados:**
- **clinics:** Dados base das clínicas
- **clinic_calendars:** Associação clínica ↔ calendários Google
- **google_calendar_tokens_by_clinic:** Tokens OAuth por clínica
- **user_calendars:** Calendários do usuário autenticado

### **Contexto de Clínicas:**
```typescript
// src/contexts/ClinicContext.tsx
- Seleção global de clínica ativa
- Filtros automáticos baseados na clínica
- Sincronização com calendários específicos
```

---

## 🤖 **SISTEMA DE IA**

### **Orquestração:**
- **LLMOrchestratorService:** Coordena diferentes modelos de IA
- **Suporte:** OpenAI GPT-4o, Anthropic Claude
- **Contexto:** Sistema de memória por conversação
- **Tools:** Integração com Google Calendar para agendamentos

### **Fluxos de Conversação:**
- **Detecção de intenção:** Agendamento, informações, etc.
- **Contextualização:** Baseada na clínica selecionada
- **Personalização:** Perfil do usuário e histórico

---

## 📱 **INTEGRAÇÃO WHATSAPP**

### **Meta API Integration:**
- **Webhook:** `/webhook/whatsapp-meta`
- **Envio:** `/api/whatsapp/send-message`
- **Rate Limiting:** Middleware inteligente
- **Logging:** Trace completo de conversações

---

## 🔄 **PADRÕES DE DESENVOLVIMENTO**

### **Configuração de Ambiente:**
- **Desenvolvimento:** Detecção automática via `localhost`
- **Produção:** Detecção via `atendeai.lify.com.br`
- **Staging:** Suporte a domínios Railway

### **Error Handling:**
- **Frontend:** React Error Boundaries
- **Backend:** Middleware centralizado
- **OAuth:** Tratamento específico por tipo de erro

### **Logging & Debug:**
- **Desenvolvimento:** Console logs detalhados
- **Produção:** Winston logger estruturado
- **OAuth:** Painel de debug dedicado

---

## 🚀 **DEPLOYMENT & CI/CD**

### **Frontend:**
- **Build:** `npm run build`
- **Deploy:** Automático via Railway/Vercel

### **Backend:**
- **Deploy:** Railway continuous deployment
- **Health Check:** `/health` endpoint

### **Edge Functions:**
- **Deploy:** `supabase functions deploy <function-name>`
- **Environment:** Variáveis no Supabase Dashboard

---

## 📊 **MÉTRICAS E MONITORAMENTO**

### **Endpoints de Métricas:**
- `/api/metrics/track` - Rastreamento de eventos
- `/api/metrics/appointments` - Dados agregados

### **Health Checks:**
- `/health` - Status geral do sistema
- OAuth Debug Panel - Validação em tempo real

---

## 🔧 **CONFIGURAÇÕES CRÍTICAS**

### **Variáveis de Ambiente Supabase:**
```
GOOGLE_CLIENT_SECRET=<secret_from_google_cloud>
```

### **URLs Autorizadas Google Cloud Console:**
```
https://atendeai.lify.com.br/agendamentos
http://localhost:8080/agendamentos
```

### **Client ID Google:**
```
367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
```

---

## 📝 **DECISÕES ARQUITETURAIS RECENTES**

### **2025-01-18: Correção OAuth em Produção**

**Problema:** Sistema redirecionando para localhost em produção
**Solução Implementada:**
1. **Detecção automática de ambiente** baseada no hostname
2. **Edge Function Supabase** para troca segura de tokens
3. **Painel de debug** para validação e troubleshooting
4. **Documentação completa** com guias passo-a-passo

**Impacto:**
- ✅ OAuth funciona automaticamente em qualquer ambiente
- ✅ Debugging simplificado para desenvolvedores
- ✅ Maior segurança com Edge Functions
- ✅ Experiência do usuário melhorada

**Arquivos Principais Modificados:**
- `src/config/environment.ts` - Detecção de ambiente
- `src/config/frontend-config.ts` - URLs dinâmicas  
- `supabase/functions/google-user-auth/` - Edge Function completa
- `src/components/agendamentos/OAuthDebugPanel.tsx` - Debug tools

---

## 🎯 **PRÓXIMAS EVOLUÇÕES SUGERIDAS**

### **Curto Prazo:**
- Testes automatizados para Edge Functions
- Monitoramento de performance OAuth
- Cache inteligente de tokens

### **Médio Prazo:**
- Multi-provider OAuth (Microsoft, Apple)
- Webhooks Google Calendar para sync em tempo real
- Dashboard de analytics avançado

### **Longo Prazo:**
- Microserviços para escalabilidade
- IA on-premise para maior privacidade
- Marketplace de integrações

---

**Última Atualização:** 2025-01-18
**Versão do Sistema:** 1.0.0
**Responsável:** AtendeAI Team
