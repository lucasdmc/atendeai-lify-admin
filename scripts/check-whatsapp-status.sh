#!/bin/bash

echo "🔍 Verificando status do WhatsApp..."
echo "===================================="

# Configurações
VPS_HOST="31.97.241.19"
SUPABASE_URL="https://niakqdolcdwxtrkbqmdi.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"

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

# 1. Verificar servidor WhatsApp
log "1️⃣ Verificando servidor WhatsApp..."
echo "Health check:"
curl -s http://$VPS_HOST:3001/health | jq '.' 2>/dev/null || curl -s http://$VPS_HOST:3001/health

# 2. Verificar Edge Function
log "2️⃣ Verificando Edge Function..."
echo "Testando geração de QR Code:"
curl -s -X POST $SUPABASE_URL/functions/v1/agent-whatsapp-manager/generate-qr \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -d '{"agentId":"0e170bf5-e767-4dea-90e5-8fccbdbfa6a5"}' | jq '.' 2>/dev/null || echo "Erro ao testar Edge Function"

# 3. Verificar configurações
log "3️⃣ Verificando configurações..."
echo "VITE_WHATSAPP_SERVER_URL: $VPS_HOST:3001"
echo "SUPABASE_URL: $SUPABASE_URL"

# 4. Verificar processos na VPS
log "4️⃣ Verificando processos na VPS..."
echo "Processos Chrome:"
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS_HOST "ps aux | grep chrome | grep -v grep | wc -l" 2>/dev/null || echo "Não foi possível conectar na VPS"

echo "Processos Node:"
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS_HOST "ps aux | grep node | grep -v grep | wc -l" 2>/dev/null || echo "Não foi possível conectar na VPS"

# 5. Verificar logs do servidor
log "5️⃣ Verificando logs do servidor..."
echo "Últimos logs do PM2:"
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS_HOST "pm2 logs atendeai-backend --lines 5" 2>/dev/null || echo "Não foi possível conectar na VPS"

log "✅ Verificação concluída!"
echo ""
echo "📋 Diagnóstico:"
echo "- Se o health check retorna OK: Servidor funcionando"
echo "- Se a Edge Function retorna QR Code: Sistema operacional"
echo "- Se há muitos processos Chrome: Possível conflito de sessões"
echo "- Se os logs mostram erros: Problema específico identificado" 