#!/bin/bash

echo "🧪 TESTE COMPLETO DO FLUXO WHATSAPP"
echo "===================================="

# Teste 1: Backend local
echo "1. Testando backend local..."
curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-local"}' \
  -w "\nStatus: %{http_code}\n"

# Teste 2: Backend VPS
echo "2. Testando backend VPS..."
curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-vps"}' \
  -w "\nStatus: %{http_code}\n"

# Teste 3: Edge Function
echo "3. Testando Edge Function..."
curl -X POST https://your-project.supabase.co/functions/v1/agent-whatsapp-manager \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "generate-qr", "agentId": "test-agent-edge"}' \
  -w "\nStatus: %{http_code}\n"
