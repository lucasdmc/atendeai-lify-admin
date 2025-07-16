#!/bin/bash

# Script para debug da conexão WhatsApp entre Edge Function e backend VPS
# Autor: Assistente Claude
# Data: $(date)

set -e  # Para o script se qualquer comando falhar

echo "🔍 Iniciando debug da conexão WhatsApp..."
echo "=========================================="

# Configurações
BACKUP_FILE="/root/LifyChatbot-Node-Server/server.js.backup"
SERVER_FILE="/root/LifyChatbot-Node-Server/server.js"
LOG_FILE="/tmp/whatsapp-debug-$(date +%Y%m%d-%H%M%S).log"

# Função para fazer backup
backup_server() {
    echo "📦 Fazendo backup do arquivo server.js..."
    if [ -f "$SERVER_FILE" ]; then
        cp "$SERVER_FILE" "$BACKUP_FILE"
        echo "✅ Backup criado: $BACKUP_FILE"
    else
        echo "❌ Arquivo server.js não encontrado em $SERVER_FILE"
        exit 1
    fi
}

# Função para adicionar logs de debug
add_debug_logs() {
    echo "🔧 Adicionando logs de debug ao endpoint /api/whatsapp/generate-qr..."
    
    # Criar arquivo temporário com as modificações
    cat > /tmp/server_debug.js << 'EOF'
// Adicionar no início do arquivo, após os imports
const fs = require('fs');

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
        userAgent: req.get('User-Agent')
    };
    
    console.log('🔍 DEBUG REQUEST:', JSON.stringify(logEntry, null, 2));
    
    // Salvar em arquivo também
    fs.appendFileSync('/tmp/whatsapp-requests.log', 
        JSON.stringify(logEntry, null, 2) + '\n---\n');
}

