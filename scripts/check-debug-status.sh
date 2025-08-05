#!/bin/bash

# Script para verificar status do debug na VPS
# VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)

echo "🔍 Verificando Status do Debug - VPS AtendeAI"
echo "============================================="

# Configurações
VPS_IP="atendeai-backend-production.up.railway.app"
VPS_USER="root"

echo "📍 VPS: $VPS_HOST ($VPS_IP)"
echo ""

# Verificar se o script existe
echo "📁 Verificando arquivos..."
ssh "$VPS_USER@$VPS_IP" "ls -la /root/debug-simple-vps.sh"

# Verificar status do PM2
echo ""
echo "📊 Status do PM2..."
ssh "$VPS_USER@$VPS_IP" "pm2 list"

# Verificar logs do backend
echo ""
echo "📋 Logs do Backend..."
ssh "$VPS_USER@$VPS_IP" "pm2 logs LifyChatbot-Node-Server --lines 5"

# Verificar arquivo de requests
echo ""
echo "📝 Verificando arquivo de requests..."
ssh "$VPS_USER@$VPS_IP" "ls -la /tmp/whatsapp-requests.log && echo '---' && cat /tmp/whatsapp-requests.log"

# Testar endpoint diretamente
echo ""
echo "🧪 Testando endpoint..."
ssh "$VPS_USER@$VPS_IP" "curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr -H 'Content-Type: application/json' -d '{\"agentId\":\"test-status\"}' | head -c 200"

echo ""
echo "🎯 Status verificado!" 