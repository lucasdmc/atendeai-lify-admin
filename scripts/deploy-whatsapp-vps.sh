#!/bin/bash

echo "🚀 Deploy do WhatsApp Server na VPS"
echo "=================================="

# Verificar se estamos no diretório correto
if [ ! -f "server.js" ]; then
    echo "❌ Erro: Execute este script dentro da pasta LifyChatbot-Node-Server"
    exit 1
fi

# Atualizar URLs do webhook
echo ""
echo "🔧 Atualizando URLs do webhook..."

OLD_URL="https://lify-chatbot-production.up.railway.app/webhook/whatsapp"
NEW_URL="http://31.97.241.19:3001/webhook/whatsapp"

# Fazer backup e atualizar server.js
if [ -f "server.js" ]; then
    echo "📝 Atualizando server.js..."
    cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
    sed -i "s|$OLD_URL|$NEW_URL|g" server.js
    echo "✅ server.js atualizado"
fi

# Atualizar env.example
if [ -f "env.example" ]; then
    echo "📝 Atualizando env.example..."
    cp env.example env.example.backup.$(date +%Y%m%d_%H%M%S)
    sed -i "s|$OLD_URL|$NEW_URL|g" env.example
    echo "✅ env.example atualizado"
fi

# Atualizar README.md
if [ -f "README.md" ]; then
    echo "📝 Atualizando README.md..."
    cp README.md README.md.backup.$(date +%Y%m%d_%H%M%S)
    sed -i "s|$OLD_URL|$NEW_URL|g" README.md
    echo "✅ README.md atualizado"
fi

echo ""
echo "🎯 URLs atualizadas com sucesso!"
echo "📍 Nova URL do webhook: $NEW_URL"

# Parar o servidor se estiver rodando
echo ""
echo "🛑 Parando servidor atual..."
pm2 stop atendeai-backend 2>/dev/null || echo "Servidor não estava rodando"

# Iniciar o servidor com PM2
echo ""
echo "🚀 Iniciando servidor com PM2..."
pm2 start server.js --name atendeai-backend

# Verificar status
echo ""
echo "📊 Status do servidor:"
pm2 list

# Testar endpoints
echo ""
echo "🧪 Testando endpoints..."

# Teste 1: Health check
echo "1️⃣ Testando health check..."
curl -s http://localhost:3001/health
echo ""

# Teste 2: Webhook
echo "2️⃣ Testando webhook..."
curl -s -X POST http://localhost:3001/webhook/whatsapp -H "Content-Type: application/json" -d '{"test":"webhook"}'
echo ""

# Teste 3: QR Code
echo "3️⃣ Testando geração de QR Code..."
curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr -H "Content-Type: application/json" -d '{"agentId":"test"}'
echo ""

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📋 Informações importantes:"
echo "📍 Servidor: http://31.97.241.19:3001"
echo "📍 Webhook: http://31.97.241.19:3001/webhook/whatsapp"
echo "📍 Health: http://31.97.241.19:3001/health"
echo ""
echo "📋 Comandos úteis:"
echo "• Ver logs: pm2 logs atendeai-backend"
echo "• Reiniciar: pm2 restart atendeai-backend"
echo "• Parar: pm2 stop atendeai-backend"
echo "• Status: pm2 list"
echo "" 