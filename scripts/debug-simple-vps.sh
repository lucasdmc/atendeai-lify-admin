#!/bin/bash

# Script Simplificado de Debug - VPS AtendeAI
# Execute diretamente na VPS

echo "🔍 Debug Simplificado - VPS AtendeAI"
echo "===================================="

# Configurações
SERVER_FILE="/root/LifyChatbot-Node-Server/server.js"
BACKUP_FILE="/root/LifyChatbot-Node-Server/server.js.backup"

echo "📍 VPS: $(hostname)"
echo "📁 Servidor: $SERVER_FILE"
echo ""

# 1. Fazer backup
echo "📦 1. Fazendo backup..."
cp "$SERVER_FILE" "$BACKUP_FILE"
echo "✅ Backup criado: $BACKUP_FILE"

# 2. Verificar se o endpoint existe
echo ""
echo "🔍 2. Verificando endpoint..."
if grep -q "app.post.*generate-qr" "$SERVER_FILE"; then
    echo "✅ Endpoint encontrado"
else
    echo "❌ Endpoint não encontrado"
    exit 1
fi

# 3. Adicionar logs de debug
echo ""
echo "🔧 3. Adicionando logs de debug..."

# Adicionar import fs se não existir
if ! grep -q "const fs = require" "$SERVER_FILE"; then
    sed -i '1i const fs = require("fs");' "$SERVER_FILE"
    echo "✅ Import fs adicionado"
fi

# Adicionar função de log antes do endpoint
LOG_FUNCTION='
// Função para log detalhado
function logRequestDetails(req, endpoint) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        endpoint: endpoint,
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body,
        query: req.query,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get("User-Agent")
    };
    
    console.log("🔍 DEBUG REQUEST:", JSON.stringify(logEntry, null, 2));
    
    fs.appendFileSync("/tmp/whatsapp-requests.log", 
        JSON.stringify(logEntry, null, 2) + "\\n---\\n");
}'

# Inserir função de log antes do endpoint
sed -i "/app.post.*generate-qr/i$LOG_FUNCTION" "$SERVER_FILE"
echo "✅ Função de log adicionada"

# Adicionar chamadas de log no endpoint
DEBUG_CALLS='
    logRequestDetails(req, "/api/whatsapp/generate-qr");
    console.log("🚀 Iniciando geração de QR Code...");
    console.log("📋 Headers recebidos:", JSON.stringify(req.headers, null, 2));
    console.log("📦 Body recebido:", JSON.stringify(req.body, null, 2));'

# Encontrar a linha do async e adicionar os logs
sed -i "/app.post.*generate-qr/,/async.*req.*res/{/async.*req.*res/a$DEBUG_CALLS}" "$SERVER_FILE"
echo "✅ Chamadas de debug adicionadas"

# 4. Reiniciar backend
echo ""
echo "🔄 4. Reiniciando backend..."
pm2 stop LifyChatbot-Node-Server 2>/dev/null || true
sleep 2
pm2 start /root/LifyChatbot-Node-Server/server.js --name LifyChatbot-Node-Server
sleep 3

if pm2 list | grep -q "LifyChatbot-Node-Server.*online"; then
    echo "✅ Backend reiniciado com sucesso!"
else
    echo "❌ Erro ao reiniciar backend"
    pm2 logs LifyChatbot-Node-Server --lines 10
    exit 1
fi

# 5. Testar conexão direta
echo ""
echo "🧪 5. Testando conexão direta..."
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend responde na porta 3001"
else
    echo "❌ Backend não responde na porta 3001"
fi

# Teste do endpoint
RESPONSE=$(curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr \
    -H "Content-Type: application/json" \
    -d '{"agentId": "test-debug-simple"}' 2>/dev/null || echo "ERRO")

if [[ "$RESPONSE" != "ERRO" ]]; then
    echo "✅ Endpoint responde diretamente"
    echo "📄 Resposta: $RESPONSE"
else
    echo "❌ Endpoint não responde diretamente"
fi

# 6. Monitorar logs
echo ""
echo "📊 6. Monitorando logs por 60 segundos..."
echo "💡 Teste a geração de QR Code pelo frontend agora!"
echo "⏰ Aguardando 60 segundos..."

# Limpar arquivo de logs
> /tmp/whatsapp-requests.log

# Monitorar logs
timeout 60s bash -c '
    echo "🔍 Monitorando logs..."
    pm2 logs LifyChatbot-Node-Server --lines 0 &
    PM2_PID=$!
    tail -f /tmp/whatsapp-requests.log &
    TAIL_PID=$!
    wait
    kill $PM2_PID 2>/dev/null || true
    kill $TAIL_PID 2>/dev/null || true
'

echo ""
echo "📋 Resumo dos logs capturados:"
echo "================================"

if [ -s /tmp/whatsapp-requests.log ]; then
    echo "✅ Requests capturados:"
    cat /tmp/whatsapp-requests.log
else
    echo "❌ Nenhum request foi capturado"
fi

echo ""
echo "📊 Últimos logs do PM2:"
pm2 logs LifyChatbot-Node-Server --lines 20

echo ""
echo "🎯 Debug concluído!"
echo "📝 Logs salvos em: /tmp/whatsapp-requests.log"
echo "🔄 Para restaurar backup: cp $BACKUP_FILE $SERVER_FILE && pm2 restart LifyChatbot-Node-Server" 