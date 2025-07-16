#!/bin/bash

# Script para monitorar e limpar sessões do WhatsApp automaticamente
# Uso: ./monitor-whatsapp-sessions.sh

VPS_USER="root"
VPS_IP="31.97.241.19"
VPS_HOST="atendeai.server.com.br"

echo "🔍 Monitorando sessões do WhatsApp na VPS..."
echo "📍 VPS: $VPS_HOST ($VPS_IP)"

# Verificar se há múltiplos processos Chrome
echo "📊 Verificando processos Chrome..."
CHROME_COUNT=$(ssh "$VPS_USER@$VPS_IP" "ps aux | grep chrome | grep -v grep | wc -l")
echo "   Processos Chrome ativos: $CHROME_COUNT"

if [ "$CHROME_COUNT" -gt 10 ]; then
    echo "⚠️  Detectado excesso de processos Chrome ($CHROME_COUNT)"
    echo "🧹 Limpando sessões..."
    
    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "   Parando servidor WhatsApp..."
        pm2 stop whatsapp-server
        
        echo "   Matando processos Chrome..."
        pkill -f chrome
        
        echo "   Aguardando 3 segundos..."
        sleep 3
        
        echo "   Limpando diretório de sessões..."
        cd /root/LifyChatbot-Node-Server
        rm -rf .wwebjs_auth/*
        
        echo "   Reiniciando servidor WhatsApp..."
        pm2 start whatsapp-server
        
        echo "   Aguardando inicialização..."
        sleep 5
        
        echo "   Verificando status..."
        pm2 status
EOF
    
    echo "✅ Limpeza concluída!"
else
    echo "✅ Número de processos Chrome normal ($CHROME_COUNT)"
fi

# Verificar logs de erro
echo "📋 Verificando logs de erro..."
ssh "$VPS_USER@$VPS_IP" "pm2 logs whatsapp-server --lines 5"

# Testar geração de QR Code
echo "🧪 Testando geração de QR Code..."
TEST_RESULT=$(ssh "$VPS_USER@$VPS_IP" "curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr -H 'Content-Type: application/json' -d '{\"agentId\":\"test-agent\"}' | head -c 100")

if [[ $TEST_RESULT == *"success"* ]]; then
    echo "✅ Servidor WhatsApp funcionando corretamente"
else
    echo "❌ Problema detectado no servidor WhatsApp"
    echo "   Resultado do teste: $TEST_RESULT"
fi

echo ""
echo "📊 Status Final:"
ssh "$VPS_USER@$VPS_IP" "pm2 status"
echo ""
echo "🔗 URLs de Teste:"
echo "   Health Check: http://$VPS_IP:3001/health"
echo "   WhatsApp QR: http://$VPS_IP:3001/api/whatsapp/generate-qr"
echo "   Status WhatsApp: http://$VPS_IP:3001/api/whatsapp/status"
echo ""
echo "💡 Para monitoramento contínuo, execute:"
echo "   watch -n 30 ./monitor-whatsapp-sessions.sh" 