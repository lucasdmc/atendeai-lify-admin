#!/bin/bash

# Script para migrar o sistema AtendeAI para usar apenas Baileys
# Removendo WhatsApp Web.js e padronizando para Baileys

echo "🔄 MIGRANDO SISTEMA PARA BAILEYS"
echo "================================="

# 1. Fazer backup do servidor atual
echo "📦 Fazendo backup do servidor atual..."
if [ -f server.js ]; then
    cp server.js server.js.backup
    echo "✅ Backup criado: server.js.backup"
else
    echo "⚠️ server.js não encontrado"
fi

# 2. Copiar servidor Baileys para o diretório principal
echo "📋 Copiando servidor Baileys..."
if [ -f ../LifyChatbot-Node-Server/server.js ]; then
    cp ../LifyChatbot-Node-Server/server.js server.js
    echo "✅ Servidor Baileys copiado"
else
    echo "❌ Servidor Baileys não encontrado"
    exit 1
fi

# 3. Copiar package.json do Baileys se necessário
echo "📦 Verificando dependências..."
if [ -f ../LifyChatbot-Node-Server/package.json ]; then
    cp ../LifyChatbot-Node-Server/package.json package.json.baileys
    echo "✅ package.json do Baileys copiado"
fi

# 4. Atualizar configurações
echo "⚙️ Atualizando configurações..."

# Verificar se o arquivo .env existe
if [ -f .env ]; then
    echo "✅ Arquivo .env encontrado"
else
    echo "❌ Arquivo .env não encontrado - criando..."
    cp .env.production .env
fi

# 5. Instalar dependências do Baileys
echo "📦 Instalando dependências do Baileys..."
npm install @whiskeysockets/baileys qrcode pino uuid

# 6. Criar diretório de sessões
echo "📁 Criando diretório de sessões..."
mkdir -p sessions

# 7. Atualizar configuração da VPS
echo "🖥️ Atualizando configuração da VPS..."
echo "Para atualizar a VPS, execute:"
echo "ssh root@31.97.241.19"
echo "cd /opt/whatsapp-server"
echo "pm2 restart atendeai-backend"

# 8. Criar arquivo de configuração para Baileys
echo "📝 Criando configuração específica para Baileys..."
cat > baileys-config.js << 'EOF'
// Configuração específica para Baileys
module.exports = {
  // Configurações do Baileys
  baileys: {
    version: 'latest',
    browser: ['Chrome (Linux)', '', ''],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 120000,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true
  },
  
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3001,
    host: '0.0.0.0',
    cors: {
      origin: [
        'https://atendeai.lify.com.br',
        'https://www.atendeai.lify.com.br',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080'
      ],
      credentials: true
    }
  },
  
  // Configurações do Supabase
  supabase: {
    url: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
    key: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
  }
};
EOF

echo "✅ Configuração Baileys criada: baileys-config.js"

# 9. Criar script de teste
echo "🧪 Criando script de teste..."
cat > test-baileys-connection.js << 'EOF'
const axios = require('axios');

async function testBaileysConnection() {
  try {
    console.log('🧪 Testando conexão Baileys...');
    
    // Testar health check
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Testar geração de QR Code
    const qrResponse = await axios.post('http://localhost:3001/api/whatsapp/generate-qr', {
      agentId: 'test-agent',
      whatsappNumber: 'test-number',
      connectionId: 'test-connection'
    });
    console.log('✅ QR Code test:', qrResponse.data);
    
    console.log('🎉 Teste Baileys concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testBaileysConnection();
EOF

echo "✅ Script de teste criado: test-baileys-connection.js"

# 10. Atualizar documentação
echo "📚 Atualizando documentação..."
cat > BAILEYS_MIGRATION.md << 'EOF'
# 🔄 Migração para Baileys - AtendeAI

## ✅ Migração Concluída

O sistema foi migrado para usar **apenas Baileys** como API de WhatsApp.

### Mudanças Realizadas:

1. **Servidor Principal**: Substituído WhatsApp Web.js por Baileys
2. **Dependências**: Instaladas dependências do Baileys
3. **Configuração**: Atualizada para Baileys
4. **Sessões**: Diretório de sessões criado

### Endpoints Disponíveis:

- `GET /health` - Health check
- `POST /api/whatsapp/generate-qr` - Gerar QR Code
- `POST /api/whatsapp/initialize` - Inicializar conexão
- `POST /api/whatsapp/status` - Verificar status
- `POST /api/whatsapp/send-message` - Enviar mensagem
- `POST /api/whatsapp/disconnect` - Desconectar
- `POST /api/whatsapp/clear-auth` - Limpar autenticação
- `POST /webhook/whatsapp` - Webhook para mensagens

### Como Usar:

1. **Iniciar servidor**: `npm run dev:server`
2. **Testar conexão**: `node test-baileys-connection.js`
3. **Frontend**: `npm run dev`

### Vantagens do Baileys:

- ✅ Mais estável e confiável
- ✅ Melhor suporte a múltiplos agentes
- ✅ Menos dependências externas
- ✅ Melhor controle de sessões
- ✅ Suporte nativo a webhooks

### Próximos Passos:

1. Testar todas as funcionalidades
2. Verificar integração com frontend
3. Atualizar VPS se necessário
4. Documentar APIs

---
*Migração realizada em: $(date)*
*Versão: Baileys 2.0.0*
EOF

echo "✅ Documentação atualizada: BAILEYS_MIGRATION.md"

echo ""
echo "🎯 MIGRAÇÃO CONCLUÍDA!"
echo "======================"
echo "✅ Servidor Baileys configurado"
echo "✅ Dependências instaladas"
echo "✅ Configurações atualizadas"
echo "✅ Scripts de teste criados"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. npm run dev:server (iniciar servidor)"
echo "2. node test-baileys-connection.js (testar)"
echo "3. npm run dev (frontend)"
echo ""
echo "🖥️ Para atualizar VPS:"
echo "ssh root@31.97.241.19"
echo "cd /opt/whatsapp-server"
echo "pm2 restart atendeai-backend"
echo ""
echo "✅ Migração para Baileys concluída!" 