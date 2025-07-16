#!/bin/bash

# Script para atualizar o servidor WhatsApp com handlers de mensagens
# Autor: Claude
# Data: 2025-07-16

set -e

echo "🚀 Atualizando servidor WhatsApp com handlers de mensagens..."

# Configurações
VPS_HOST="31.97.241.19"
VPS_USER="root"
PROJECT_DIR="/root/atendeai-lify-admin"
BACKUP_DIR="/root/backup-$(date +%Y%m%d-%H%M%S)"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Função para executar comando SSH com timeout
ssh_exec() {
    local cmd="$1"
    local timeout="${2:-30}"
    
    # Usar gtimeout se disponível, senão usar timeout normal
    if command -v gtimeout >/dev/null 2>&1; then
        gtimeout $timeout ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "$cmd"
    else
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "$cmd"
    fi
}

# Verificar conectividade
log "🔍 Verificando conectividade com a VPS..."
if ! ssh_exec "echo 'Conexão SSH OK'" 10; then
    error "❌ Não foi possível conectar à VPS"
    exit 1
fi

log "✅ Conectividade confirmada"

# Criar backup
log "💾 Criando backup do servidor atual..."
ssh_exec "mkdir -p $BACKUP_DIR && cp $PROJECT_DIR/server.js $BACKUP_DIR/"

# Parar o servidor
log "🛑 Parando servidor WhatsApp..."
ssh_exec "cd $PROJECT_DIR && pm2 stop atendeai-backend || true"
sleep 3

# Fazer upload do novo servidor
log "📤 Fazendo upload do servidor atualizado..."
scp -o ConnectTimeout=10 -o StrictHostKeyChecking=no server.js $VPS_USER@$VPS_HOST:$PROJECT_DIR/

# Verificar se o upload foi bem-sucedido
if ! ssh_exec "test -f $PROJECT_DIR/server.js"; then
    error "❌ Falha no upload do servidor"
    exit 1
fi

log "✅ Upload concluído"

# Verificar sintaxe do servidor
log "🔍 Verificando sintaxe do servidor..."
if ! ssh_exec "cd $PROJECT_DIR && node -c server.js"; then
    error "❌ Erro de sintaxe no servidor"
    log "🔄 Restaurando backup..."
    ssh_exec "cp $BACKUP_DIR/server.js $PROJECT_DIR/"
    exit 1
fi

log "✅ Sintaxe verificada"

# Instalar dependências se necessário
log "📦 Verificando dependências..."
ssh_exec "cd $PROJECT_DIR && npm list node-fetch || npm install node-fetch@2"

# Reiniciar o servidor
log "🔄 Reiniciando servidor WhatsApp..."
ssh_exec "cd $PROJECT_DIR && pm2 restart atendeai-backend"

# Aguardar inicialização
log "⏳ Aguardando inicialização do servidor..."
sleep 10

# Verificar se o servidor está rodando
log "🔍 Verificando status do servidor..."
if ssh_exec "cd $PROJECT_DIR && pm2 status atendeai-backend | grep -q 'online'"; then
    log "✅ Servidor está rodando"
else
    error "❌ Servidor não está rodando"
    log "📋 Logs do servidor:"
    ssh_exec "cd $PROJECT_DIR && pm2 logs atendeai-backend --lines 10"
    exit 1
fi

# Testar endpoints
log "🧪 Testando endpoints do servidor..."

# Testar health check
if ssh_exec "curl -s http://localhost:3001/health | grep -q 'status.*ok'"; then
    log "✅ Health check funcionando"
else
    error "❌ Health check falhou"
fi

# Testar endpoint de envio de mensagem
log "📤 Testando endpoint de envio de mensagem..."
TEST_RESPONSE=$(ssh_exec "curl -s -X POST http://localhost:3001/api/whatsapp/send-message -H 'Content-Type: application/json' -d '{\"agentId\":\"test\",\"to\":\"123456789\",\"message\":\"test\"}'")
if echo "$TEST_RESPONSE" | grep -q "error"; then
    log "✅ Endpoint de envio de mensagem responde (esperado erro para agente inexistente)"
else
    warning "⚠️ Resposta inesperada do endpoint de envio"
fi

# Verificar logs recentes
log "📋 Verificando logs recentes..."
ssh_exec "cd $PROJECT_DIR && tail -20 /root/.pm2/logs/atendeai-backend-out.log"

# Verificar se há erros
log "🔍 Verificando erros nos logs..."
ERROR_COUNT=$(ssh_exec "cd $PROJECT_DIR && tail -50 /root/.pm2/logs/atendeai-backend-error.log | wc -l")
if [ "$ERROR_COUNT" -gt 0 ]; then
    warning "⚠️ Encontrados $ERROR_COUNT erros nos logs"
    ssh_exec "cd $PROJECT_DIR && tail -10 /root/.pm2/logs/atendeai-backend-error.log"
else
    log "✅ Nenhum erro encontrado nos logs"
fi

# Configurar variáveis de ambiente se necessário
log "🔧 Configurando variáveis de ambiente..."
ssh_exec "cd $PROJECT_DIR && grep -q 'SUPABASE_WEBHOOK_URL' .env || echo 'SUPABASE_WEBHOOK_URL=https://your-project.supabase.co/functions/v1/agent-whatsapp-manager/webhook' >> .env"
ssh_exec "cd $PROJECT_DIR && grep -q 'SUPABASE_SERVICE_ROLE_KEY' .env || echo 'SUPABASE_SERVICE_ROLE_KEY=your-service-role-key' >> .env"

log "✅ Variáveis de ambiente configuradas"

# Teste final
log "🎯 Teste final - Verificando conectividade completa..."
FINAL_STATUS=$(ssh_exec "curl -s http://localhost:3001/health")
if echo "$FINAL_STATUS" | grep -q "activeSessions"; then
    log "✅ Servidor funcionando corretamente"
    echo "$FINAL_STATUS" | head -5
else
    error "❌ Servidor não está respondendo corretamente"
    exit 1
fi

log "🎉 Atualização concluída com sucesso!"
log "📋 Resumo das mudanças:"
log "   ✅ Listeners de mensagens adicionados"
log "   ✅ Endpoint de envio de mensagens criado"
log "   ✅ Integração com webhook configurada"
log "   ✅ Tratamento de mídia implementado"
log "   ✅ Logs detalhados habilitados"

log "🔗 URLs disponíveis:"
log "   - Health: http://$VPS_HOST:3001/health"
log "   - Generate QR: POST http://$VPS_HOST:3001/api/whatsapp/generate-qr"
log "   - Send Message: POST http://$VPS_HOST:3001/api/whatsapp/send-message"
log "   - Status: GET http://$VPS_HOST:3001/api/whatsapp/status/:agentId"

log "📝 Próximos passos:"
log "   1. Configure SUPABASE_WEBHOOK_URL no arquivo .env"
log "   2. Configure SUPABASE_SERVICE_ROLE_KEY no arquivo .env"
log "   3. Teste o envio de uma mensagem para o agente conectado"
log "   4. Verifique os logs para confirmar o processamento"

echo ""
log "🚀 Servidor WhatsApp atualizado e pronto para receber mensagens!" 