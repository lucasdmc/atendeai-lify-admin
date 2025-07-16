#!/bin/bash

# Configurações
LOCAL_PATH="/Users/lucascantoni/Desktop/Lify-AtendeAI/atendeai-lify-admin/atendeai-lify-admin"
VPS_USER="root"
VPS_HOST="31.97.241.19"
VPS_PATH="/root/LifyChatbot-Node-Server"
PM2_NAME="whatsapp-server"

# 1. Copiar arquivos para a VPS
scp "$LOCAL_PATH/server.js" "$VPS_USER@$VPS_HOST:$VPS_PATH/server.js"
scp "$LOCAL_PATH/package.json" "$VPS_USER@$VPS_HOST:$VPS_PATH/package.json"
scp "$LOCAL_PATH/package-lock.json" "$VPS_USER@$VPS_HOST:$VPS_PATH/package-lock.json"

# 2. Instalar dependências e reiniciar servidor na VPS
ssh $VPS_USER@$VPS_HOST << EOF
  cd $VPS_PATH
  npm install
  pm2 restart $PM2_NAME || pm2 start server.js --name "$PM2_NAME"
EOF

echo "✅ Deploy concluído! Teste os endpoints com ./scripts/test-vps-endpoints.sh" 