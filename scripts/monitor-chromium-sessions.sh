#!/bin/bash

echo "🔍 MONITORAMENTO AUTOMÁTICO - Sessões Chromium"
echo "==============================================="

# Configurações da VPS
VPS_HOST="31.97.241.19"
VPS_USER="root"

# Função para log colorido
log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

warn() {
    echo -e "\033[1;33m[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1\033[0m"
}

error() {
    echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

# Verificar processos Chrome
check_chrome_processes() {
    local chrome_count=$(ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "ps aux | grep -E '(chrome|chromium)' | grep -v grep | wc -l")
    
    if [ "$chrome_count" -gt 3 ]; then
        warn "Múltiplos processos Chrome detectados: $chrome_count"
        return 1
    elif [ "$chrome_count" -gt 1 ]; then
        warn "Possível conflito de sessões: $chrome_count processos Chrome"
        return 1
    else
        log "✅ Processos Chrome OK: $chrome_count"
        return 0
    fi
}

# Verificar uso de memória
check_memory_usage() {
    local memory_usage=$(ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "free | grep Mem | awk '{printf \"%.0f\", \$3/\$2 * 100.0}'")
    
    if [ "$memory_usage" -gt 80 ]; then
        error "Uso de memória alto: ${memory_usage}%"
        return 1
    elif [ "$memory_usage" -gt 60 ]; then
        warn "Uso de memória elevado: ${memory_usage}%"
        return 1
    else
        log "✅ Uso de memória OK: ${memory_usage}%"
        return 0
    fi
}

# Verificar status do servidor
check_server_status() {
    local health_response=$(curl -s http://$VPS_HOST:3001/health)
    
    if [ $? -eq 0 ] && echo "$health_response" | grep -q "status.*ok"; then
        log "✅ Servidor WhatsApp OK"
        return 0
    else
        error "❌ Servidor WhatsApp não responde"
        return 1
    fi
}

# Limpeza automática se necessário
auto_cleanup() {
    log "🧹 Iniciando limpeza automática..."
    
    ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
        echo "🔪 Matando processos Chrome excessivos..."
        pkill -f chrome 2>/dev/null || echo "Nenhum processo Chrome encontrado"
        
        echo "🧹 Limpando cache..."
        rm -rf /root/.cache/chromium 2>/dev/null || echo "Cache já estava limpo"
        rm -rf /root/LifyChatbot-Node-Server/.wwebjs_auth/* 2>/dev/null || echo "Sessões já estavam limpas"
        
        echo "🔄 Reiniciando servidor..."
        pm2 restart atendeai-backend 2>/dev/null || echo "Servidor não estava rodando"
        
        echo "⏳ Aguardando 5 segundos..."
        sleep 5
EOF
    
    log "✅ Limpeza automática concluída"
}

# Função principal de monitoramento
main_monitoring() {
    log "🔍 Iniciando verificação..."
    
    local issues=0
    
    # Verificar processos Chrome
    if ! check_chrome_processes; then
        ((issues++))
    fi
    
    # Verificar uso de memória
    if ! check_memory_usage; then
        ((issues++))
    fi
    
    # Verificar status do servidor
    if ! check_server_status; then
        ((issues++))
    fi
    
    # Se há problemas, fazer limpeza automática
    if [ $issues -gt 0 ]; then
        warn "⚠️ $issues problema(s) detectado(s)"
        auto_cleanup
    else
        log "✅ Sistema funcionando normalmente"
    fi
    
    return $issues
}

# Executar monitoramento
main_monitoring

# Retornar código de saída baseado nos problemas encontrados
exit $? 