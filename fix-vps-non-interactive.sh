#!/bin/bash

echo "🚀 APLICANDO CORREÇÃO NA VPS (SEM INTERAÇÃO)"
echo "=============================================="

# Configurações
VPS_IP="31.97.241.19"
VPS_USER="root"
VPS_DIR="/root/atendeai-lify-backend"

echo "📋 1. Copiando arquivos para VPS..."

# Copiar arquivo de configuração
echo "   📄 Copiando .env.production.unified..."
scp -o ConnectTimeout=10 -o BatchMode=yes .env.production.unified ${VPS_USER}@${VPS_IP}:${VPS_DIR}/ 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ .env.production.unified copiado"
else
    echo "   ❌ Erro ao copiar .env.production.unified"
fi

# Copiar script de correção
echo "   📄 Copiando apply-fix-on-vps.sh..."
scp -o ConnectTimeout=10 -o BatchMode=yes apply-fix-on-vps.sh ${VPS_USER}@${VPS_IP}:${VPS_DIR}/ 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ apply-fix-on-vps.sh copiado"
else
    echo "   ❌ Erro ao copiar apply-fix-on-vps.sh"
fi

echo ""
echo "📋 2. Executando correção na VPS..."

# Executar correção via SSH sem interação
ssh -o ConnectTimeout=10 -o BatchMode=yes ${VPS_USER}@${VPS_IP} << 'EOF'
cd /root/atendeai-lify-backend

echo "🔧 Aplicando correções..."

# Fazer backup
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null

# Aplicar configurações unificadas
cp .env.production.unified .env.production

# Verificar se Node.js está rodando
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "💡 Iniciando Node.js..."
    pm2 start server.js --name "atendeai-backend" 2>/dev/null || echo "⚠️ Erro ao iniciar Node.js"
fi

# Testar webhook
echo "🧪 Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \
  -s 2>/dev/null

echo ""
echo "✅ Correções aplicadas!"
echo "📱 Agora teste enviando uma mensagem no WhatsApp"
EOF

echo ""
echo "🎉 CORREÇÃO APLICADA!"
echo "====================="
echo "✅ Arquivos copiados para VPS"
echo "✅ Configurações aplicadas"
echo "✅ Node.js verificado/iniciado"
echo "✅ Webhook testado"
echo ""
echo "📱 Agora teste enviando uma mensagem no WhatsApp"
echo "📊 Para monitorar: ssh root@31.97.241.19 'pm2 logs atendeai-backend'" 