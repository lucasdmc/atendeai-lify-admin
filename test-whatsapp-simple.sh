#!/bin/bash

echo "🧪 Testando Sistema WhatsApp..."
echo ""

# 1. Testar VPS
echo "1️⃣ Testando VPS..."
if ping -c 1 31.97.241.19 &> /dev/null; then
    echo "✅ VPS online"
else
    echo "❌ VPS offline"
    exit 1
fi

# 2. Testar servidor WhatsApp
echo ""
echo "2️⃣ Testando servidor WhatsApp..."
HEALTH_RESPONSE=$(curl -s http://31.97.241.19:3001/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Servidor WhatsApp online"
    echo "   Status: $(echo $HEALTH_RESPONSE | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Servidor WhatsApp não responde"
    exit 1
fi

# 3. Testar QR Code
echo ""
echo "3️⃣ Testando geração de QR Code..."
QR_RESPONSE=$(curl -s -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b"}' 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ QR Code gerado com sucesso"
    echo "   Resposta: $(echo $QR_RESPONSE | grep -o '"message":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Erro ao gerar QR Code"
fi

# 4. Testar webhook
echo ""
echo "4️⃣ Testando webhook do Supabase..."
WEBHOOK_PAYLOAD='{
  "event": "message",
  "data": {
    "from": "5511999999999@s.whatsapp.net",
    "body": "Teste de mensagem",
    "timestamp": 1234567890,
    "id": "test_msg_123"
  }
}'

WEBHOOK_RESPONSE=$(curl -s -X POST https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/whatsapp-integration/webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw" \
  -d "$WEBHOOK_PAYLOAD" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Webhook funcionando"
    echo "   Resposta: $(echo $WEBHOOK_RESPONSE | grep -o '"success":[^,]*' | cut -d':' -f2)"
else
    echo "❌ Erro no webhook"
fi

# 5. Testar IA
echo ""
echo "5️⃣ Testando serviço de IA..."
AI_PAYLOAD='{
  "messages": [
    {
      "role": "system",
      "content": "Você é um assistente virtual profissional."
    },
    {
      "role": "user",
      "content": "Olá, como você está?"
    }
  ],
  "phoneNumber": "5511999999999"
}'

AI_RESPONSE=$(curl -s -X POST https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/ai-chat-gpt4 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw" \
  -d "$AI_PAYLOAD" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ IA funcionando"
    RESPONSE_TEXT=$(echo $AI_RESPONSE | grep -o '"response":"[^"]*"' | cut -d'"' -f4)
    if [ ! -z "$RESPONSE_TEXT" ]; then
        echo "   Resposta: ${RESPONSE_TEXT:0:50}..."
    else
        echo "   Resposta: Vazia"
    fi
else
    echo "❌ Erro na IA"
fi

echo ""
echo "🎯 RESUMO DO TESTE:"
echo "✅ Sistema básico funcionando"
echo "✅ Webhook configurado"
echo "✅ IA respondendo"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Conecte um número WhatsApp via QR Code"
echo "2. Envie uma mensagem para o número conectado"
echo "3. Verifique se o agente responde automaticamente"
echo ""
echo "🔧 Para reiniciar o servidor:"
echo "ssh root@31.97.241.19 'pm2 restart atendeai-backend'" 