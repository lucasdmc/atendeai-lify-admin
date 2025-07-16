# 📦 Pacote de Análise para Claude Opus - Erro 500 WhatsApp

## 🎯 Problema Principal
**Erro 500 "Conexão não autorizada ou encerrada"** ao gerar QR Code via Edge Function do Supabase, enquanto testes diretos via curl funcionam perfeitamente.

## 📋 Arquivos para Compartilhar com o Opus

### 1. **Configurações e Logs**
```
- scripts/debug-simple-vps.sh
- scripts/test-frontend-debug.sh  
- WHATSAPP_DEBUG_GUIDE.md
- VPS_DEPLOY_SUCCESS.md
- WHATSAPP_SERVER_MIGRATION.md
```

### 2. **Código do Backend (VPS)**
```
- /root/LifyChatbot-Node-Server/server.js (arquivo principal)
- /root/LifyChatbot-Node-Server/server.js.backup (backup original)
- Logs PM2: pm2 logs LifyChatbot-Node-Server --lines 100
```

### 3. **Código da Edge Function**
```
- supabase/functions/agent-whatsapp-manager/index.ts
- supabase/functions/agent-whatsapp-manager/generate-qr.ts
```

### 4. **Código do Frontend**
```
- src/hooks/whatsapp/useWhatsAppActions.tsx
- src/components/whatsapp/QRCodeDisplay.tsx
- src/services/aiChatService.ts
```

### 5. **Logs e Evidências**
```
- /tmp/whatsapp-requests.log (logs capturados)
- Network tab do browser (requisição que falha)
- Resposta do curl direto vs Edge Function
```

## 🔍 Contexto Detalhado

### **Infraestrutura:**
- **VPS**: atendeai.server.com.br (31.97.241.19)
- **Backend**: Node.js + PM2 (porta 3001)
- **Frontend**: React + Vite
- **Edge Function**: Supabase Functions

### **Evidências Atuais:**
✅ **Backend funciona perfeitamente:**
```bash
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test"}' 
# Retorna: {"success":true,"message":"QR Code gerado com sucesso",...}
```

❌ **Edge Function falha:**
```javascript
// Frontend chama Edge Function que chama backend
// Resultado: 500 "Conexão não autorizada ou encerrada"
```

### **Logs de Debug:**
- Logs foram adicionados ao endpoint `/api/whatsapp/generate-qr`
- Arquivo `/tmp/whatsapp-requests.log` existe mas vazio
- Nenhuma requisição da Edge Function foi capturada

## 🎯 Perguntas para o Opus

### 1. **Análise de Diferenças**
- "Compare requisições curl vs Edge Function"
- "Identifique diferenças em headers, body, timeout"
- "Analise possíveis problemas de autenticação"

### 2. **Debug de Rede**
- "Verifique se há problemas de CORS"
- "Analise timeouts entre Supabase e VPS"
- "Identifique bloqueios de firewall"

### 3. **Análise de Código**
- "Verifique serialização JSON"
- "Analise headers de autorização"
- "Identifique problemas de encoding"

### 4. **Soluções**
- "Sugira correções específicas"
- "Proponha testes adicionais"
- "Crie workarounds temporários"

## 📊 Dados Técnicos

### **Backend (VPS):**
- **Porta**: 3001
- **Processo**: PM2 LifyChatbot-Node-Server
- **Status**: Online (89.2mb RAM)
- **Endpoint**: `/api/whatsapp/generate-qr`

### **Edge Function:**
- **URL**: `https://SEU_PROJETO.supabase.co/functions/v1/agent-whatsapp-manager`
- **Timeout**: Padrão Supabase (10s)
- **Headers**: Authorization Bearer

### **Frontend:**
- **Framework**: React + TypeScript
- **Build**: Vite
- **Chamada**: Via Edge Function

## 🔧 Comandos para Coletar Dados

### **1. Logs do Backend:**
```bash
ssh root@31.97.241.19 "pm2 logs LifyChatbot-Node-Server --lines 100 > /tmp/backend-logs.txt"
```

### **2. Teste Edge Function:**
```bash
curl -X POST https://SEU_PROJETO.supabase.co/functions/v1/agent-whatsapp-manager \
  -H "Authorization: Bearer SEU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action": "generate-qr", "agentId": "test-opus"}'
```

### **3. Network Tab:**
- Abrir DevTools no browser
- Ir para Network tab
- Tentar gerar QR Code
- Salvar requisição que falha

## 📝 Checklist para Opus

- [ ] Compartilhar todos os arquivos de código
- [ ] Incluir logs detalhados do backend
- [ ] Adicionar evidências de erro 500
- [ ] Incluir configurações de rede
- [ ] Adicionar testes curl vs Edge Function
- [ ] Incluir contexto completo do problema

## 🎯 Resultado Esperado

O Opus deve:
1. **Identificar a causa raiz** do erro 500
2. **Comparar requisições** curl vs Edge Function
3. **Sugerir correções específicas**
4. **Propor testes adicionais**
5. **Criar soluções customizadas**

---

**Preparado para análise no Claude Opus**
**Data**: $(date)
**Problema**: Erro 500 WhatsApp Edge Function 