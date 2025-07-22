# 🚀 INSTRUÇÕES DE DEPLOY MANUAL - CORREÇÃO SSL

## ❌ Problema
O frontend está tentando acessar HTTPS em vez de HTTP, causando erro SSL.

## ✅ Solução Completa

### **Passo 1: Verificar Configurações (JÁ CORRETAS)**

✅ **lify.json** - Já configurado com HTTP:
```json
{
  "environment": {
    "VITE_WHATSAPP_SERVER_URL": "http://31.97.241.19:3001",
    "VITE_BACKEND_URL": "http://31.97.241.19:3001"
  }
}
```

✅ **lovable.json** - Já configurado com HTTP:
```json
{
  "environment": {
    "VITE_WHATSAPP_SERVER_URL": "http://31.97.241.19:3001",
    "VITE_BACKEND_URL": "http://31.97.241.19:3001"
  }
}
```

✅ **src/config/environment.ts** - Já configurado com HTTP:
```typescript
whatsapp: {
  serverUrl: import.meta.env.VITE_WHATSAPP_SERVER_URL || 'http://31.97.241.19:3001',
},
```

### **Passo 2: Limpar e Rebuildar**

```bash
# No terminal, no diretório do projeto
cd atendeai-lify-admin

# Limpar cache
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# Instalar dependências
npm install

# Fazer build
npm run build
```

### **Passo 3: Verificar Build**

Após o build, verifique se a pasta `dist/` foi criada:
```bash
ls -la dist/
```

### **Passo 4: Deploy Manual no Lify**

Como você não consegue acessar o dashboard, você pode:

#### **Opção A: Usar Git (se conectado)**
```bash
# Fazer commit das alterações
git add .
git commit -m "Fix: Update WhatsApp server URL to HTTP"
git push origin main
```

#### **Opção B: Upload Manual**
1. **Acesse**: https://lify.com.br
2. **Faça login** na sua conta
3. **Selecione o projeto**: `atendeai-lify-admin`
4. **Vá para**: Arquivos
5. **Faça upload** da pasta `dist/` (que foi criada no build)
6. **Configure as variáveis de ambiente**:
   ```
   VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001
   VITE_BACKEND_URL=http://31.97.241.19:3001
   ```
7. **Clique em**: "Deploy" ou "Force Deploy"

### **Passo 5: Configurar Variáveis de Ambiente**

No dashboard do Lify, configure as seguintes variáveis:

#### **DELETE estas variáveis se existirem:**
- `VITE_WHATSAPP_SERVER_URL` (se estiver como HTTPS)
- `VITE_BACKEND_URL` (se estiver como HTTPS)

#### **ADICIONE estas variáveis:**
```
VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001
VITE_BACKEND_URL=http://31.97.241.19:3001
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
NODE_ENV=production
```

### **Passo 6: Testar Após Deploy**

1. **Acesse**: https://atendeai.lify.com.br
2. **Limpe o cache do navegador**: `Ctrl+Shift+R`
3. **Teste a geração de QR Code**
4. **Verifique o console** (F12) para erros

## 🧪 Testes de Verificação

### **Teste 1: Servidor HTTP**
```bash
curl http://31.97.241.19:3001/health
```
**Resultado esperado**: `{"status":"ok",...}`

### **Teste 2: Frontend**
```bash
curl -I https://atendeai.lify.com.br
```
**Resultado esperado**: Status 200

### **Teste 3: QR Code**
```bash
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}'
```
**Resultado esperado**: `{"success":true,"message":"Cliente WhatsApp inicializado"}`

## 🔍 Verificação de Sucesso

### ✅ Sinais de Sucesso
- QR Code gera e exibe corretamente
- Status da conexão atualiza em tempo real
- Console não mostra erros de CORS ou SSL
- Requisições HTTP bem-sucedidas

### ❌ Sinais de Problema
- Erros de CORS no console
- Erros de certificado SSL
- QR Code não aparece
- Requisições HTTPS falhando

## 🛠️ Comandos Úteis

### **Para testar localmente:**
```bash
npm run dev
```

### **Para verificar status do servidor:**
```bash
ssh root@31.97.241.19 'pm2 status'
```

### **Para reiniciar servidor:**
```bash
ssh root@31.97.241.19 'pm2 restart atendeai-backend'
```

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
**Tempo estimado**: 10-15 minutos  
**Próximo passo**: Fazer build e deploy manual 