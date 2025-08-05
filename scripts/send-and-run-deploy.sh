#!/bin/bash

# Script para enviar e executar o deploy na VPS
# VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)

echo "📤 Enviando script de deploy para VPS..."

# Configurações da VPS
VPS_HOST="atendeai.server.com.br"
VPS_IP="atendeai-backend-production.up.railway.app"
VPS_USER="root"

echo "📋 VPS: $VPS_HOST ($VPS_IP)"

# 1. Enviar script para VPS
echo "📤 Enviando script de deploy..."
scp -o StrictHostKeyChecking=no scripts/deploy-vps-simple.sh $VPS_USER@$VPS_IP:/root/deploy-vps-simple.sh

# 2. Executar script na VPS
echo "🚀 Executando deploy na VPS..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP << 'EOF'
    echo "Executando script de deploy..."
    chmod +x /root/deploy-vps-simple.sh
    /root/deploy-vps-simple.sh
EOF

# 3. Verificar resultado
echo "✅ Verificando resultado..."
sleep 5
curl -s "http://$VPS_IP:3001/health" && echo "✅ Servidor acessível externamente!" || echo "❌ Servidor não acessível externamente"

echo ""
echo "🎉 Deploy concluído!"
echo ""
echo "📋 URLs importantes:"
echo "  Health Check: http://$VPS_IP:3001/health"
echo "  WhatsApp QR: http://$VPS_IP:3001/generate-qr"
echo "  Status WhatsApp: http://$VPS_IP:3001/whatsapp-status"
echo ""
echo "🔗 Frontend: https://atendeai.lify.com.br" 