#!/bin/bash

# Script para upload e execução do debug script na VPS
# Autor: Assistente Claude

echo "🚀 Upload e execução do script de debug na VPS"
echo "=============================================="

# Configurações
VPS_IP="31.97.241.19"  # IP da VPS atendeai.server.com.br
VPS_USER="root"
DEBUG_SCRIPT="scripts/debug-whatsapp-connection.sh"
REMOTE_PATH="/root/debug-whatsapp-connection.sh"

# Verificar se o IP foi configurado
if [[ "$VPS_IP" == "SEU_IP_VPS" ]]; then
    echo "❌ Configure o IP da VPS no script primeiro!"
    echo "💡 Edite a variável VPS_IP neste arquivo"
    exit 1
fi

# Verificar se o script existe
if [ ! -f "$DEBUG_SCRIPT" ]; then
    echo "❌ Script de debug não encontrado: $DEBUG_SCRIPT"
    exit 1
fi

echo "📤 Fazendo upload do script para a VPS..."
echo "📍 VPS: $VPS_USER@$VPS_IP"
echo "📁 Arquivo: $DEBUG_SCRIPT -> $REMOTE_PATH"

# Upload do script
scp "$DEBUG_SCRIPT" "$VPS_USER@$VPS_IP:$REMOTE_PATH"

if [ $? -eq 0 ]; then
    echo "✅ Upload realizado com sucesso!"
    
    echo ""
    echo "🔧 Executando script na VPS..."
    echo "================================"
    
    # Executar o script na VPS
    ssh "$VPS_USER@$VPS_IP" "chmod +x $REMOTE_PATH && $REMOTE_PATH"
    
else
    echo "❌ Erro no upload do script"
    exit 1
fi 