#!/bin/bash

echo "🧪 TESTANDO ENDPOINTS DA VPS"
echo "=============================="

VPS_URL="http://31.97.241.19:3001"

echo "1. Testando health check..."
curl -s "$VPS_URL/health"
echo -e "\n"

echo "2. Testando generate-qr..."
curl -s -X POST "$VPS_URL/api/whatsapp/generate-qr" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test"}' | head -c 200
echo -e "\n"

echo "3. Testando status endpoint..."
curl -s "$VPS_URL/api/whatsapp/status/test"
echo -e "\n"

echo "4. Testando disconnect endpoint..."
curl -s -X POST "$VPS_URL/api/whatsapp/disconnect" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test"}'
echo -e "\n"

echo "5. Testando clear-sessions endpoint..."
curl -s -X POST "$VPS_URL/api/whatsapp/clear-sessions"
echo -e "\n"

echo "✅ Testes concluídos!" 