#!/bin/bash

# Script de Deploy Limpo e Seguro para Produção
# Autor: Sistema AtendeAI
# Data: $(date)

set -e  # Para em caso de erro

echo "🚀 Iniciando Deploy Limpo para Produção..."
echo "📅 Data/Hora: $(date)"
echo ""

# Configurações
VPS_HOST="31.97.241.19"
VPS_USER="root"
BACKUP_DIR="/root/backups"
DEPLOY_DIR="/root/atendeai-lify-admin"
PM2_APP_NAME="atendeai-backend"
PORT=3001

echo "🔧 Configurações:"
echo "   VPS: $VPS_HOST"
echo "   Diretório: $DEPLOY_DIR"
echo "   PM2 App: $PM2_APP_NAME"
echo "   Porta: $PORT"
echo ""

# 1. Backup do backend atual
echo "📦 Fazendo backup do backend atual..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
mkdir -p /root/backups
BACKUP_NAME="backend-backup-$(date +%Y%m%d-%H%M%S)"
cp -r /root/atendeai-lify-admin /root/backups/$BACKUP_NAME
echo "✅ Backup criado: /root/backups/$BACKUP_NAME"
EOF

# 2. Parar todos os processos PM2 relacionados
echo "🛑 Parando processos PM2..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
pm2 stop atendeai-backend 2>/dev/null || true
pm2 delete atendeai-backend 2>/dev/null || true
pm2 save
echo "✅ Processos PM2 parados"
EOF

# 3. Limpar diretório de deploy
echo "🧹 Limpando diretório de deploy..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
rm -rf /root/atendeai-lify-admin
mkdir -p /root/atendeai-lify-admin
echo "✅ Diretório limpo"
EOF

# 4. Copiar arquivos do projeto
echo "📁 Copiando arquivos do projeto..."
scp -r server.js package.json $VPS_USER@$VPS_HOST:/root/atendeai-lify-admin/

# 5. Instalar dependências
echo "📦 Instalando dependências..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
cd /root/atendeai-lify-admin
npm install --production
echo "✅ Dependências instaladas"
EOF

# 6. Verificar se a porta está livre
echo "🔍 Verificando porta $PORT..."
ssh $VPS_USER@$VPS_HOST << EOF
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Porta $PORT está em uso. Matando processo..."
    lsof -ti:$PORT | xargs kill -9
fi
echo "✅ Porta $PORT livre"
EOF

# 7. Iniciar aplicação com PM2
echo "🚀 Iniciando aplicação com PM2..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
cd /root/atendeai-lify-admin
pm2 start server.js --name atendeai-backend --time
pm2 save
echo "✅ Aplicação iniciada com PM2"
EOF

# 8. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 5

# 9. Verificar se está rodando
echo "🔍 Verificando status..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
echo "📊 Status PM2:"
pm2 list
echo ""
echo "🔍 Verificando porta 3001:"
netstat -tuln | grep 3001
echo ""
echo "📋 Logs recentes:"
pm2 logs atendeai-backend --lines 10
EOF

# 10. Testar endpoints
echo "🧪 Testando endpoints..."
ssh $VPS_USER@$VPS_HOST << 'EOF'
echo "🔍 Testando /health:"
curl -s http://localhost:3001/health | jq . || echo "❌ Endpoint /health não respondeu"
echo ""
echo "🔍 Testando /api/whatsapp/generate-qr:"
curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test"}' | jq . || echo "❌ Endpoint /api/whatsapp/generate-qr não respondeu"
EOF

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "📅 Data/Hora: $(date)"
echo ""
echo "🔗 Endpoints disponíveis:"
echo "   - Health Check: http://$VPS_HOST:$PORT/health"
echo "   - Generate QR: POST http://$VPS_HOST:$PORT/api/whatsapp/generate-qr"
echo "   - Status: GET http://$VPS_HOST:$PORT/api/whatsapp/status/:agentId"
echo "   - Disconnect: POST http://$VPS_HOST:$PORT/api/whatsapp/disconnect"
echo ""
echo "📋 Comandos úteis:"
echo "   - Ver logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs atendeai-backend'"
echo "   - Reiniciar: ssh $VPS_USER@$VPS_HOST 'pm2 restart atendeai-backend'"
echo "   - Status: ssh $VPS_USER@$VPS_HOST 'pm2 list'" 