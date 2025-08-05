#!/bin/bash

# Script de Debug Rápido - VPS AtendeAI
# Executa debug completo automaticamente
# VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)

echo "🚀 Debug Rápido - VPS AtendeAI"
echo "==============================="
echo "📍 VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)"
echo "⏰ Iniciando debug completo..."
echo ""

# Configurações
VPS_IP="atendeai-backend-production.up.railway.app"
VPS_USER="root"
MANUAL_SCRIPT="scripts/execute-debug-manual.sh"

# Verificar conectividade
echo "🔍 1. Testando conectividade..."
if ! ping -c 1 $VPS_IP > /dev/null 2>&1; then
    echo "❌ VPS não responde ao ping"
    exit 1
fi

if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ Erro na conexão SSH"
    echo "💡 Verifique se sua chave SSH está configurada"
    exit 1
fi

echo "✅ Conectividade OK"

# Upload do script
echo ""
echo "📤 2. Fazendo upload do script..."
if scp "$MANUAL_SCRIPT" "$VPS_USER@$VPS_IP:/root/execute-debug-manual.sh"; then
    echo "✅ Script enviado com sucesso"
else
    echo "❌ Erro no upload do script"
    exit 1
fi

# Executar debug
echo ""
echo "🔧 3. Executando debug na VPS..."
echo "=================================="
echo "💡 O script vai:"
echo "   - Fazer backup do server.js"
echo "   - Adicionar logs de debug"
echo "   - Reiniciar o backend"
echo "   - Testar conectividade"
echo "   - Monitorar logs por 60 segundos"
echo ""
echo "🎯 Durante o monitoramento, teste a geração de QR Code pelo frontend!"
echo ""

# Executar o debug
ssh "$VPS_USER@$VPS_IP" "chmod +x /root/execute-debug-manual.sh && /root/execute-debug-manual.sh"

echo ""
echo "🎯 Debug concluído!"
echo "📝 Verifique os logs capturados na VPS"
echo "🔄 Para restaurar backup: ssh $VPS_USER@$VPS_IP 'cp /root/LifyChatbot-Node-Server/server.js.backup /root/LifyChatbot-Node-Server/server.js && pm2 restart LifyChatbot-Node-Server'" 