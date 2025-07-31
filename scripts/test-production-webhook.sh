#!/bin/bash

# ========================================
# SCRIPT DE TESTE DO WEBHOOK EM PRODUÇÃO
# ========================================

echo "🧪 TESTANDO WEBHOOK EM PRODUÇÃO"
echo "================================="

# URL do webhook em produção
WEBHOOK_URL="https://api.atendeai.lify.com.br/webhook/whatsapp-meta"

echo "📱 URL do Webhook: $WEBHOOK_URL"
echo ""

# Teste 1: Verificar se o webhook está acessível
echo "🔍 Teste 1: Verificando acessibilidade do webhook..."
if curl -f "$WEBHOOK_URL/test" >/dev/null 2>&1; then
    echo "✅ Webhook está acessível"
else
    echo "❌ Webhook não está acessível"
    echo "   Verifique se o servidor está rodando em produção"
    exit 1
fi

echo ""

# Teste 2: Testar envio de mensagem com AI
echo "🤖 Teste 2: Testando envio de mensagem com AI..."
TEST_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL/test-send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "5511999999999",
    "message": "Olá, como posso agendar uma consulta?",
    "clinicId": "test-clinic",
    "userId": "test-user"
  }')

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Teste de envio com AI funcionando"
    echo "📊 Resposta: $TEST_RESPONSE"
else
    echo "❌ Falha no teste de envio com AI"
    echo "📊 Resposta: $TEST_RESPONSE"
fi

echo ""

# Teste 3: Simular webhook do WhatsApp
echo "📱 Teste 3: Simulando webhook do WhatsApp..."
WEBHOOK_PAYLOAD='{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "1775269513072729",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "5511999999999",
              "phone_number_id": "711779288689748"
            },
            "messages": [
              {
                "from": "5511999999999",
                "id": "wamid.test123",
                "timestamp": "1234567890",
                "type": "text",
                "text": {
                  "body": "Olá, preciso agendar uma consulta"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}'

WEBHOOK_RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$WEBHOOK_PAYLOAD")

if echo "$WEBHOOK_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Webhook processado com sucesso"
    echo "📊 Resposta: $WEBHOOK_RESPONSE"
else
    echo "❌ Falha no processamento do webhook"
    echo "📊 Resposta: $WEBHOOK_RESPONSE"
fi

echo ""
echo "🎯 TESTES CONCLUÍDOS!"
echo "======================"
echo ""
echo "📋 Para configurar o webhook no WhatsApp Business:"
echo "1. Acesse: https://business.facebook.com/settings/system-users"
echo "2. Vá em: WhatsApp > API Setup"
echo "3. Configure Webhook URL: $WEBHOOK_URL"
echo "4. Verify Token: lify-analysa-waba-token"
echo "5. Selecione: messages, message_deliveries, message_reads"
echo ""
echo "🔗 URL do Webhook: $WEBHOOK_URL"
echo "🔑 Token de Verificação: lify-analysa-waba-token"
echo ""
echo "✅ Configuração concluída!" 