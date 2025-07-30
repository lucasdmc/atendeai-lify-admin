#!/bin/bash

# Script para deploy integrado
# AtendeAI Lify - Integrated Deploy

set -e

echo "🚀 Iniciando deploy integrado..."

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

# Verificar se estamos em produção
if [ "$NODE_ENV" != "production" ]; then
    warn "NODE_ENV não está definido como 'production'"
    warn "Configure NODE_ENV=production para deploy em produção"
fi

# Build do projeto
log "Executando build integrado..."
./build-integrated.sh

# Verificar se build foi bem-sucedido
if [ ! -d "dist" ]; then
    error "Build falhou - diretório dist não encontrado"
    exit 1
fi

log "✅ Build concluído"

# Aqui você pode adicionar comandos específicos para seu provedor de hospedagem
# Por exemplo, para Vercel, Railway, etc.

log "🎉 Deploy integrado concluído!"
log "📁 Frontend: ./dist"
log "🔧 Backend: ./atendeai-lify-backend"
log ""
log "Configure seu provedor de hospedagem para:"
log "- Frontend: servir arquivos de ./dist"
log "- Backend: executar 'npm start' em ./atendeai-lify-backend"
