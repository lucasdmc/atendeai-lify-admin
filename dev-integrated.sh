#!/bin/bash

# Script para rodar frontend e backend simultaneamente
# AtendeAI Lify - Integrated Development

set -e

echo "🚀 Iniciando desenvolvimento integrado..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Função para limpar processos ao sair
cleanup() {
    echo "🛑 Parando processos..."
    pkill -f "node.*src/index.js" || true
    pkill -f "vite" || true
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Verificar se as portas estão disponíveis
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        warn "Porta $1 já está em uso"
        return 1
    fi
    return 0
}

# Verificar portas
log "Verificando portas..."
check_port 3001 || warn "Backend pode não iniciar na porta 3001"
check_port 8080 || warn "Frontend pode não iniciar na porta 8080"

# Iniciar backend
log "Iniciando backend na porta 3001..."
cd atendeai-lify-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
log "Aguardando backend inicializar..."
sleep 3

# Verificar se backend está rodando
if curl -s http://localhost:3001/health > /dev/null; then
    log "✅ Backend iniciado com sucesso"
else
    warn "⚠️ Backend pode não estar rodando corretamente"
fi

# Iniciar frontend
log "Iniciando frontend na porta 8080..."
npm run dev:8080 &
FRONTEND_PID=$!

log "🎉 Desenvolvimento integrado iniciado!"
log "📱 Frontend: http://localhost:8080"
log "🔧 Backend: http://localhost:3001"
log "🏥 Health Check: http://localhost:3001/health"
log ""
log "Pressione Ctrl+C para parar todos os serviços"

# Aguardar indefinidamente
wait
