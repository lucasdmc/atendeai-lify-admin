# 🔄 GUIA CLI: Atualizar Token no Railway

## 📋 **OPÇÕES DISPONÍVEIS**

### **Opção 1: Railway CLI (Recomendado)**
```bash
# Executar script automatizado
./update-railway-simple.sh
```

### **Opção 2: Curl direto**
```bash
# Executar script com curl
./update-railway-curl.sh
```

### **Opção 3: Node.js interativo**
```bash
# Executar script Node.js
node update-railway-token-cli.js
```

## 🎯 **OPÇÃO 1: RAILWAY CLI (MAIS FÁCIL)**

### **Passo 1: Instalar Railway CLI**
```bash
npm install -g @railway/cli
```

### **Passo 2: Executar script**
```bash
./update-railway-simple.sh
```

### **O que o script faz:**
1. ✅ Verifica se o Railway CLI está instalado
2. ✅ Faz login no Railway
3. ✅ Lista projetos disponíveis
4. ✅ Atualiza a variável `WHATSAPP_META_ACCESS_TOKEN`
5. ✅ Confirma a atualização

## 🎯 **OPÇÃO 2: CURL DIRETO**

### **Passo 1: Obter token da API**
1. Acesse: https://railway.app/dashboard
2. Vá em: Settings → Tokens
3. Clique em "Create Token"
4. Copie o token (começa com `rw_...`)

### **Passo 2: Obter Project ID**
1. Acesse: https://railway.app/dashboard
2. Selecione: atendeai-lify-backend
3. Copie o Project ID da URL

### **Passo 3: Executar script**
```bash
./update-railway-curl.sh
```

### **O que o script faz:**
1. ✅ Solicita token da API do Railway
2. ✅ Solicita Project ID
3. ✅ Atualiza a variável via API
4. ✅ Confirma a atualização

## 🎯 **OPÇÃO 3: NODE.JS INTERATIVO**

### **Executar script**
```bash
node update-railway-token-cli.js
```

### **O que o script faz:**
1. ✅ Solicita token da API do Railway
2. ✅ Solicita Project ID
3. ✅ Atualiza a variável via API
4. ✅ Confirma a atualização

## 🧪 **TESTE APÓS ATUALIZAÇÃO**

### **Aguarde 2 minutos e execute:**
```bash
node test-railway-token.js
```

### **Teste manual:**
1. Abra o WhatsApp
2. Envie mensagem para: **+55 47 3091-5628**
3. Verifique se recebe resposta automática

## 📊 **LOGS ESPERADOS**

Quando uma mensagem real chegar, você deve ver nos logs:
```
🚨 [Webhook-Contextualizado] WEBHOOK CHAMADO!
[Webhook-Contextualizado] Configuração WhatsApp: { hasAccessToken: true, hasPhoneNumberId: true }
[Webhook-Contextualizado] Processamento concluído com sucesso
```

## ✅ **RESULTADO ESPERADO**

Após atualizar o token:
- ✅ WhatsApp responderá automaticamente
- ✅ AI processará mensagens
- ✅ Sistema funcionará 24/7
- ✅ Respostas contextualizadas

## 🚨 **IMPORTANTE**

1. **Aguarde o deploy**: 1-2 minutos após atualizar
2. **Teste sempre**: Verifique se está funcionando
3. **Monitore logs**: Para detectar problemas
4. **Backup**: Guarde o token antigo por segurança

## 🎉 **RECOMENDAÇÃO**

**Use a Opção 1 (Railway CLI)** - é a mais simples e automatizada!

```bash
./update-railway-simple.sh
```

**Tempo para resolver**: 2 minutos
**Dificuldade**: Baixa
**Resultado**: Sistema 100% funcional

## 📞 **SUPORTE**

Se precisar de ajuda:
1. Verifique se o token foi atualizado
2. Aguarde o deploy (1-2 minutos)
3. Teste com mensagem real
4. Verifique logs para confirmar

**🎯 Após executar qualquer uma das opções, o WhatsApp estará funcionando perfeitamente!** 