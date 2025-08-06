#!/bin/bash

# ========================================
# ATUALIZAR TOKEN NO RAILWAY VIA CURL
# ========================================

echo "🔄 ATUALIZANDO TOKEN NO RAILWAY VIA CURL"
echo "=========================================="
echo ""

# Novo token do WhatsApp
NEW_TOKEN="EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD"

echo "🔑 1. Para atualizar via curl, você precisa do token da API do Railway"
echo "⚠️  Para obter o token:"
echo "   1. Acesse: https://railway.app/dashboard"
echo "   2. Vá em: Settings → Tokens"
echo "   3. Clique em 'Create Token'"
echo "   4. Copie o token (começa com rw_...)"
echo ""

read -p "🔑 Cole o token da API do Railway (rw_...): " RAILWAY_TOKEN

if [[ ! $RAILWAY_TOKEN =~ ^rw_ ]]; then
    echo "❌ Token inválido! Deve começar com 'rw_'"
    exit 1
fi

echo ""
echo "📁 2. Agora precisamos do Project ID"
echo "⚠️  Para obter o Project ID:"
echo "   1. Acesse: https://railway.app/dashboard"
echo "   2. Selecione o projeto: atendeai-lify-backend"
echo "   3. Copie o Project ID da URL ou das configurações"
echo ""

read -p "📁 Cole o Project ID: " PROJECT_ID

echo ""
echo "⚙️ 3. Atualizando token via API do Railway..."

# Fazer a requisição para atualizar a variável
RESPONSE=$(curl -s -X POST "https://backboard.railway.app/graphql/v2" \
  -H "Authorization: Bearer $RAILWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"mutation UpdateVariable(\$projectId: String!, \$name: String!, \$value: String!) { updateVariable(projectId: \$projectId, name: \$name, value: \$value) { id name value } }\",
    \"variables\": {
      \"projectId\": \"$PROJECT_ID\",
      \"name\": \"WHATSAPP_META_ACCESS_TOKEN\",
      \"value\": \"$NEW_TOKEN\"
    }
  }")

if [[ $RESPONSE == *"errors"* ]]; then
    echo "❌ Erro ao atualizar token:"
    echo "$RESPONSE"
else
    echo "✅ Token atualizado com sucesso!"
    echo "⏳ Aguarde 1-2 minutos para o deploy automático..."
    echo ""
    
    echo "🧪 4. Testando após atualização..."
    echo "Aguarde 2 minutos e depois execute:"
    echo "node test-railway-token.js"
    echo ""
    
    echo "📱 5. Teste manual:"
    echo "Envie uma mensagem para: +55 47 3091-5628"
    echo "Verifique se recebe resposta automática"
    echo ""
    
    echo "✅ ATUALIZAÇÃO CONCLUÍDA!"
    echo "=========================================="
fi 