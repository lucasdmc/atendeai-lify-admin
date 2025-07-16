#!/bin/bash

# ===============================
# 🔧 ATUALIZAÇÃO SIMPLES - VPS WHATSAPP
# ===============================

VPS_HOST="31.97.241.19"
VPS_USER="root"
PROJ_DIR="/root/atendeai-lify-admin"

log() {
  echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
  echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

# Função para executar comando SSH com retry
ssh_with_retry() {
  local cmd="$1"
  local max_retries=3
  local retry_count=0
  
  while [ $retry_count -lt $max_retries ]; do
    if ssh -o ConnectTimeout=30 -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "$cmd"; then
      return 0
    else
      retry_count=$((retry_count + 1))
      log "Tentativa $retry_count falhou. Tentando novamente em 5 segundos..."
      sleep 5
    fi
  done
  
  error "Falha após $max_retries tentativas"
  return 1
}

log "🔄 Iniciando atualização simples da VPS..."

# 1. Verificar se o arquivo existe na VPS
log "📁 Verificando arquivo na VPS..."
if ssh_with_retry "ls -la /root/atendeai-lify-admin.tar.gz"; then
  log "✅ Arquivo encontrado na VPS"
else
  error "❌ Arquivo não encontrado na VPS"
  exit 1
fi

# 2. Descompactar na VPS
log "📂 Descompactando na VPS..."
if ssh_with_retry "cd /root && tar xzf atendeai-lify-admin.tar.gz"; then
  log "✅ Descompactação concluída"
else
  error "❌ Erro na descompactação"
  exit 1
fi

# 3. Verificar se o diretório foi criado
log "🔍 Verificando diretório..."
if ssh_with_retry "ls -la /root/atendeai-lify-admin"; then
  log "✅ Diretório criado com sucesso"
else
  error "❌ Diretório não foi criado"
  exit 1
fi

# 4. Instalar dependências
log "📦 Instalando dependências..."
if ssh_with_retry "cd $PROJ_DIR && npm install"; then
  log "✅ Dependências instaladas"
else
  error "❌ Erro na instalação de dependências"
  exit 1
fi

# 5. Parar servidor atual
log "🛑 Parando servidor atual..."
ssh_with_retry "pm2 stop atendeai-backend || true"

# 6. Iniciar servidor atualizado
log "🚀 Iniciando servidor atualizado..."
if ssh_with_retry "cd $PROJ_DIR && pm2 start server.js --name 'atendeai-backend' --env production && pm2 save"; then
  log "✅ Servidor iniciado com sucesso"
else
  error "❌ Erro ao iniciar servidor"
  exit 1
fi

# 7. Aguardar inicialização
log "⏳ Aguardando 15 segundos para inicialização..."
sleep 15

# 8. Verificar status
log "📊 Verificando status do PM2..."
ssh_with_retry "pm2 status"

# 9. Testar endpoints
log "🧪 Testando endpoints..."

echo "1️⃣ Health Check:"
curl -s --connect-timeout 10 http://$VPS_HOST:3001/health | jq '.' 2>/dev/null || curl -s --connect-timeout 10 http://$VPS_HOST:3001/health

echo ""
echo "2️⃣ Testando geração de QR Code:"
curl -s --connect-timeout 10 -X POST http://$VPS_HOST:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-update"}' | head -c 200 && echo "..."

# 10. Limpar arquivo temporário
log "🧹 Limpando arquivo temporário..."
ssh_with_retry "rm -f /root/atendeai-lify-admin.tar.gz"

log "✅ Atualização da VPS concluída!"
echo ""
echo "🎯 RESULTADO:"
echo "✅ Projeto atualizado na VPS"
echo "✅ Dependências instaladas"
echo "✅ Servidor reiniciado"
echo "✅ Endpoints testados"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Teste uma nova conexão no frontend"
echo "2. Gere QR Code para um agente"
echo "3. Escaneie com WhatsApp"
echo "4. Verifique se sincroniza corretamente" 