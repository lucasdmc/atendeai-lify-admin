#!/bin/bash

echo "🧪 TESTE LOCAL DO FLUXO WHATSAPP"
echo "================================"

# Teste 1: Backend local
echo "1. Testando backend local..."
curl -X POST http://localhost:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent-local"}' \
  -w "\nStatus: %{http_code}\n"

# Teste 2: Verificar se o servidor está rodando
echo "2. Verificando se o servidor está rodando..."
ps aux | grep "node server.js" | grep -v grep

# Teste 3: Verificar portas em uso
echo "3. Verificando portas em uso..."
lsof -i :3001
