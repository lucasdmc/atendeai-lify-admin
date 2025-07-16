#!/bin/bash

# Script para atualizar URLs do webhook do Railway para a VPS da Hostinger

echo "🔧 Atualizando URLs do webhook..."

# Definir as URLs
OLD_URL="https://lify-chatbot-production.up.railway.app/webhook/whatsapp"
NEW_URL="http://31.97.241.19:3001/webhook/whatsapp"

# Função para fazer backup
backup_file() {
    local file=$1
    if [ -f "$file" ]; then
        cp "$file" "${file}.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ Backup criado: ${file}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
}

# Atualizar server.js
if [ -f "server.js" ]; then
    echo "📝 Atualizando server.js..."
    backup_file "server.js"
    sed -i "s|$OLD_URL|$NEW_URL|g" server.js
    echo "✅ server.js atualizado"
fi

# Atualizar env.example
if [ -f "env.example" ]; then
    echo "📝 Atualizando env.example..."
    backup_file "env.example"
    sed -i "s|$OLD_URL|$NEW_URL|g" env.example
    echo "✅ env.example atualizado"
fi

# Atualizar README.md
if [ -f "README.md" ]; then
    echo "📝 Atualizando README.md..."
    backup_file "README.md"
    sed -i "s|$OLD_URL|$NEW_URL|g" README.md
    echo "✅ README.md atualizado"
fi

echo ""
echo "🎯 URLs atualizadas com sucesso!"
echo "📍 Nova URL do webhook: $NEW_URL"
echo ""
echo "📋 Próximos passos:"
echo "1. Reinicie o servidor: pm2 restart atendeai-backend"
echo "2. Teste o webhook: curl -X POST $NEW_URL -H 'Content-Type: application/json' -d '{\"test\":\"webhook\"}'"
echo "3. Teste o QR Code: curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr -H 'Content-Type: application/json' -d '{\"agentId\":\"test\"}'"
echo "" 