#!/bin/bash

echo "🧪 TESTANDO FUNCIONAMENTO APÓS CORREÇÕES"
echo "========================================"

# 1. Carregar variáveis de ambiente
echo "📋 1. Carregando variáveis de ambiente..."
source .env.production.unified

# 2. Verificar se as variáveis estão carregadas
echo "📋 2. Verificando variáveis..."
echo "   NODE_ENV: $NODE_ENV"
echo "   PORT: $PORT"
echo "   OPENAI_API_KEY: ${OPENAI_API_KEY:0:20}..."
echo "   WHATSAPP_META_ACCESS_TOKEN: ${WHATSAPP_META_ACCESS_TOKEN:0:20}..."
echo "   WHATSAPP_META_PHONE_NUMBER_ID: $WHATSAPP_META_PHONE_NUMBER_ID"

# 3. Testar webhook
echo "📋 3. Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \
  -s | jq '.'

# 4. Testar health check
echo "📋 4. Testando health check..."
curl -s http://localhost:3001/health | jq '.'

echo "✅ Teste concluído!"
