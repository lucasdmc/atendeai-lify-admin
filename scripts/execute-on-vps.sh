#!/bin/bash

echo "🔧 Executando configuração automática na VPS..."
echo ""

# Entrar na pasta do projeto
cd /root/LifyChatbot-Node-Server

# Atualizar URLs do webhook
echo "📝 Atualizando URLs do webhook..."

OLD_URL="https://lify-chatbot-production.up.railway.app/webhook/whatsapp"
NEW_URL="http://31.97.241.19:3001/webhook/whatsapp"

# Fazer backup e atualizar server.js
cp server.js server.js.backup.$(date +%Y%m%d_%H%M%S)
sed -i "s|$OLD_URL|$NEW_URL|g" server.js
echo "✅ server.js atualizado"

# Atualizar env.example
cp env.example env.example.backup.$(date +%Y%m%d_%H%M%S)
sed -i "s|$OLD_URL|$NEW_URL|g" env.example
echo "✅ env.example atualizado"

# Atualizar README.md
cp README.md README.md.backup.$(date +%Y%m%d_%H%M%S)
sed -i "s|$OLD_URL|$NEW_URL|g" README.md
echo "✅ README.md atualizado"

echo ""
echo "🎯 URLs atualizadas com sucesso!"

# Parar servidor atual
echo ""
echo "🛑 Parando servidor atual..."
pm2 stop atendeai-backend 2>/dev/null || echo "Servidor não estava rodando"

# Iniciar com PM2
echo ""
echo "🚀 Iniciando servidor com PM2..."
pm2 start server.js --name atendeai-backend

# Mostrar status
echo ""
echo "📊 Status do servidor:"
pm2 list

# Testar endpoints
echo ""
echo "🧪 Testando endpoints..."
echo "1️⃣ Health check:"
curl -s http://localhost:3001/health
echo ""
echo "2️⃣ Webhook:"
curl -s -X POST http://localhost:3001/webhook/whatsapp -H "Content-Type: application/json" -d '{"test":"webhook"}'
echo ""
echo "3️⃣ QR Code:"
curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr -H "Content-Type: application/json" -d '{"agentId":"test"}'
echo ""

echo ""
echo "✅ Configuração concluída!"
echo "📍 Nova URL do webhook: $NEW_URL" 