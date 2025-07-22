# COMANDOS DE TESTE - QR CODE INVÁLIDO

## 🔧 COMANDOS PARA DIAGNÓSTICO

### 1. Verificar Status do Backend
```bash
# Verificar se o processo está rodando
pm2 status

# Ver logs do backend
pm2 logs atendeai-backend --lines 50

# Ver logs em tempo real
pm2 logs atendeai-backend --follow
```

### 2. Testar Endpoint do Backend Diretamente
```bash
# Testar health check
curl http://31.97.241.19:3001/health

# Testar geração de QR Code
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}'

# Testar status
curl -X POST http://31.97.241.19:3001/api/whatsapp/status \
  -H "Content-Type: application/json" \
  -d '{"agentId": "8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b", "whatsappNumber": "5511999999999", "connectionId": "temp-123"}'
```

### 3. Testar Supabase Function
```bash
# Testar função de geração de QR
curl -X POST https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/generate-qr \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}'
```

### 4. Verificar Configuração do Sistema
```bash
# Verificar variáveis de ambiente
echo $WHATSAPP_SERVER_URL
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Verificar arquivos de configuração
cat .env.production
cat src/config/environment.ts
```

### 5. Testar Baileys Localmente
```bash
# Entrar no diretório do projeto
cd atendeai-lify-admin

# Instalar dependências se necessário
npm install

# Testar Baileys diretamente
node -e "
const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function testBaileys() {
  try {
    console.log('Testando Baileys...');
    const { version } = await fetchLatestBaileysVersion();
    console.log('Versão Baileys:', version);
    
    const sessionDir = './test-session';
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: true,
      browser: ['Test Baileys', 'Chrome', '1.0.0']
    });
    
    sock.ev.on('connection.update', (update) => {
      console.log('Connection update:', update);
    });
    
    console.log('Baileys inicializado com sucesso');
  } catch (error) {
    console.error('Erro no Baileys:', error);
  }
}

testBaileys();
"
```

## 🧪 TESTES ESPECÍFICOS

### Teste 1: Verificar se Baileys está funcionando
```bash
# Executar teste Baileys
node test-baileys.js
```

### Teste 2: Verificar QR Code gerado
```bash
# Decodificar QR Code para ver o conteúdo
# Usar ferramenta online: https://www.qr-code-generator.com/qr-code-scanner/
```

### Teste 3: Verificar formato do QR Code
```bash
# QR Code válido deve conter dados do WhatsApp
# QR Code inválido contém: whatsapp://connect?...
```

## 📊 ANÁLISE DOS RESULTADOS

### Se Baileys falhar:
1. Verificar Puppeteer
2. Verificar dependências
3. Verificar configurações de browser
4. Implementar retry automático

### Se QR Code for inválido:
1. Corrigir função `generateSimpleQRCode()`
2. Implementar formato válido
3. Usar API oficial do WhatsApp

### Se comunicação falhar:
1. Verificar CORS
2. Verificar SSL/HTTPS
3. Verificar timeouts
4. Verificar variáveis de ambiente

## 🎯 PRÓXIMOS PASSOS

1. **Executar comandos de teste**
2. **Analisar logs do backend**
3. **Identificar ponto de falha**
4. **Implementar correção**
5. **Testar novamente**

---

**Comandos preparados para diagnóstico completo do sistema** 