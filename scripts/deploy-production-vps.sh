#!/bin/bash

# Script de Deploy para VPS de Produção
# VPS: atendeai.server.com.br (31.97.241.19)

echo "🚀 Iniciando deploy na VPS de produção..."

# Configurações da VPS
VPS_HOST="atendeai.server.com.br"
VPS_IP="31.97.241.19"
VPS_USER="root"
VPS_PORT="22"

# Configurações do projeto
REPO_URL="https://github.com/lucascantoni/atendeai-lify-admin.git"
PROJECT_DIR="/root/atendeai-lify-admin"
BACKEND_PORT="3001"

echo "📋 Configurações:"
echo "  VPS: $VPS_HOST ($VPS_IP)"
echo "  Projeto: $PROJECT_DIR"
echo "  Porta Backend: $BACKEND_PORT"

# 1. Conectar na VPS e parar serviços existentes
echo "🛑 Parando serviços existentes..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "Parando PM2..."
    pm2 stop all 2>/dev/null || true
    pm2 delete all 2>/dev/null || true
    
    echo "Verificando processos na porta 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    echo "Limpando diretório do projeto..."
    rm -rf /root/atendeai-lify-admin
EOF

# 2. Clonar repositório (se necessário)
echo "📥 Clonando repositório..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root
    git clone https://github.com/lucascantoni/atendeai-lify-admin.git
    cd atendeai-lify-admin
    npm install
EOF

# 3. Configurar variáveis de ambiente
echo "⚙️ Configurando variáveis de ambiente..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    # Criar arquivo .env se não existir
    if [ ! -f .env ]; then
        cp env.example .env
    fi
    
    # Configurar variáveis para produção
    cat > .env << 'ENVEOF'
# Configurações do Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Configurações do Backend (VPS)
VITE_BACKEND_URL=https://atendeai.server.com.br:3001
VITE_WHATSAPP_SERVER_URL=https://atendeai.server.com.br:3001

# Configurações do Google
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-client-secret

# Configurações do WhatsApp
WHATSAPP_SESSION_PATH=/root/atendeai-lify-admin/sessions
WHATSAPP_DATA_PATH=/root/atendeai-lify-admin/whatsapp-data

# Configurações do Servidor
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
ENVEOF

    echo "Variáveis de ambiente configuradas!"
EOF

# 4. Configurar firewall
echo "🔥 Configurando firewall..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    # Liberar porta 3001
    ufw allow 3001/tcp
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Verificar status
    ufw status
EOF

# 5. Iniciar servidor com PM2
echo "🚀 Iniciando servidor com PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    cd /root/atendeai-lify-admin
    
    # Instalar PM2 globalmente se não estiver instalado
    npm install -g pm2
    
    # Iniciar servidor
    pm2 start server.cjs --name "atendeai-backend" --env production
    
    # Salvar configuração do PM2
    pm2 save
    
    # Configurar para iniciar com o sistema
    pm2 startup
EOF

# 6. Verificar status
echo "✅ Verificando status do deploy..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "=== Status do PM2 ==="
    pm2 status
    
    echo "=== Processos na porta 3001 ==="
    lsof -i :3001
    
    echo "=== Logs do servidor ==="
    pm2 logs atendeai-backend --lines 10
    
    echo "=== Teste de conectividade ==="
    curl -s http://localhost:3001/health || echo "Servidor não responde localmente"
    curl -s http://0.0.0.0:3001/health || echo "Servidor não responde em 0.0.0.0"
EOF

# 7. Teste externo
echo "🌐 Testando conectividade externa..."
sleep 5
curl -s "http://$VPS_IP:3001/health" && echo "✅ Servidor acessível externamente!" || echo "❌ Servidor não acessível externamente"

echo "🎉 Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure as variáveis de ambiente corretas no arquivo .env"
echo "2. Teste a conexão WhatsApp: https://atendeai.lify.com.br"
echo "3. Monitore os logs: ssh root@$VPS_IP 'pm2 logs atendeai-backend'"
echo ""
echo "🔗 URLs importantes:"
echo "  Frontend: https://atendeai.lify.com.br"
echo "  Backend: http://$VPS_IP:3001"
echo "  VPS SSH: ssh root@$VPS_IP" 