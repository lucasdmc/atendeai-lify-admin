#!/bin/bash

echo "🚀 Deploy do servidor Baileys na VPS - Removendo WhatsApp Web.js"

# Configurações
VPS_IP="31.97.241.19"
VPS_USER="root"
PROJECT_DIR="/root/LifyChatbot-Node-Server"

echo "📋 Verificando conectividade com a VPS..."
if ! ping -c 1 $VPS_IP > /dev/null 2>&1; then
    echo "❌ Erro: VPS não está acessível"
    exit 1
fi

echo "✅ VPS acessível"

# Conectar via SSH e executar comandos
ssh $VPS_USER@$VPS_IP << 'EOF'

echo "🔄 Parando serviços atuais..."
pm2 stop whatsapp-server || true
pm2 delete whatsapp-server || true

echo "🧹 Limpando arquivos antigos..."
cd /root
rm -rf LifyChatbot-Node-Server
mkdir -p LifyChatbot-Node-Server
cd LifyChatbot-Node-Server

echo "📦 Instalando dependências Baileys..."
npm init -y
npm install @whiskeysockets/baileys qrcode express cors dotenv @supabase/supabase-js

echo "📝 Criando package.json otimizado..."
cat > package.json << 'PACKAGE_JSON'
{
  "name": "atendeai-baileys-server",
  "version": "2.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.18",
    "qrcode": "^1.5.4",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.6.0",
    "@supabase/supabase-js": "^2.50.0"
  }
}
PACKAGE_JSON

echo "🔧 Criando arquivo .env..."
cat > .env << 'ENV_FILE'
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
WHATSAPP_SERVER_URL=http://31.97.241.19:3001
PORT=3001
ENV_FILE

echo "📁 Criando diretório de sessões..."
mkdir -p sessions

echo "🔧 Configurando firewall..."
ufw allow 3001/tcp

echo "✅ Configuração básica concluída"

EOF

echo "📤 Enviando servidor Baileys para VPS..."
scp server-baileys.js $VPS_USER@$VPS_IP:/root/LifyChatbot-Node-Server/server.js

echo "🚀 Iniciando servidor na VPS..."
ssh $VPS_USER@$VPS_IP << 'EOF'

cd /root/LifyChatbot-Node-Server

echo "🔧 Instalando dependências..."
npm install

echo "🚀 Iniciando servidor com PM2..."
pm2 start server.js --name "whatsapp-server" --watch

echo "📊 Status do PM2:"
pm2 status

echo "🔍 Verificando se o servidor está rodando..."
sleep 5
curl -s http://localhost:3001/health | jq .

echo "✅ Deploy concluído!"
echo "🌐 Servidor acessível em: http://31.97.241.19:3001"
echo "🔍 Health check: http://31.97.241.19:3001/health"

EOF

echo "🎉 Deploy do servidor Baileys concluído!"
echo "📋 Próximos passos:"
echo "1. Teste o health check: curl http://31.97.241.19:3001/health"
echo "2. Teste a geração de QR Code via Edge Function"
echo "3. Verifique se o frontend está funcionando corretamente" 