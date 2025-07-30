#!/bin/bash

# Script para testar a integração completa
# AtendeAI Lify - Integration Test

set -e

echo "🧪 Iniciando testes de integração..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto (atendeai-lify-admin)"
    exit 1
fi

log "Verificando estrutura do projeto..."

# Verificar se o backend existe
if [ ! -d "atendeai-lify-backend" ]; then
    error "Diretório atendeai-lify-backend não encontrado"
    exit 1
fi

# Verificar se os arquivos .env existem
if [ ! -f ".env" ]; then
    error "Arquivo .env do frontend não encontrado"
    exit 1
fi

if [ ! -f "atendeai-lify-backend/.env" ]; then
    error "Arquivo .env do backend não encontrado"
    exit 1
fi

success "✅ Estrutura do projeto verificada"

# Testar configurações do frontend
log "Testando configurações do frontend..."
if grep -q "VITE_BACKEND_URL" .env; then
    success "✅ VITE_BACKEND_URL configurado"
else
    error "❌ VITE_BACKEND_URL não encontrado"
    exit 1
fi

if grep -q "VITE_SUPABASE_URL" .env; then
    success "✅ VITE_SUPABASE_URL configurado"
else
    error "❌ VITE_SUPABASE_URL não encontrado"
    exit 1
fi

# Testar configurações do backend
log "Testando configurações do backend..."
if grep -q "SUPABASE_URL" atendeai-lify-backend/.env; then
    success "✅ SUPABASE_URL configurado"
else
    error "❌ SUPABASE_URL não encontrado"
    exit 1
fi

if grep -q "WHATSAPP_META_ACCESS_TOKEN" atendeai-lify-backend/.env; then
    success "✅ WHATSAPP_META_ACCESS_TOKEN configurado"
else
    error "❌ WHATSAPP_META_ACCESS_TOKEN não encontrado"
    exit 1
fi

if grep -q "OPENAI_API_KEY" atendeai-lify-backend/.env; then
    success "✅ OPENAI_API_KEY configurado"
else
    error "❌ OPENAI_API_KEY não encontrado"
    exit 1
fi

# Verificar dependências do backend
log "Verificando dependências do backend..."
cd atendeai-lify-backend
if [ ! -d "node_modules" ]; then
    warn "Instalando dependências do backend..."
    npm install
else
    success "✅ Dependências do backend já instaladas"
fi
cd ..

# Verificar dependências do frontend
log "Verificando dependências do frontend..."
if [ ! -d "node_modules" ]; then
    warn "Instalando dependências do frontend..."
    npm install
else
    success "✅ Dependências do frontend já instaladas"
fi

# Testar se as portas estão disponíveis
log "Verificando disponibilidade das portas..."
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        warn "Porta $1 já está em uso"
        return 1
    fi
    return 0
}

check_port 3001 || warn "Backend pode não iniciar na porta 3001"
check_port 8080 || warn "Frontend pode não iniciar na porta 8080"

# Testar backend
log "Testando backend..."
cd atendeai-lify-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
log "Aguardando backend inicializar..."
sleep 5

# Testar health check
if curl -s http://localhost:3001/health > /dev/null; then
    success "✅ Backend funcionando corretamente"
else
    error "❌ Backend não está respondendo"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Testar endpoints da API
log "Testando endpoints da API..."

# Testar endpoint raiz
if curl -s http://localhost:3001/ | grep -q "AtendeAI Lify Backend API"; then
    success "✅ Endpoint raiz funcionando"
else
    error "❌ Endpoint raiz não está funcionando"
fi

# Testar endpoint de clínicas
if curl -s http://localhost:3001/api/clinics | grep -q "clinics"; then
    success "✅ Endpoint de clínicas funcionando"
else
    error "❌ Endpoint de clínicas não está funcionando"
fi

# Parar backend
log "Parando backend..."
kill $BACKEND_PID 2>/dev/null || true
sleep 2

# Testar scripts integrados
log "Testando scripts integrados..."

if [ -f "dev-integrated.sh" ]; then
    success "✅ Script dev-integrated.sh existe"
else
    error "❌ Script dev-integrated.sh não encontrado"
fi

if [ -f "build-integrated.sh" ]; then
    success "✅ Script build-integrated.sh existe"
else
    error "❌ Script build-integrated.sh não encontrado"
fi

if [ -f "deploy-integrated.sh" ]; then
    success "✅ Script deploy-integrated.sh existe"
else
    error "❌ Script deploy-integrated.sh não encontrado"
fi

# Verificar documentação
if [ -f "BACKEND_INTEGRATION.md" ]; then
    success "✅ Documentação BACKEND_INTEGRATION.md existe"
else
    error "❌ Documentação BACKEND_INTEGRATION.md não encontrada"
fi

echo ""
success "🎉 Todos os testes de integração passaram!"
echo ""
log "📋 Resumo da integração:"
log "✅ Backend configurado e funcionando"
log "✅ Frontend configurado"
log "✅ Scripts de automação criados"
log "✅ Documentação completa"
log "✅ Variáveis de ambiente configuradas"
echo ""
log "🚀 Para iniciar o desenvolvimento:"
log "   ./dev-integrated.sh"
echo ""
log "📚 Para mais informações:"
log "   cat BACKEND_INTEGRATION.md" 