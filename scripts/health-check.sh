#!/bin/bash

# Script de Health Check Automático
# Verifica se todos os endpoints estão funcionando

VPS_HOST="atendeai-backend-production.up.railway.app"
VPS_USER="root"
PORT=3001

echo "🔍 Health Check Automático - $(date)"
echo "=================================="

# 1. Verificar se o servidor está rodando
echo "1️⃣ Verificando se o servidor está rodando..."
if curl -s http://$VPS_HOST:$PORT/health > /dev/null; then
    echo "✅ Servidor está rodando"
else
    echo "❌ Servidor não está respondendo"
    exit 1
fi

# 2. Verificar endpoint /health
echo ""
echo "2️⃣ Testando endpoint /health..."
HEALTH_RESPONSE=$(curl -s http://$VPS_HOST:$PORT/health)
if echo "$HEALTH_RESPONSE" | jq -e '.status' > /dev/null; then
    echo "✅ Endpoint /health funcionando"
    echo "   Status: $(echo "$HEALTH_RESPONSE" | jq -r '.status')"
    echo "   Uptime: $(echo "$HEALTH_RESPONSE" | jq -r '.uptime')s"
    echo "   Active Sessions: $(echo "$HEALTH_RESPONSE" | jq -r '.activeSessions')"
else
    echo "❌ Endpoint /health não está retornando JSON válido"
    echo "   Resposta: $HEALTH_RESPONSE"
fi

# 3. Verificar endpoint /api/whatsapp/generate-qr
echo ""
echo "3️⃣ Testando endpoint /api/whatsapp/generate-qr..."
QR_RESPONSE=$(curl -s -X POST http://$VPS_HOST:$PORT/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"health-check-test"}')
if echo "$QR_RESPONSE" | jq -e '.success' > /dev/null; then
    echo "✅ Endpoint /api/whatsapp/generate-qr funcionando"
    echo "   Success: $(echo "$QR_RESPONSE" | jq -r '.success')"
    echo "   Message: $(echo "$QR_RESPONSE" | jq -r '.message')"
else
    echo "❌ Endpoint /api/whatsapp/generate-qr não está retornando JSON válido"
    echo "   Resposta: $QR_RESPONSE"
fi

# 4. Verificar PM2
echo ""
echo "4️⃣ Verificando PM2..."
PM2_STATUS=$(ssh $VPS_USER@$VPS_HOST "pm2 list" 2>/dev/null)
if echo "$PM2_STATUS" | grep -q "atendeai-backend.*online"; then
    echo "✅ PM2: atendeai-backend está online"
else
    echo "❌ PM2: atendeai-backend não está online"
    echo "$PM2_STATUS"
fi

# 5. Verificar porta
echo ""
echo "5️⃣ Verificando porta $PORT..."
PORT_STATUS=$(ssh $VPS_USER@$VPS_HOST "netstat -tuln | grep :$PORT" 2>/dev/null)
if [ -n "$PORT_STATUS" ]; then
    echo "✅ Porta $PORT está escutando"
    echo "   $PORT_STATUS"
else
    echo "❌ Porta $PORT não está escutando"
fi

# 6. Verificar logs recentes
echo ""
echo "6️⃣ Verificando logs recentes..."
RECENT_LOGS=$(ssh $VPS_USER@$VPS_HOST "pm2 logs atendeai-backend --lines 5" 2>/dev/null)
if [ -n "$RECENT_LOGS" ]; then
    echo "✅ Logs disponíveis"
    echo "   Últimos logs:"
    echo "$RECENT_LOGS" | tail -3
else
    echo "❌ Não foi possível obter logs"
fi

# 7. Resumo
echo ""
echo "=================================="
echo "📊 Resumo do Health Check"
echo "=================================="

# Contar quantos testes passaram
PASSED=0
TOTAL=6

if curl -s http://$VPS_HOST:$PORT/health > /dev/null; then PASSED=$((PASSED + 1)); fi
if echo "$HEALTH_RESPONSE" | jq -e '.status' > /dev/null; then PASSED=$((PASSED + 1)); fi
if echo "$QR_RESPONSE" | jq -e '.success' > /dev/null; then PASSED=$((PASSED + 1)); fi
if echo "$PM2_STATUS" | grep -q "atendeai-backend.*online"; then PASSED=$((PASSED + 1)); fi
if [ -n "$PORT_STATUS" ]; then PASSED=$((PASSED + 1)); fi
if [ -n "$RECENT_LOGS" ]; then PASSED=$((PASSED + 1)); fi

echo "✅ Testes passaram: $PASSED/$TOTAL"

if [ $PASSED -eq $TOTAL ]; then
    echo "🎉 Sistema está funcionando perfeitamente!"
    exit 0
elif [ $PASSED -ge 4 ]; then
    echo "⚠️  Sistema está funcionando com pequenos problemas"
    exit 1
else
    echo "❌ Sistema tem problemas significativos"
    exit 2
fi 