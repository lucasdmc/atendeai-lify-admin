#!/bin/bash

# Script de Debug para VPS AtendeAI
# VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)
# Autor: Assistente Claude

echo "🚀 Debug WhatsApp - VPS AtendeAI"
echo "================================="
echo "📍 VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)"
echo "👤 Usuário: root"
echo "📁 Servidor: /root/LifyChatbot-Node-Server/server.js"
echo ""

# Configurações da VPS
VPS_IP="atendeai-backend-production.up.railway.app"
VPS_HOST="atendeai.server.com.br"
VPS_USER="root"
SERVER_FILE="/root/LifyChatbot-Node-Server/server.js"
BACKUP_FILE="/root/LifyChatbot-Node-Server/server.js.backup"
DEBUG_SCRIPT="scripts/debug-whatsapp-connection.sh"
MANUAL_SCRIPT="scripts/execute-debug-manual.sh"

# Função para testar conectividade
test_connectivity() {
    echo "🔍 Testando conectividade com a VPS..."
    
    if ping -c 1 $VPS_IP > /dev/null 2>&1; then
        echo "✅ VPS responde ao ping"
    else
        echo "❌ VPS não responde ao ping"
        return 1
    fi
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_IP "echo 'SSH OK'" 2>/dev/null; then
        echo "✅ SSH conecta com sucesso"
    else
        echo "❌ Erro na conexão SSH"
        return 1
    fi
}

# Função para upload e execução
upload_and_execute() {
    echo ""
    echo "📤 Fazendo upload dos scripts para a VPS..."
    
    # Upload do script principal
    if scp "$DEBUG_SCRIPT" "$VPS_USER@$VPS_IP:/root/debug-whatsapp-connection.sh"; then
        echo "✅ Script principal enviado"
    else
        echo "❌ Erro no upload do script principal"
        return 1
    fi
    
    # Upload do script manual
    if scp "$MANUAL_SCRIPT" "$VPS_USER@$VPS_IP:/root/execute-debug-manual.sh"; then
        echo "✅ Script manual enviado"
    else
        echo "❌ Erro no upload do script manual"
        return 1
    fi
    
    echo ""
    echo "🔧 Executando debug na VPS..."
    echo "================================"
    
    # Executar o script na VPS
    ssh "$VPS_USER@$VPS_IP" "chmod +x /root/debug-whatsapp-connection.sh && /root/debug-whatsapp-connection.sh"
}

# Função para execução direta
execute_direct() {
    echo ""
    echo "🔧 Executando debug direto na VPS..."
    echo "====================================="
    
    ssh "$VPS_USER@$VPS_IP" "chmod +x /root/execute-debug-manual.sh && /root/execute-debug-manual.sh"
}

# Função para monitorar logs remotos
monitor_remote_logs() {
    echo ""
    echo "📊 Monitorando logs remotos da VPS..."
    echo "====================================="
    
    ssh "$VPS_USER@$VPS_IP" "pm2 logs LifyChatbot-Node-Server --lines 0"
}

# Função para verificar status do backend
check_backend_status() {
    echo ""
    echo "🔍 Verificando status do backend na VPS..."
    echo "=========================================="
    
    ssh "$VPS_USER@$VPS_IP" "
        echo '📋 Status do PM2:'
        pm2 list
        
        echo ''
        echo '📊 Logs recentes:'
        pm2 logs LifyChatbot-Node-Server --lines 10
        
        echo ''
        echo '🌐 Teste de conectividade:'
        curl -s http://localhost:3001/health || echo '❌ Backend não responde'
    "
}

# Função para restaurar backup remoto
restore_remote_backup() {
    echo ""
    echo "🔄 Restaurando backup na VPS..."
    echo "==============================="
    
    ssh "$VPS_USER@$VPS_IP" "
        if [ -f $BACKUP_FILE ]; then
            cp $BACKUP_FILE $SERVER_FILE
            pm2 restart LifyChatbot-Node-Server
            echo '✅ Backup restaurado e backend reiniciado'
        else
            echo '❌ Arquivo de backup não encontrado'
        fi
    "
}

# Menu principal
show_menu() {
    echo ""
    echo "🔧 Menu de Debug - VPS AtendeAI"
    echo "================================"
    echo "1. Testar conectividade"
    echo "2. Upload e execução completa"
    echo "3. Execução direta (script manual)"
    echo "4. Monitorar logs remotos"
    echo "5. Verificar status do backend"
    echo "6. Restaurar backup remoto"
    echo "7. Conectar via SSH"
    echo "8. Sair"
    echo ""
    read -p "Escolha uma opção (1-8): " choice
    
    case $choice in
        1) test_connectivity ;;
        2) upload_and_execute ;;
        3) execute_direct ;;
        4) monitor_remote_logs ;;
        5) check_backend_status ;;
        6) restore_remote_backup ;;
        7) 
            echo "🔗 Conectando via SSH..."
            ssh "$VPS_USER@$VPS_IP"
            ;;
        8) echo "👋 Saindo..."; exit 0 ;;
        *) echo "❌ Opção inválida"; show_menu ;;
    esac
}

# Verificar se os scripts existem
if [ ! -f "$DEBUG_SCRIPT" ]; then
    echo "❌ Script de debug não encontrado: $DEBUG_SCRIPT"
    exit 1
fi

if [ ! -f "$MANUAL_SCRIPT" ]; then
    echo "❌ Script manual não encontrado: $MANUAL_SCRIPT"
    exit 1
fi

echo "✅ Scripts encontrados"
echo "📁 Debug: $DEBUG_SCRIPT"
echo "📁 Manual: $MANUAL_SCRIPT"
echo ""

# Executar menu se não houver argumentos
if [ $# -eq 0 ]; then
    show_menu
else
    # Executar comando direto
    case $1 in
        "test") test_connectivity ;;
        "upload") upload_and_execute ;;
        "direct") execute_direct ;;
        "logs") monitor_remote_logs ;;
        "status") check_backend_status ;;
        "restore") restore_remote_backup ;;
        "ssh") ssh "$VPS_USER@$VPS_IP" ;;
        *) echo "❌ Comando inválido: $1"; exit 1 ;;
    esac
fi 