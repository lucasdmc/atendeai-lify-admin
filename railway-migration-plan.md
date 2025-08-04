# 🚀 PLANO DE MIGRAÇÃO: VPS → RAILWAY

## 📋 **ANÁLISE ATUAL**

### Problemas do VPS:
- ❌ Erros de sintaxe persistentes
- ❌ Dificuldade para atualizar arquivos via SSH
- ❌ Problemas de permissão e acesso
- ❌ Instabilidade no deployment
- ❌ Logs truncados e difíceis de debugar
- ❌ Falta de CI/CD automatizado

### Vantagens do Railway:
- ✅ Deploy automático via Git
- ✅ Logs completos e em tempo real
- ✅ Rollback fácil
- ✅ Variáveis de ambiente seguras
- ✅ SSL automático
- ✅ Escalabilidade automática
- ✅ Integração com GitHub

## 🎯 **ESTRATÉGIA DE MIGRAÇÃO**

### **FASE 1: PREPARAÇÃO DO CÓDIGO**

#### 1.1 Estrutura do Projeto Railway
```
atendeai-backend/
├── package.json
├── railway.json (configuração Railway)
├── Procfile (processo principal)
├── .env.example
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── enhancedAIService.js
│   │   │   └── clinicContextService.js
│   │   └── supabaseService.js
│   ├── config/
│   │   └── cardioprime-blumenau.json
│   └── routes/
│       └── webhook.js
├── server.js
└── README.md
```

#### 1.2 Configurações Necessárias

**package.json:**
```json
{
  "name": "atendeai-backend",
  "version": "2.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "node test-integrated-system.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**railway.json:**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Procfile:**
```
web: npm start
```

### **FASE 2: CONFIGURAÇÃO DE AMBIENTE**

#### 2.1 Variáveis de Ambiente Railway
```bash
# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-...

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=EAASAuWYr9JgBPMxLKIoZCYAfUOWrj721aw1HMLK5ZBUBJOAPpB2k3as1Nj2bmJskjiBZCh8szn7ajR7Ic2OsnJSZCJIuz9eD2wk1wL7cWnZBv3jBaZA56ZCH48ngQ6VRZBjXZAlnancYdrdag1UougDbyZCemhIhE9MchQ0pS1hXCwhZCKytYpPPocgqf1sFlFt2iGZAnxFB5alHzVTZCw2172NnZBB2qtjgXkikTTRopth8mxB7mvdI4yqk3dficzsAZDZD

# Ambiente
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Clínica
DEFAULT_CLINIC_ID=cardioprime_blumenau_2024
```

#### 2.2 Health Check Endpoint
```javascript
// Adicionar ao server.js
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV
  });
});
```

### **FASE 3: DEPLOYMENT AUTOMÁTICO**

#### 3.1 Integração GitHub → Railway
1. Conectar repositório GitHub ao Railway
2. Configurar branch principal (main/master)
3. Ativar deploy automático
4. Configurar webhook para Railway

#### 3.2 Pipeline de Deploy
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          service: atendeai-backend
```

### **FASE 4: TESTES E VALIDAÇÃO**

#### 4.1 Testes Automatizados
```javascript
// test-railway-deployment.js
const axios = require('axios');

async function testRailwayDeployment() {
  const RAILWAY_URL = process.env.RAILWAY_URL || 'https://atendeai-backend-production.up.railway.app';
  
  try {
    // Teste de health check
    const health = await axios.get(`${RAILWAY_URL}/health`);
    console.log('✅ Health check:', health.data);
    
    // Teste de webhook
    const webhookTest = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, {
      object: "whatsapp_business_account",
      entry: [{
        id: "test",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "5511999999999",
              phone_number_id: "test"
            },
            contacts: [{
              profile: { name: "Test" },
              wa_id: "5511999999999"
            }],
            messages: [{
              from: "5511999999999",
              id: "test",
              timestamp: "1704067200",
              text: { body: "Teste Railway" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    });
    
    console.log('✅ Webhook test:', webhookTest.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRailwayDeployment();
```

### **FASE 5: MIGRAÇÃO DE DADOS**

#### 5.1 Backup do VPS Atual
```bash
# Backup das variáveis de ambiente
ssh root@api.atendeai.lify.com.br "cd /root/atendeai-lify-backend && cat .env" > vps-env-backup.txt

# Backup dos logs
ssh root@api.atendeai.lify.com.br "pm2 logs atendeai-backend --lines 100" > vps-logs-backup.txt
```

#### 5.2 Transferência de Configurações
1. Copiar variáveis de ambiente para Railway
2. Verificar conectividade com Supabase
3. Testar WhatsApp Meta API
4. Validar contextualização JSON

### **FASE 6: CUTOVER E MONITORAMENTO**

#### 6.1 Plano de Cutover
1. **Preparação (1 hora antes):**
   - Backup final do VPS
   - Notificar equipe
   - Preparar rollback

2. **Execução (15 minutos):**
   - Ativar Railway deployment
   - Testar endpoints críticos
   - Verificar logs em tempo real

3. **Validação (30 minutos):**
   - Testes de webhook
   - Verificar AI responses
   - Validar contextualização

4. **Monitoramento (24h):**
   - Logs Railway
   - Métricas de performance
   - Alertas de erro

#### 6.2 Rollback Plan
```bash
# Se necessário, voltar ao VPS
ssh root@api.atendeai.lify.com.br "pm2 restart atendeai-backend"
```

## 🎯 **BENEFÍCIOS ESPERADOS**

### ✅ **Estabilidade**
- Deploy automático e confiável
- Rollback instantâneo
- Logs completos e acessíveis

### ✅ **Desenvolvimento**
- CI/CD integrado
- Preview deployments
- Branch deployments

### ✅ **Operação**
- Monitoramento automático
- Escalabilidade automática
- SSL automático

### ✅ **Manutenção**
- Atualizações via Git push
- Variáveis de ambiente seguras
- Backup automático

## 📋 **CHECKLIST DE MIGRAÇÃO**

### [ ] Preparação
- [ ] Criar conta Railway
- [ ] Conectar repositório GitHub
- [ ] Configurar variáveis de ambiente
- [ ] Preparar arquivos de configuração

### [ ] Deployment
- [ ] Primeiro deploy Railway
- [ ] Testar health check
- [ ] Validar webhook
- [ ] Testar AI responses

### [ ] Validação
- [ ] Testes de contextualização
- [ ] Verificar WhatsApp integration
- [ ] Validar logs e monitoramento
- [ ] Testes de carga

### [ ] Cutover
- [ ] Ativar Railway como principal
- [ ] Atualizar DNS/webhook URLs
- [ ] Monitorar 24h
- [ ] Desativar VPS (opcional)

## 🚀 **PRÓXIMOS PASSOS**

1. **Criar projeto Railway**
2. **Configurar repositório GitHub**
3. **Preparar arquivos de configuração**
4. **Fazer primeiro deploy**
5. **Testar e validar**
6. **Executar cutover**

---

**Tempo estimado:** 2-3 horas
**Risco:** Baixo (Railway é muito confiável)
**Benefício:** Estabilidade e facilidade de manutenção 