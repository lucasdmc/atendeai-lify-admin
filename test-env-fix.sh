#!/bin/bash

echo "🧪 TESTANDO CONFIGURAÇÕES CORRIGIDAS"
echo "===================================="

# 1. Verificar se as variáveis estão carregadas
echo "📋 1. Verificando variáveis de ambiente..."
node -e "
console.log('🔍 Verificando variáveis de ambiente...');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✅ Configurado' : '❌ Não configurado');
console.log('WHATSAPP_META_ACCESS_TOKEN:', process.env.WHATSAPP_META_ACCESS_TOKEN ? '✅ Configurado' : '❌ Não configurado');
console.log('WHATSAPP_META_PHONE_NUMBER_ID:', process.env.WHATSAPP_META_PHONE_NUMBER_ID ? '✅ Configurado' : '❌ Não configurado');

"

# 2. Testar webhook
echo ""
echo "📋 2. Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \
  -s | jq '.'

# 3. Testar health check
echo ""
echo "📋 3. Testando health check..."
curl -s http://localhost:3001/health | jq '.'

echo ""
echo "✅ Teste concluído!"
