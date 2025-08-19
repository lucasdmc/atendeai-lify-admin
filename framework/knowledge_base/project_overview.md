# 📖 PROJECT OVERVIEW - AtendeAI Lify Admin

## 🎯 **VISÃO GERAL DO PROJETO**

**Nome:** AtendeAI Lify Admin
**Tipo:** Sistema de IA para Atendimento WhatsApp + Google Calendar
**Versão:** 1.0.0
**Última Atualização:** 2025-01-18

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### **Padrão Arquitetural:** 
- **Frontend:** SPA (Single Page Application) 
- **Backend:** API REST + Edge Functions
- **Database:** PostgreSQL (Supabase)
- **Deploy:** Híbrido (Railway + Supabase)

### **Tecnologias Principais:**
```
Frontend:  React 18 + TypeScript + Vite + TailwindCSS
Backend:   Node.js + Express + Google APIs
Database:  Supabase (PostgreSQL)
Edge:      Supabase Functions (Deno)
IA:        OpenAI GPT-4o + Anthropic Claude
WhatsApp:  Meta API
Calendar:  Google Calendar API v3
```

---

## 📂 **ESTRUTURA DE ARQUIVOS**

### **Frontend (`src/`):**
```
components/
├── agendamentos/     # Google Calendar integration
├── clinics/          # Multi-clinic management  
├── conversations/    # WhatsApp chat interface
├── ui/              # Reusable UI components (Radix)
└── users/           # User management

config/              # Environment configurations
hooks/               # Custom React hooks  
pages/               # Main application pages
services/            # External API integrations
types/               # TypeScript definitions
```

### **Backend (`routes/`, `services/`):**
```
routes/
├── google.js        # Google Calendar OAuth routes
├── whatsapp.js      # WhatsApp API routes  
└── webhook-final.js # WhatsApp webhook handler

services/core/
├── googleCalendarService.js    # Calendar operations
├── llmOrchestratorService.js  # AI orchestration
└── clinicContextManager.js   # Multi-clinic logic
```

### **Edge Functions (`supabase/functions/`):**
```
google-user-auth/    # OAuth token exchange
├── index.ts         # Main function
├── README.md        # Documentation
└── .edge-runtime    # Deno configuration
```

---

## 🔄 **FLUXOS PRINCIPAIS**

### **1. Autenticação Google Calendar:**
```
Usuário → Frontend → Google OAuth → Edge Function → Tokens → Database
```

### **2. Agendamento via WhatsApp:**
```
WhatsApp → Webhook → IA → Google Calendar API → Confirmação
```

### **3. Gestão Multi-Clínicas:**
```
Seleção Clínica → Filtros → Calendários Específicos → Contexto IA
```

---

## 🎨 **PADRÕES DE DESIGN**

### **UI/UX:**
- **Design System:** Radix UI + TailwindCSS
- **Tema:** Clean, minimalista, foco em usabilidade médica
- **Responsividade:** Mobile-first approach
- **Acessibilidade:** ARIA compliance via Radix

### **Componentes:**
- **Atomic Design:** Atoms → Molecules → Organisms
- **Reutilização:** Componentes genéricos em `/ui/`
- **Especialização:** Componentes específicos por feature

---

## 🔐 **SEGURANÇA E AUTENTICAÇÃO**

### **OAuth 2.0 Flow:**
```typescript
// Detecção automática de ambiente
if (hostname === 'atendeai.lify.com.br') {
  redirectUri = 'https://atendeai.lify.com.br/agendamentos';
} else {
  redirectUri = 'http://localhost:8080/agendamentos';  
}
```

### **Princípios de Segurança:**
- **Client Secret:** Apenas em Edge Functions (nunca no frontend)
- **Tokens:** Armazenados encrypted no Supabase
- **CORS:** Configurado restritivamente
- **Rate Limiting:** Middleware inteligente

---

## 📊 **BANCO DE DADOS**

### **Tabelas Principais:**
```sql
clinics                          -- Dados das clínicas
users                           -- Usuários do sistema  
google_calendar_tokens_by_clinic -- Tokens OAuth por clínica
clinic_calendars                -- Associação clínica ↔ calendários
conversations                   -- Histórico WhatsApp
user_calendars                  -- Calendários do usuário
```

### **Relacionamentos:**
- **1:N** - Clínica → Calendários
- **1:N** - Usuário → Tokens  
- **N:M** - Clínicas ↔ Calendários (junction table)

---

## 🤖 **SISTEMA DE IA**

