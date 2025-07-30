#!/bin/bash

# Script para build integrado do projeto
# AtendeAI Lify - Integrated Build

set -e

echo "🔨 Iniciando build integrado..."

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Build do frontend
log "Build do frontend..."
npm run build

# Verificar se build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build do frontend falhou"
    exit 1
fi

log "✅ Build do frontend concluído"

# Preparar backend para produção
log "Preparando backend para produção..."
cd atendeai-lify-backend

# Verificar se todas as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    log "Instalando dependências do backend..."
    npm install
fi

log "✅ Backend preparado"

cd ..

log "🎉 Build integrado concluído!"
log "📁 Frontend build: ./dist"
log "🔧 Backend: ./atendeai-lify-backend"
