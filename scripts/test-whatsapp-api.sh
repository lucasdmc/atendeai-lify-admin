#!/bin/bash

echo "🧪 TESTANDO API DO WHATSAPP DIRETAMENTE..."
echo "=============================================="

# Testar com curl direto para a API do WhatsApp
echo "1️⃣ Testando envio direto para API do WhatsApp..."

curl -X POST "https://graph.facebook.com/v18.0/698766983327246/messages" \
  -H "Authorization: Bearer EAASAuWYr9JgBPEeguFf9DdIIHxVis2TBtAgYE4D5owA8vsYwpBDIEwqNIDlsMh3D3XrYCZCvRCMODlZCweNoGpwi5U64VVnoySxKlQWii9ZALnxnGvZA4yE5b2wlCBEUWFsiZCIe9z2th7YH6nnoAyw0jA3vO5ITgUKha9xxGZCVx6ZBBGTxMFIdkjaJtBhN2IFgaVFLv8idZCNm1PWDHBpDKqn9B0Tv5ZBtRHqTYODvhN1FFPABFaGYxkW0KURUZD" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "4730915628",
    "type": "text",
    "text": { "body": "Teste direto da API" }
  }'

echo ""
echo ""

echo "2️⃣ Verificando logs do servidor..."
ssh root@api.atendeai.lify.com.br "pm2 logs atendeai-backend --lines 10"

echo ""
echo "✅ TESTE CONCLUÍDO!" 