#!/bin/bash

# ===============================
# 🔍 MONITORAMENTO TEMPO REAL - CONEXÃO WHATSAPP
# ===============================

VPS_HOST="31.97.241.19"
VPS_USER="root"

log() {
  echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
  echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

info() {
  echo -e "\033[0;34m[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1\033[0m"
}

# Função para monitorar logs do PM2
monitor_pm2_logs() {
  log "🔍 Iniciando monitoramento de logs PM2..."
  ssh $VPS_USER@$VPS_HOST "cd /root/atendeai-lify-admin && pm2 logs atendeai-backend --lines 0 --timestamp" | while read line; do
    echo -e "\033[0;33m[PM2] $line\033[0m"
  done
}

# Função para monitorar processos Chrome
monitor_chrome_processes() {
  log "🔍 Iniciando monitoramento de processos Chrome..."
  while true; do
    echo -e "\033[0;36m[$(date +'%Y-%m-%d %H:%M:%S')] ===== PROCESSOS CHROME =====\033[0m"
    ssh $VPS_USER@$VPS_HOST "ps aux | grep -E 'chrome|chromium' | grep -v grep" | while read line; do
      echo -e "\033[0;36m[CHROME] $line\033[0m"
    done
    echo ""
    sleep 10
  done
}

# Função para monitorar status do servidor
monitor_server_status() {
  log "🔍 Iniciando monitoramento de status do servidor..."
  while true; do
    echo -e "\033[0;35m[$(date +'%Y-%m-%d %H:%M:%S')] ===== STATUS DO SERVIDOR =====\033[0m"
    response=$(curl -s --connect-timeout 5 http://$VPS_HOST:3001/health 2>/dev/null)
    if [ $? -eq 0 ]; then
      echo -e "\033[0;35m[HEALTH] $response\033[0m"
    else
      echo -e "\033[0;31m[HEALTH] Servidor não responde\033[0m"
    fi
    echo ""
    sleep 5
  done
}

# Função para monitorar uso de memória
monitor_memory_usage() {
  log "🔍 Iniciando monitoramento de uso de memória..."
  while true; do
    echo -e "\033[0;37m[$(date +'%Y-%m-%d %H:%M:%S')] ===== USO DE MEMÓRIA =====\033[0m"
    ssh $VPS_USER@$VPS_HOST "free -h && echo '--- PM2 Memory ---' && pm2 status" | while read line; do
      echo -e "\033[0;37m[MEMORY] $line\033[0m"
    done
    echo ""
    sleep 15
  done
}

# Função para monitorar logs de erro
monitor_error_logs() {
  log "🔍 Iniciando monitoramento de logs de erro..."
  ssh $VPS_USER@$VPS_HOST "tail -f /root/.pm2/logs/atendeai-backend-error.log" | while read line; do
    echo -e "\033[0;31m[ERROR] $line\033[0m"
  done
}

# Função principal
main() {
  log "🚀 Iniciando monitoramento completo da conexão WhatsApp..."
  log "📊 Monitores ativos:"
  log "  - Logs PM2 (tempo real)"
  log "  - Processos Chrome (a cada 10s)"
  log "  - Status do servidor (a cada 5s)"
  log "  - Uso de memória (a cada 15s)"
  log "  - Logs de erro (tempo real)"
  echo ""
  
  # Executar todos os monitores em background
  monitor_pm2_logs &
  monitor_chrome_processes &
  monitor_server_status &
  monitor_memory_usage &
  monitor_error_logs &
  
  # Aguardar interrupção
  wait
}

# Executar função principal
main 