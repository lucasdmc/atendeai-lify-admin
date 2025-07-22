# 🚨 SOLUÇÃO RÁPIDA - ERRO SSL

## ❌ Problema Identificado

O frontend está tentando acessar **HTTPS** em vez de **HTTP**, causando erro SSL.

## ✅ Solução Imediata

### **Passo 1: Acessar Dashboard do Lify**
1. **Acesse**: https://lify.com.br
2. **Faça login** na sua conta
3. **Selecione o projeto**: `atendeai-lify-admin`

### **Passo 2: Configurar Variáveis de Ambiente**
1. **Vá para**: Configurações → Variáveis de Ambiente
2. **DELETE** as seguintes variáveis se existirem:
   - `VITE_WHATSAPP_SERVER_URL` (se estiver como HTTPS)
   - `VITE_BACKEND_URL` (se estiver como HTTPS)

3. **ADICIONE** as seguintes variáveis:
   ```
   VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001
   VITE_BACKEND_URL=http://31.97.241.19:3001
   ```

### **Passo 3: Fazer Deploy Forçado**
1. **Vá para**: Deploy
2. **Clique em**: "Force Deploy"
3. **Aguarde** 3-5 minutos para o processamento

### **Passo 4: Limpar Cache do Navegador**
1. **Pressione**: `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac)
2. **Ou abra**: DevTools → Network → Disable cache

## 🧪 Teste Após Deploy

### **1. Acesse o Frontend**
```
https://atendeai.lify.com.br
```

### **2. Teste a Geração de QR Code**
1. **Faça login** no sistema
2. **Vá para**: Agentes de IA → Lucas2 → WhatsApp → Gerar QR Code
3. **Verifique se**:
   - ✅ QR Code aparece sem erros
   - ❌ Não há erros de CORS no console
   - ❌ Não há erros de certificado SSL

### **3. Verifique o Console do Navegador**
1. **Abra DevTools** (F12)
2. **Vá para a aba Console**
3. **Procure por erros**:
   - ❌ `Fetch API cannot load https://31.97.241.19:3001`
   - ❌ `access control checks`
   - ❌ `certificate` ou `SSL`
   - ✅ Requisições para `http://31.97.241.19:3001`

## 🔍 Verificação de Sucesso

### ✅ Sinais de Sucesso
- QR Code gera e exibe corretamente
- Status da conexão atualiza em tempo real
- Mensagens são enviadas sem erros
- Console não mostra erros de CORS ou SSL
- Requisições HTTP bem-sucedidas

### ❌ Sinais de Problema
- Erros de CORS no console
- Erros de certificado SSL
- QR Code não aparece
- Mensagens não são enviadas
- Requisições HTTPS falhando

## 🛠️ Comandos de Diagnóstico

### Testar Servidor HTTP
```bash
curl http://31.97.241.19:3001/health
```

### Testar Frontend
```bash
curl -I https://atendeai.lify.com.br
```

## 🔧 Se Ainda Houver Problemas

### **1. Verificar Servidor na VPS**
```bash
# Conectar na VPS
ssh root@31.97.241.19

# Verificar se o servidor está rodando
pm2 status

# Se não estiver, reiniciar:
pm2 restart atendeai-backend
```

### **2. Verificar Logs**
```bash
# Na VPS
pm2 logs atendeai-backend
```

### **3. Forçar Deploy Manual**
Se o deploy automático não funcionar:
1. **Acesse**: https://lify.com.br
2. **Faça login** na sua conta
3. **Selecione o projeto**: `atendeai-lify-admin`
4. **Vá para**: Arquivos
5. **Faça upload** da pasta `dist/`
6. **Configure as variáveis de ambiente**:
   ```
   VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001
   VITE_BACKEND_URL=http://31.97.241.19:3001
   ```
7. **Clique em**: "Deploy" ou "Force Deploy"

## 📊 Status Esperado

### Configuração Correta
- **Frontend**: HTTPS (atendeai.lify.com.br)
- **Backend**: HTTP (31.97.241.19:3001)
- **Comunicação**: HTTP direta
- **CORS**: Configurado corretamente

### Funcionalidades
- ✅ Geração de QR Code
- ✅ Status de conexão
- ✅ Envio de mensagens
- ✅ Recebimento de mensagens
- ✅ Respostas automáticas

---

**Status**: 🔧 Correção necessária  
**Tempo estimado**: 5-10 minutos  
**Próximo passo**: Configurar variáveis no Lify 