#!/bin/bash

# ===============================
# 🚀 DEPLOY AUTOMÁTICO - VPS WHATSAPP
# ===============================

VPS_HOST="31.97.241.19"
VPS_USER="root"
REPO_URL="https://github.com/lucasdmc/atendeai-lify-admin.git"
PROJ_DIR="/root/atendeai-lify-admin"

log() {
  echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
  echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

log "🔄 Iniciando deploy automático para a VPS..."

# 1. Parar servidor WhatsApp
log "🛑 Parando servidor WhatsApp na VPS..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "pm2 stop atendeai-backend || true"

# 2. Backup do projeto antigo
log "💾 Backup do projeto antigo (se existir)..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "if [ -d $PROJ_DIR ]; then mv $PROJ_DIR ${PROJ_DIR}_bkp_$(date +%s); fi"

# 3. Clonar repositório atualizado
log "⬇️ Clonando repositório atualizado..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "git clone $REPO_URL $PROJ_DIR"

# 4. Instalar dependências
log "📦 Instalando dependências..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $PROJ_DIR && npm install"

# 5. Iniciar servidor WhatsApp
log "🚀 Iniciando servidor WhatsApp com PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $PROJ_DIR && pm2 start server.cjs --name 'atendeai-backend' --env production && pm2 save"

# 6. Verificar status
log "📊 Verificando status do PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "pm2 status"

log "✅ Deploy automático concluído!" 