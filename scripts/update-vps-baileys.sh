#!/bin/bash

echo "🔄 ATUALIZANDO VPS PARA BAILEYS - ATENDEAI MVP 1.0"

# Configurações da VPS
VPS_IP="31.97.241.19"
VPS_USER="root"
PROJECT_DIR="/root/LifyChatbot-Node-Server"

echo "📋 VPS: $VPS_IP"
echo "📁 Diretório: $PROJECT_DIR"

# 1. Verificar conectividade
echo "🔍 Verificando conectividade com a VPS..."
if ! ping -c 1 $VPS_IP > /dev/null 2>&1; then
    echo "❌ Erro: VPS não está acessível"
    exit 1
fi

echo "✅ VPS acessível"

# 2. Parar serviços atuais
echo "🛑 Parando serviços atuais..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "Parando PM2..."
    pm2 stop whatsapp-server || true
    pm2 delete whatsapp-server || true
    
    echo "Limpando processos na porta 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
EOF

# 3. Atualizar servidor Baileys
echo "📤 Enviando servidor Baileys atualizado..."
scp server-baileys-working.js $VPS_USER@$VPS_IP:$PROJECT_DIR/server.js

# 4. Atualizar dependências e configurações
echo "🔧 Atualizando configurações na VPS..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/LifyChatbot-Node-Server
    
    echo "📦 Atualizando dependências..."
    npm install @whiskeysockets/baileys@latest qrcode express cors dotenv @supabase/supabase-js pino
    
    echo "📝 Atualizando package.json..."
    cat > package.json << 'PACKAGE_JSON'
{
  "name": "atendeai-baileys-server",
  "version": "2.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "test": "curl http://localhost:3001/health"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^6.7.18",
    "qrcode": "^1.5.4",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.6.0",
    "@supabase/supabase-js": "^2.50.0",
    "pino": "^9.7.0"
  }
}
PACKAGE_JSON

    echo "🔧 Atualizando .env..."
    cat > .env << 'ENV_FILE'
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
WHATSAPP_SERVER_URL=http://31.97.241.19:3001
PORT=3001
HOST=0.0.0.0
ENV_FILE

    echo "📁 Criando diretórios necessários..."
    mkdir -p sessions
    mkdir -p logs
    
    echo "🔧 Configurando firewall..."
    ufw allow 3001/tcp
    
    echo "🧹 Limpando logs antigos..."
    rm -f logs/*.log 2>/dev/null || true
EOF

# 5. Iniciar servidor atualizado
echo "🚀 Iniciando servidor Baileys atualizado..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/LifyChatbot-Node-Server
    
    echo "🔧 Instalando dependências..."
    npm install
    
    echo "🚀 Iniciando servidor com PM2..."
    pm2 start server.js --name "whatsapp-server" --watch --log logs/server.log
    
    echo "📊 Status do PM2:"
    pm2 status
    
    echo "🔍 Aguardando servidor inicializar..."
    sleep 10
    
    echo "🔍 Testando health check..."
    curl -s http://localhost:3001/health | jq .
    
    echo "✅ Servidor iniciado com sucesso!"
EOF

# 6. Testes finais
echo "🧪 Realizando testes finais..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "🔍 Teste 1: Health Check"
    curl -s http://localhost:3001/health | jq .
    
    echo "🔍 Teste 2: Status do PM2"
    pm2 status
    
    echo "🔍 Teste 3: Logs do servidor"
    tail -10 logs/server.log 2>/dev/null || echo "Logs ainda não disponíveis"
    
    echo "🔍 Teste 4: Porta 3001"
    netstat -tlnp | grep :3001 || echo "Porta 3001 não está sendo usada"
EOF

echo "🎉 ATUALIZAÇÃO DA VPS CONCLUÍDA!"
echo ""
echo "📋 RESUMO:"
echo "✅ Servidor Baileys atualizado"
echo "✅ Dependências atualizadas"
echo "✅ PM2 configurado"
echo "✅ Firewall configurado"
echo ""
echo "🌐 URLs:"
echo "🔗 Health Check: http://31.97.241.19:3001/health"
echo "🔗 Servidor: http://31.97.241.19:3001"
echo ""
echo "📊 Comandos úteis:"
echo "📋 Status: ssh root@31.97.241.19 'pm2 status'"
echo "📋 Logs: ssh root@31.97.241.19 'pm2 logs whatsapp-server'"
echo "📋 Restart: ssh root@31.97.241.19 'pm2 restart whatsapp-server'"
echo ""
echo "🧪 Teste manual:"
echo "curl -s http://31.97.241.19:3001/health | jq ." 