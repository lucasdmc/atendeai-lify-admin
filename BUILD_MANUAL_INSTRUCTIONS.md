# 🔨 BUILD MANUAL - ATENDEAI MVP 1.0

## ❌ **PROBLEMA IDENTIFICADO**
O build está falhando devido a problemas no `vite.config.ts` e possivelmente no cache.

## ✅ **SOLUÇÃO MANUAL**

### **Passo 1: Limpar Cache**
```bash
# No terminal, no diretório do projeto
cd atendeai-lify-admin

# Limpar cache
rm -rf dist
rm -rf .vite
rm -rf node_modules/.vite
```

### **Passo 2: Verificar vite.config.ts**
O arquivo deve estar assim:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name].[hash].js`,
        chunkFileNames: `[name].[hash].js`,
        assetFileNames: `[name].[hash].[ext]`
      }
    }
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify('1.0.0-ssl-fix')
  }
})
```

### **Passo 3: Build Direto**
```bash
# Tentar build direto com Vite
npx vite build
```

### **Passo 4: Se o build falhar, tentar:**
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Tentar build novamente
npm run build
```

### **Passo 5: Verificar Build**
```bash
# Verificar se a pasta dist foi criada
ls -la dist/
```

## 🚀 **DEPLOY NO LOVABLE**

### **Passo 1: Acessar Lovable**
1. Acesse: https://lify.com.br
2. Faça login na sua conta
3. Selecione o projeto: `atendeai-lify-admin`

### **Passo 2: Upload dos Arquivos**
1. Vá para a seção "Arquivos"
2. Faça upload da pasta `dist/` (criada após o build)
3. Aguarde o upload completar

### **Passo 3: Configurar Variáveis**
1. Vá para "Configurações" → "Variáveis de Ambiente"
2. **DELETE** estas variáveis se existirem:
   - `VITE_WHATSAPP_SERVER_URL` (se estiver como HTTPS)
   - `VITE_BACKEND_URL` (se estiver como HTTPS)
3. **ADICIONE** estas variáveis:
   ```
   VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001
   VITE_BACKEND_URL=http://31.97.241.19:3001
   VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
   VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
   NODE_ENV=production
   ```
4. Salve as configurações

### **Passo 4: Deploy**
1. Clique em "Deploy" ou "Force Deploy"
2. Aguarde o deploy completar
3. Verifique se não há erros

### **Passo 5: Teste**
1. Acesse: https://atendeai.lify.com.br
2. Limpe o cache: `Ctrl+Shift+R`
3. Teste a geração de QR Code
4. Verifique o console (F12) para erros

## 🧪 **TESTES DE VERIFICAÇÃO**

### **Teste 1: Servidor HTTP**
```bash
curl http://31.97.241.19:3001/health
```
**Resultado esperado**: `{"status":"ok",...}`

### **Teste 2: QR Code**
```bash
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}'
```
**Resultado esperado**: `{"success":true,"message":"Cliente WhatsApp inicializado"}`

## 🔧 **COMANDOS ÚTEIS**

### **Para build local:**
```bash
npx vite build
```

### **Para testar localmente:**
```bash
npm run dev
```

### **Para verificar status do servidor:**
```bash
ssh root@31.97.241.19 'pm2 status'
```

## 📊 **STATUS ATUAL**

### **✅ Configurações Corretas:**
- `lify.json` - HTTP configurado
- `lovable.json` - HTTP configurado
- `src/config/environment.ts` - HTTP configurado
- Dashboard do Lovable acessível

### **✅ Servidor Funcionando:**
- Backend: `http://31.97.241.19:3001` ✅
- QR Code: Gerando corretamente ✅
- Health Check: OK ✅

### **🔧 Próximo Passo:**
- Build e deploy no Lovable

---

**Status**: 🔧 Build necessário  
**Tempo estimado**: 10-15 minutos  
**Próximo passo**: Fazer build manual e deploy 