// Adicionar antes do endpoint /api/whatsapp/generate-qr
app.post('/api/whatsapp/generate-qr', async (req, res) => {
    logRequestDetails(req, '/api/whatsapp/generate-qr');
    
    try {
        console.log('🚀 Iniciando geração de QR Code...');
        console.log('📋 Headers recebidos:', JSON.stringify(req.headers, null, 2));
        console.log('📦 Body recebido:', JSON.stringify(req.body, null, 2));
        
        // ... resto do código original ...
EOF

    # Aplicar as modificações ao arquivo original
    # Primeiro, vamos localizar o endpoint e adicionar os logs
    if grep -q "app.post.*generate-qr" "$SERVER_FILE"; then
        echo "✅ Endpoint encontrado, aplicando logs de debug..."
        
        # Fazer backup antes de modificar
        backup_server
        
        # Adicionar imports no início do arquivo
        sed -i '1i const fs = require("fs");' "$SERVER_FILE"
        
        # Adicionar função de log antes do endpoint
        sed -i '/app.post.*generate-qr/i\
// Função para log detalhado\
function logRequestDetails(req, endpoint) {\
    const logEntry = {\
        timestamp: new Date().toISOString(),\
        endpoint: endpoint,\
        method: req.method,\
        url: req.url,\
        headers: req.headers,\
        body: req.body,\
        query: req.query,\
        ip: req.ip || req.connection.remoteAddress,\
        userAgent: req.get("User-Agent")\
    };\
    \
    console.log("🔍 DEBUG REQUEST:", JSON.stringify(logEntry, null, 2));\
    \
    fs.appendFileSync("/tmp/whatsapp-requests.log", \
        JSON.stringify(logEntry, null, 2) + "\\n---\\n");\
}\
' "$SERVER_FILE"
        
        # Adicionar chamada de log no início do endpoint
        sed -i '/app.post.*generate-qr/,/async.*req.*res/{/async.*req.*res/a\
    logRequestDetails(req, "/api/whatsapp/generate-qr");\
    console.log("🚀 Iniciando geração de QR Code...");\
    console.log("📋 Headers recebidos:", JSON.stringify(req.headers, null, 2));\
    console.log("📦 Body recebido:", JSON.stringify(req.body, null, 2));\
}' "$SERVER_FILE"
        
        echo "✅ Logs de debug adicionados com sucesso!"
    else
        echo "❌ Endpoint /api/whatsapp/generate-qr não encontrado no arquivo"
        exit 1
    fi
}

# Função para reiniciar o backend
restart_backend() {
    echo "🔄 Reiniciando backend WhatsApp..."
    
    # Parar o processo atual
    pm2 stop LifyChatbot-Node-Server 2>/dev/null || true
    
    # Aguardar um pouco
    sleep 2
    
    # Iniciar novamente
    pm2 start /root/LifyChatbot-Node-Server/server.js --name LifyChatbot-Node-Server
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se está rodando
    if pm2 list | grep -q "LifyChatbot-Node-Server.*online"; then
        echo "✅ Backend reiniciado com sucesso!"
    else
        echo "❌ Erro ao reiniciar backend"
        pm2 logs LifyChatbot-Node-Server --lines 10
        exit 1
    fi
}

# Função para testar conexão direta
test_direct_connection() {
    echo "🧪 Testando conexão direta com backend..."
    
    # Teste simples de conectividade
    if curl -s http://localhost:3001/health > /dev/null 2>&1; then
        echo "✅ Backend responde na porta 3001"
    else
        echo "❌ Backend não responde na porta 3001"
    fi
    
    # Teste do endpoint de QR Code
    echo "🧪 Testando endpoint de QR Code..."
    RESPONSE=$(curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr \
        -H "Content-Type: application/json" \
        -d '{"agentId": "test-debug-script"}' 2>/dev/null || echo "ERRO")
    
    if [[ "$RESPONSE" != "ERRO" ]]; then
        echo "✅ Endpoint responde diretamente"
        echo "📄 Resposta: $RESPONSE"
    else
        echo "❌ Endpoint não responde diretamente"
    fi
}

# Função para monitorar logs
monitor_logs() {
    echo "📊 Monitorando logs em tempo real..."
    echo "💡 Pressione Ctrl+C para parar o monitoramento"
    echo "=========================================="
    
    # Limpar arquivo de logs anterior
    > /tmp/whatsapp-requests.log
    
    # Monitorar logs do PM2
    pm2 logs LifyChatbot-Node-Server --lines 0 &
    PM2_LOG_PID=$!
    
    # Monitorar arquivo de requests
    tail -f /tmp/whatsapp-requests.log &
    TAIL_LOG_PID=$!
    
    echo "🔍 Logs sendo monitorados..."
    echo "📝 Arquivo de requests: /tmp/whatsapp-requests.log"
    echo "📊 Logs PM2: pm2 logs LifyChatbot-Node-Server"
    echo ""
    echo "💡 Agora teste a geração de QR Code pelo frontend!"
    echo "⏰ Aguardando 60 segundos para capturar logs..."
    
    # Aguardar 60 segundos
    sleep 60
    
    # Parar monitoramento
    kill $PM2_LOG_PID 2>/dev/null || true
    kill $TAIL_LOG_PID 2>/dev/null || true
    
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
}

# Função para restaurar backup
restore_backup() {
    echo "🔄 Restaurando backup original..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$SERVER_FILE"
        echo "✅ Backup restaurado"
        restart_backend
    else
        echo "❌ Arquivo de backup não encontrado"
    fi
}

# Menu principal
show_menu() {
    echo ""
    echo "🔧 Menu de Debug WhatsApp"
    echo "========================="
    echo "1. Adicionar logs de debug"
    echo "2. Reiniciar backend"
    echo "3. Testar conexão direta"
    echo "4. Monitorar logs (60s)"
    echo "5. Executar debug completo"
    echo "6. Restaurar backup original"
    echo "7. Sair"
    echo ""
    read -p "Escolha uma opção (1-7): " choice
    
    case $choice in
        1) add_debug_logs ;;
        2) restart_backend ;;
        3) test_direct_connection ;;
        4) monitor_logs ;;
        5) 
            echo "🚀 Executando debug completo..."
            add_debug_logs
            restart_backend
            test_direct_connection
            monitor_logs
            ;;
        6) restore_backup ;;
        7) echo "👋 Saindo..."; exit 0 ;;
        *) echo "❌ Opção inválida"; show_menu ;;
    esac
}

# Verificar se estamos na VPS
if [[ "$(hostname)" != *"vps"* ]] && [[ "$(hostname)" != *"server"* ]]; then
    echo "⚠️  Este script deve ser executado na VPS do backend"
    echo "💡 Execute: ssh root@SEU_IP_VPS"
    exit 1
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 não está instalado"
    echo "💡 Instale com: npm install -g pm2"
    exit 1
fi

# Verificar se o arquivo server.js existe
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ Arquivo server.js não encontrado em $SERVER_FILE"
    exit 1
fi

echo "✅ Ambiente verificado"
echo "📍 VPS: $(hostname)"
echo "📁 Servidor: $SERVER_FILE"
echo ""

# Executar menu se não houver argumentos
if [ $# -eq 0 ]; then
    show_menu
else
    # Executar comando direto
    case $1 in
        "add-logs") add_debug_logs ;;
        "restart") restart_backend ;;
        "test") test_direct_connection ;;
        "monitor") monitor_logs ;;
        "full") 
            add_debug_logs
            restart_backend
            test_direct_connection
            monitor_logs
            ;;
        "restore") restore_backup ;;
        *) echo "❌ Comando inválido: $1"; exit 1 ;;
    esac
fi 