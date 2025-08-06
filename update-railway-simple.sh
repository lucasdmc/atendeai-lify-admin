#!/bin/bash

# ========================================
# ATUALIZAR TOKEN NO RAILWAY VIA CLI
# ========================================

echo "🔄 ATUALIZANDO TOKEN NO RAILWAY VIA CLI"
echo "=========================================="
echo ""

# Novo token do WhatsApp
NEW_TOKEN="EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD"

echo "🔑 1. Verificando se o Railway CLI está instalado..."
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não está instalado!"
    echo "📦 Instalando Railway CLI..."
    npm install -g @railway/cli
else
    echo "✅ Railway CLI está instalado"
fi
echo ""

echo "🔐 2. Fazendo login no Railway..."
railway login
echo ""

echo "📁 3. Listando projetos disponíveis..."
railway projects
echo ""

echo "⚙️ 4. Atualizando variável WHATSAPP_META_ACCESS_TOKEN..."
echo "Projeto: atendeai-lify-backend"
echo "Variável: WHATSAPP_META_ACCESS_TOKEN"
echo ""

# Atualizar a variável usando o Railway CLI
railway variables set WHATSAPP_META_ACCESS_TOKEN="$NEW_TOKEN" --project atendeai-lify-backend

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Token atualizado com sucesso!"
    echo "⏳ Aguarde 1-2 minutos para o deploy automático..."
    echo ""
    
    echo "🧪 5. Testando após atualização..."
    echo "Aguarde 2 minutos e depois execute:"
    echo "node test-railway-token.js"
    echo ""
    
    echo "📱 6. Teste manual:"
    echo "Envie uma mensagem para: +55 47 3091-5628"
    echo "Verifique se recebe resposta automática"
    echo ""
    
    echo "✅ ATUALIZAÇÃO CONCLUÍDA!"
    echo "=========================================="
else
    echo ""
    echo "❌ Erro ao atualizar token!"
    echo "Verifique se você está logado e tem permissões no projeto."
    echo ""
fi 