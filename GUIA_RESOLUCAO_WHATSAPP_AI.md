# 🔧 GUIA DE RESOLUÇÃO - WHATSAPP AI

## 📋 **PROBLEMA IDENTIFICADO**

O WhatsApp está respondendo sempre com a mesma mensagem sobre horários de funcionamento, indicando que:

1. ✅ **Webhook está funcionando** (recebe mensagens)
2. ❌ **AI não está sendo processada** (resposta padrão sempre igual)
3. ❌ **Sistema atual não usa nossa AI**

## 🎯 **SOLUÇÃO COMPLETA**

### **1. DEPLOY NA VPS**

Execute o script de deploy:

```bash
./scripts/deploy-vps-ai.sh
```

Este script irá:
- ✅ Fazer backup do sistema atual
- ✅ Atualizar o backend na VPS
- ✅ Instalar dependências
- ✅ Configurar variáveis de ambiente
- ✅ Reiniciar serviços
- ✅ Verificar funcionamento

### **2. CONFIGURAÇÃO DO WEBHOOK**

O webhook precisa ser configurado no WhatsApp Business:

1. **Acesse**: https://business.facebook.com/settings/system-users
2. **Vá em**: WhatsApp > API Setup
3. **Configure**:
   - **Webhook URL**: `https://api.atendeai.lify.com.br/webhook/whatsapp-meta`
   - **Verify Token**: `lify-analysa-waba-token`
   - **Campos**: `messages`, `message_deliveries`, `message_reads`

### **3. TESTE DO SISTEMA**

#### **Teste Local:**
```bash
# Verificar se o backend está rodando
curl http://localhost:3001/health

# Testar webhook
curl http://localhost:3001/webhook/whatsapp-meta/test

# Testar AI
curl -X POST http://localhost:3001/webhook/whatsapp-meta/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "oi",
    "clinicId": "test-clinic",
    "userId": "test-user"
  }'
```

#### **Teste em Produção:**
```bash
# Testar webhook
curl https://api.atendeai.lify.com.br/webhook/whatsapp-meta/test

# Testar AI
curl -X POST https://api.atendeai.lify.com.br/webhook/whatsapp-meta/test-send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "oi",
    "clinicId": "test-clinic",
    "userId": "test-user"
  }'
```

### **4. MONITORAMENTO**

#### **Ver logs da VPS:**
```bash
ssh root@31.97.241.19 'pm2 logs atendeai-backend'
```

#### **Verificar status dos serviços:**
```bash
ssh root@31.97.241.19 'pm2 status'
```

### **5. CONFIGURAÇÕES IMPORTANTES**

#### **Arquivo `.env` na VPS:**
```env
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=EAAQHxcv0eAQBPLPQ6S8BtBkHhaac73TbyZAMFGO0JGTxorkHdL6zSEEr...
WHATSAPP_META_PHONE_NUMBER_ID=711779288689748
WHATSAPP_META_BUSINESS_ID=1775269513072729
WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token

# IDs padrão
```

### **6. FUNCIONAMENTO ESPERADO**

Quando alguém enviar uma mensagem para o WhatsApp:

1. **WhatsApp envia** para o webhook
2. **AI processa** a mensagem (respostas variadas)
3. **Resposta melhorada** é enviada automaticamente
4. **Logs** são salvos no console

### **7. RESPOSTAS DA AI**

O sistema agora deve responder com mensagens variadas como:
- "Olá! Como posso ajudá-lo hoje?"
- "Oi! Em que posso ser útil?"
- "Olá! Estou aqui para ajudar. O que você precisa?"
- "Oi! Como posso te auxiliar?"
- "Olá! Em que posso te ajudar hoje?"

### **8. TROUBLESHOOTING**

#### **Se o webhook não funcionar:**
1. Verificar se a VPS está rodando
2. Verificar se o domínio está apontando para a VPS
3. Verificar logs: `pm2 logs atendeai-backend`

#### **Se a AI não responder:**
1. Verificar se o webhook está configurado corretamente
2. Verificar se as variáveis de ambiente estão corretas
3. Testar manualmente via curl

#### **Se ainda responder sempre igual:**
1. Verificar se o webhook antigo ainda está ativo
2. Desativar webhook antigo no WhatsApp Business
3. Ativar novo webhook com AI

## 🎯 **RESULTADO ESPERADO**

Após o deploy e configuração, você deve ver:
- ✅ Respostas variadas no WhatsApp
- ✅ Logs no console da VPS
- ✅ Melhor experiência do usuário
- ✅ Sistema AI funcionando

## 🚀 **PRÓXIMOS PASSOS**

1. **Execute o deploy**: `./scripts/deploy-vps-ai.sh`
2. **Configure o webhook** no WhatsApp Business
3. **Teste enviando uma mensagem** para o WhatsApp
4. **Verifique os logs** para confirmar funcionamento

**✅ Sistema pronto para melhorar as conversas do WhatsApp!** 