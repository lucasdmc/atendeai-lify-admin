#!/bin/bash

echo "🚀 APLICANDO CORREÇÕES NA VPS"
echo "=============================="

# 1. Navegar para o diretório da aplicação
cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# 2. Fazer backup das configurações atuais
echo "💾 Fazendo backup..."
cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)

# 3. Aplicar configurações unificadas
echo "📝 Aplicando configurações..."
cp .env.production.unified .env.production

# 4. Verificar se o Node.js está rodando
echo "🔍 Verificando Node.js..."
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "💡 Iniciando Node.js..."
    pm2 start server.js --name "atendeai-backend" || echo "⚠️ Erro ao iniciar Node.js"
fi

# 5. Testar webhook
echo "🧪 Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \
  -s

echo ""
echo "✅ Correções aplicadas!"
echo "📱 Agora teste enviando uma mensagem no WhatsApp"
