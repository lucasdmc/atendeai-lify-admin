# 🚀 AtendeAí Backend - Railway Deployment

## 📋 **DESCRIÇÃO**

Backend do sistema AtendeAí para WhatsApp com IA contextualizada para a CardioPrime Blumenau.

## 🏗️ **ARQUITETURA**

```
atendeai-backend/
├── server.js                 # Servidor principal
├── package.json             # Dependências e scripts
├── railway.json             # Configuração Railway
├── Procfile                 # Processo principal
├── env.example              # Variáveis de ambiente
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── llmOrchestratorService.js
│   │   │   └── clinicContextService.js
│   │   └── supabaseService.js
│   ├── config/
│   │   └── cardioprime-blumenau.json
│   └── routes/
│       └── webhook.js
└── test-railway-deployment.js
```

## 🚀 **DEPLOYMENT RAILWAY**

### **1. Configuração Inicial**

1. **Criar projeto Railway:**
   - Acesse https://railway.app
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"

2. **Conectar repositório:**
   - Selecione este repositório
   - Configure branch principal (main/master)

### **2. Variáveis de Ambiente**

Configure as seguintes variáveis no Railway Dashboard:

```bash
# Ambiente
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# OpenAI
OPENAI_API_KEY=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

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=EAASAuWYr9JgBPMxLKIoZCYAfUOWrj721aw1HMLK5ZBUBJOAPpB2k3as1Nj2bmJskjiBZCh8szn7ajR7Ic2OsnJSZCJIuz9eD2wk1wL7cWnZBv3jBaZA56ZCH48ngQ6VRZBjXZAlnancYdrdag1UougDbyZCemhIhE9MchQ0pS1hXCwhZCKytYpPPocgqf1sFlFt2iGZAnxFB5alHzVTZCw2172NnZBB2qtjgXkikTTRopth8mxB7mvdI4yqk3dficzsAZDZD
WHATSAPP_META_PHONE_NUMBER_ID=698766983327246

# Clínica
DEFAULT_CLINIC_ID=cardioprime_blumenau_2024
```

### **3. Endpoints Disponíveis**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/` | GET | Status do servidor |
| `/health` | GET | Health check |
| `/webhook/whatsapp-meta` | POST | Webhook WhatsApp |
| `/api/ai/process` | POST | Processamento AI |

### **4. Testes**

```bash
# Teste local
npm test

# Teste Railway
node test-railway-deployment.js
```

## 🏥 **CONTEXTUALIZAÇÃO CARDIOPRIME**

O sistema usa dados reais da CardioPrime Blumenau:

- **Localização**: Hospital Santa Catarina, Blumenau/SC
- **Telefone**: (47) 3231-0200
- **WhatsApp**: (47) 99999-7777
- **Profissionais**: Dr. Roberto Silva, Dra. Maria Fernanda
- **Preços**: Consulta R$ 300,00, Ecocardiograma R$ 250,00, etc.

## 🔧 **DESENVOLVIMENTO**

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Produção
npm start

# Testes
npm test
```

## 📊 **MONITORAMENTO**

- **Logs**: Acessíveis via Railway Dashboard
- **Health Check**: `/health` endpoint
- **Métricas**: Railway Analytics
- **Alertas**: Configuráveis no Railway

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns:**

1. **Erro 502 Bad Gateway:**
   - Verificar logs no Railway Dashboard
   - Confirmar variáveis de ambiente
   - Testar health check

2. **Erro de OpenAI:**
   - Verificar OPENAI_API_KEY
   - Confirmar créditos da conta

3. **Erro de WhatsApp:**
   - Verificar WHATSAPP_META_ACCESS_TOKEN
   - Confirmar webhook URL no Meta

4. **Erro de Supabase:**
   - Verificar SUPABASE_URL e SUPABASE_ANON_KEY
   - Confirmar conectividade

## 📞 **SUPORTE**

- **Logs**: Railway Dashboard → Logs
- **Variáveis**: Railway Dashboard → Variables
- **Deploy**: Railway Dashboard → Deployments
- **Domínio**: Railway Dashboard → Settings → Domains

---

**Versão:** 2.0.0  
**Última atualização:** Agosto 2024  
**Status:** ✅ Pronto para Railway 