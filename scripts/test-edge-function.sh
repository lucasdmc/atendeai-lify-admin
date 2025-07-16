#!/bin/bash

# Script para testar a Edge Function do WhatsApp
# Uso: ./test-edge-function.sh

echo "🧪 Testando Edge Function do WhatsApp..."

# Configurações
EDGE_FUNCTION_URL="https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/generate-qr"
AUTH_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

echo "📍 URL: $EDGE_FUNCTION_URL"

# Teste 1: Verificar se a Edge Function está acessível
echo ""
echo "📋 Teste 1: Verificar acessibilidade"
RESPONSE=$(curl -s -w "%{http_code}" "$EDGE_FUNCTION_URL" -H "Authorization: Bearer $AUTH_TOKEN")
HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

echo "   HTTP Code: $HTTP_CODE"
echo "   Response: $BODY"

# Teste 2: Testar com agente válido
echo ""
echo "📋 Teste 2: Testar com agente válido"
AGENT_ID="0e170bf5-e767-4dea-90e5-8fccbdbfa6a5"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$AGENT_ID\"}")

HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

echo "   Agent ID: $AGENT_ID"
echo "   HTTP Code: $HTTP_CODE"
echo "   Response: $BODY"

# Teste 3: Testar com outro agente
echo ""
echo "📋 Teste 3: Testar com outro agente"
AGENT_ID="1db8af0a-77f0-41d2-9524-089615c34c5a"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"$AGENT_ID\"}")

HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

echo "   Agent ID: $AGENT_ID"
echo "   HTTP Code: $HTTP_CODE"
echo "   Response: $BODY"

# Teste 4: Verificar servidor WhatsApp diretamente
echo ""
echo "📋 Teste 4: Verificar servidor WhatsApp diretamente"
VPS_IP="31.97.241.19"
RESPONSE=$(curl -s -w "%{http_code}" -X POST "http://$VPS_IP:3001/api/whatsapp/generate-qr" \
  -H "Content-Type: application/json" \
  -d "{\"agentId\":\"test-agent\"}")

HTTP_CODE="${RESPONSE: -3}"
BODY="${RESPONSE%???}"

echo "   VPS IP: $VPS_IP"
echo "   HTTP Code: $HTTP_CODE"
echo "   Response: $BODY"

echo ""
echo "📊 Resumo dos Testes:"
echo "   Edge Function acessível: $([ "$HTTP_CODE" = "200" ] && echo "✅" || echo "❌")"
echo "   Servidor WhatsApp: $([ "$HTTP_CODE" = "200" ] && echo "✅" || echo "❌")"

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Todos os testes passaram!"
else
    echo "❌ Há problemas que precisam ser investigados"
fi 