### **Orquestração:**
```typescript
LLMOrchestratorService {
  - processMessage()     // Entrada principal
  - detectIntent()       // Análise de intenção
  - generateResponse()   // Resposta contextual
  - executeTools()       // Google Calendar actions
}
```

### **Contexto Multi-Clínica:**
- **Personalização:** Prompt específico por clínica
- **Memória:** Contexto de conversação persistente
- **Tools:** Agendamento, consulta, cancelamento

---

## 🔧 **CONFIGURAÇÃO E DEPLOY**

### **Variáveis de Ambiente:**

**Frontend (Vite):**
```env
VITE_GOOGLE_CLIENT_ID=367439444210-...
VITE_GOOGLE_REDIRECT_URI=auto-detect
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_BACKEND_URL=https://atendeai-lify-backend-production.up.railway.app
```

**Edge Functions (Supabase):**
```env
GOOGLE_CLIENT_SECRET=<secret_from_google_cloud>
```

### **Deploy Process:**
1. **Frontend:** Build → Railway/Vercel
2. **Backend:** Railway continuous deployment  
3. **Edge Functions:** `supabase functions deploy`

---

## 📱 **CASOS DE USO PRINCIPAIS**

### **1. Médico/Clínica:**
- Configurar integração Google Calendar
- Gerenciar múltiplas clínicas
- Monitorar conversas WhatsApp
- Validar agendamentos

### **2. Paciente (via WhatsApp):**
- Solicitar agendamento
- Consultar horários disponíveis  
- Confirmar/cancelar consultas
- Receber lembretes

### **3. Administrador:**
- Gestão de usuários
- Configuração de clínicas
- Monitoramento de métricas
- Troubleshooting OAuth

---

## 🛠️ **FERRAMENTAS DE DESENVOLVIMENTO**

### **Debug & Monitoring:**
```typescript
// OAuth Debug Panel (desenvolvimento)
OAuthDebugPanel {
  - validateConfig()      // Verificação automática
  - testEdgeFunction()    // Teste em tempo real
  - showEnvironmentInfo() // Informações de ambiente
}
```

### **Logging:**
- **Frontend:** Console logs (dev) → Structured logs (prod)
- **Backend:** Winston logger com trace IDs
- **Edge Functions:** Supabase logs

---

## 🚀 **COMANDOS ÚTEIS**

### **Desenvolvimento:**
```bash
# Frontend
npm run dev                    # Servidor desenvolvimento
npm run build                 # Build para produção

# Edge Functions  
supabase functions deploy google-user-auth
supabase functions logs google-user-auth

# Backend
npm start                      # Servidor Express
npm run test                   # Testes unitários
```

### **Debug OAuth:**
```bash
# Verificar configuração
curl https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth

# Logs em tempo real
supabase functions logs google-user-auth --follow
```

---

## 🎯 **MÉTRICAS DE SUCESSO**

### **Performance:**
- **OAuth Flow:** < 5s para completar
- **API Response:** < 2s médio  
- **Calendar Sync:** < 3s para listar eventos

### **Funcional:**
- **Taxa de Sucesso OAuth:** > 95%
- **Agendamentos Automatizados:** > 80%
- **Satisfação Usuário:** > 4.5/5

---

## 📚 **DOCUMENTAÇÃO RELACIONADA**

- **Especificação Técnica:** `framework/runtime/specification.md`
- **Contexto do Sistema:** `framework/knowledge_base/CONTEXT.md`  
- **Setup OAuth:** `GOOGLE_OAUTH_SETUP_INSTRUCTIONS.md`
- **Edge Function:** `supabase/functions/google-user-auth/README.md`

---

## 💡 **DICAS PARA NOVOS DESENVOLVEDORES**

### **Primeira Execução:**
1. Clone o repositório
2. Configure variáveis de ambiente
3. Execute `npm install`
4. Execute `npm run dev`
5. Configure OAuth no Google Cloud Console

### **Debugging OAuth:**
1. Use o painel de debug na página `/agendamentos`
2. Verifique logs da Edge Function no Supabase
3. Valide URLs no Google Cloud Console
4. Confirme Client Secret configurado

### **Estrutura de Branches:**
- `main` - Produção estável
- `develop` - Features em desenvolvimento  
- `feature/*` - Features específicas
- `hotfix/*` - Correções urgentes

---

**Criado:** 2025-01-18  
**Responsável:** Framework Development Team
**Próxima Revisão:** 2025-02-18
