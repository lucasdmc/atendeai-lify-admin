# 🔄 GUIA VISUAL: Atualizar Token no Railway

## 📋 **PASSO A PASSO VISUAL**

### **1. Acessar Railway Dashboard**
```
🌐 URL: https://railway.app/dashboard
👤 Faça login com sua conta
```

### **2. Selecionar Projeto**
```
📁 Projeto: atendeai-lify-backend
📍 Localização: Dashboard principal
```

### **3. Acessar Variables**
```
⚙️ Menu: Variables (aba lateral)
🔧 Seção: Environment Variables
```

### **4. Encontrar Variável**
```
🔍 Procurar por: WHATSAPP_META_ACCESS_TOKEN
✏️ Ação: Clique em "Edit"
```

### **5. Atualizar Token**
```
📝 Campo: WHATSAPP_META_ACCESS_TOKEN
📋 Valor atual: (token antigo)
🔄 Novo valor: (cole o token abaixo)
```

## 🔑 **NOVO TOKEN PARA COLEAR:**

```
EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD
```

### **6. Salvar Alterações**
```
💾 Botão: "Save"
⏳ Aguardar: Deploy automático (1-2 minutos)
```

## 🧪 **VERIFICAÇÃO APÓS ATUALIZAÇÃO**

### **Teste 1: Verificar Webhook**
```bash
curl https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta
# Deve retornar: OK
```

### **Teste 2: Testar Processamento**
```bash
curl -X POST "https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "698766983327246",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "+55 47 3091-5628",
            "phone_number_id": "698766983327246"
          },
          "contacts": [{
            "profile": {"name": "Teste"},
            "wa_id": "5511999999999"
          }],
          "messages": [{
            "from": "5511999999999",
            "id": "wamid.test",
            "timestamp": "1704067200",
            "text": {"body": "Olá, teste com novo token"},
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### **Teste 3: Mensagem Real**
```
📱 WhatsApp: Envie mensagem para +55 47 3091-5628
✅ Verifique: Se recebe resposta automática
📊 Logs: Confirme em https://railway.app/dashboard
```

## 📊 **LOGS ESPERADOS**

Quando uma mensagem chegar, você deve ver nos logs:
```
🚨 [Webhook-Contextualizado] WEBHOOK CHAMADO!
[Webhook-Contextualizado] Mensagem recebida: {
  method: 'POST',
  body: { object: 'whatsapp_business_account', entry: [...] }
}
[Webhook-Contextualizado] Processamento concluído com sucesso
```

## ✅ **RESULTADO ESPERADO**

Após atualizar o token:
- ✅ WhatsApp responderá automaticamente
- ✅ AI processará mensagens
- ✅ Sistema funcionará 24/7
- ✅ Respostas contextualizadas

## 🚨 **IMPORTANTE**

1. **Aguarde o deploy**: 1-2 minutos após salvar
2. **Teste sempre**: Verifique se está funcionando
3. **Monitore logs**: Para detectar problemas
4. **Backup**: Guarde o token antigo por segurança

## 🎯 **PRÓXIMOS PASSOS**

1. ✅ Atualizar token no Railway
2. ⏳ Aguardar deploy
3. 🧪 Testar webhook
4. 📱 Enviar mensagem real
5. 📊 Verificar logs
6. ✅ Confirmar funcionamento

**🎉 Após seguir estes passos, o WhatsApp estará funcionando perfeitamente!** 