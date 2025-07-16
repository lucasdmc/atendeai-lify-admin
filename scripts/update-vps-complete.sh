#!/bin/bash

echo "🚀 ATUALIZANDO VPS - ATENDEAI LIFY ADMIN"
echo "=========================================="

# Caminho do projeto na VPS
PROJECT_PATH="/home/lucascantoni/Lify-AtendeAI/atendeai-lify-admin/atendeai-lify-admin"

echo "📁 Acessando diretório do projeto..."
cd $PROJECT_PATH

echo "📥 Atualizando repositório..."
git pull origin main

echo "📦 Instalando dependências..."
npm install

echo "🔧 Verificando se o servidor está rodando..."
if pgrep -f "server.js" > /dev/null; then
    echo "🛑 Parando servidor atual..."
    pkill -f "server.js"
    sleep 2
fi

echo "🚀 Iniciando servidor com código atualizado..."
nohup node server.js > logs.txt 2>&1 &

echo "⏳ Aguardando servidor inicializar..."
sleep 5

echo "🔍 Verificando se o servidor está respondendo..."
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Servidor iniciado com sucesso!"
else
    echo "❌ Erro: Servidor não está respondendo"
    echo "📋 Logs do servidor:"
    tail -20 logs.txt
    exit 1
fi

echo "🧪 Testando endpoints..."
echo ""

echo "1. Testando health check..."
curl -s http://localhost:3001/health | jq .

echo ""
echo "2. Testando geração de QR Code..."
curl -s -X POST "http://localhost:3001/api/whatsapp/generate-qr" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent"}' | jq .

echo ""
echo "3. Testando status endpoint..."
curl -s "http://localhost:3001/api/whatsapp/status/test-agent" | jq .

echo ""
echo "4. Testando disconnect endpoint..."
curl -s -X POST "http://localhost:3001/api/whatsapp/disconnect" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent"}' | jq .

echo ""
echo "5. Testando clear sessions..."
curl -s -X POST "http://localhost:3001/api/whatsapp/clear-sessions" | jq .

echo ""
echo "6. Testando reset session..."
curl -s -X POST "http://localhost:3001/api/whatsapp/reset-session" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent"}' | jq .

echo ""
echo "7. Testando refresh QR..."
curl -s -X POST "http://localhost:3001/api/whatsapp/refresh-qr" \
  -H "Content-Type: application/json" \
  -d '{"agentId": "test-agent"}' | jq .

echo ""
echo "🎉 ATUALIZAÇÃO CONCLUÍDA!"
echo "📋 Para ver logs em tempo real: tail -f logs.txt"
echo "🌐 Servidor rodando em: http://31.97.241.19:3001"
echo "📊 Status do processo: ps aux | grep server.js" 