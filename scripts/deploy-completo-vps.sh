#!/bin/bash

# ===============================
# 🚀 DEPLOY COMPLETO - VPS WHATSAPP
# ===============================

VPS_HOST="atendeai-backend-production.up.railway.app"
VPS_USER="root"
PROJ_DIR="/root/atendeai-lify-admin"
LOCAL_PROJ_DIR="/Users/lucascantoni/Desktop/Lify-AtendeAI/atendeai-lify-admin"

log() {
  echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

error() {
  echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

warn() {
  echo -e "\033[1;33m[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1\033[0m"
}

log "🔄 Iniciando deploy completo para a VPS..."

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
  error "❌ Execute este script na raiz do projeto (onde está package.json)"
  exit 1
fi

# 2. Parar servidor WhatsApp na VPS
log "🛑 Parando servidor WhatsApp na VPS..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "pm2 stop atendeai-backend || true"

# 3. Backup do projeto antigo na VPS
log "💾 Backup do projeto antigo na VPS..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "if [ -d $PROJ_DIR ]; then mv $PROJ_DIR ${PROJ_DIR}_bkp_$(date +%s); fi"

# 4. Compactar projeto local
log "📦 Compactando projeto local..."
cd $LOCAL_PROJ_DIR
tar czf atendeai-lify-admin.tar.gz atendeai-lify-admin

# 5. Enviar para VPS
log "📤 Enviando projeto para VPS..."
scp atendeai-lify-admin.tar.gz $VPS_USER@$VPS_HOST:/root/

# 6. Descompactar na VPS
log "📂 Descompactando na VPS..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd /root && tar xzf atendeai-lify-admin.tar.gz && rm atendeai-lify-admin.tar.gz"

# 7. Instalar dependências
log "📦 Instalando dependências..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $PROJ_DIR && npm install"

# 8. Iniciar servidor WhatsApp
log "🚀 Iniciando servidor WhatsApp com PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $PROJ_DIR && pm2 start server.cjs --name 'atendeai-backend' --env production && pm2 save"

# 9. Aguardar inicialização
log "⏳ Aguardando 10 segundos para inicialização..."
sleep 10

# 10. Verificar status do PM2
log "📊 Verificando status do PM2..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "pm2 status"

# 11. Testar endpoints críticos
log "🧪 Testando endpoints críticos..."

echo "1️⃣ Health Check:"
curl -s http://$VPS_HOST:3001/health | jq '.' 2>/dev/null || curl -s http://$VPS_HOST:3001/health

echo ""
echo "2️⃣ Testando geração de QR Code:"
curl -s -X POST http://$VPS_HOST:3001/api/whatsapp/generate-qr \
  -H "Content-Type: application/json" \
  -d '{"agentId":"test-deploy"}' | head -c 200 && echo "..."

echo ""
echo "3️⃣ Verificando endpoints disponíveis:"
curl -s http://$VPS_HOST:3001/ | head -20

# 12. Verificar hash do commit
log "🔍 Verificando versão do código..."
LOCAL_HASH=$(git rev-parse HEAD)
log "Hash local: $LOCAL_HASH"

VPS_HASH=$(ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST "cd $PROJ_DIR && git rev-parse HEAD 2>/dev/null || echo 'N/A'")
log "Hash VPS: $VPS_HASH"

if [ "$LOCAL_HASH" = "$VPS_HASH" ]; then
  log "✅ Código sincronizado!"
else
  warn "⚠️ Código pode estar desatualizado na VPS"
fi

# 13. Limpar arquivo temporário local
log "🧹 Limpando arquivo temporário..."
rm -f atendeai-lify-admin.tar.gz

# 14. Gerar relatório final
log "📋 Gerando relatório final..."

REPORT_FILE="deploy-report-$(date +%Y%m%d_%H%M%S).md"
cat > $REPORT_FILE << EOF
# 📋 Relatório de Deploy - $(date)

## ✅ Deploy Concluído

### 📊 Informações do Deploy:
- **Data/Hora:** $(date)
- **VPS:** $VPS_HOST
- **Hash Local:** $LOCAL_HASH
- **Hash VPS:** $VPS_HASH
- **Status:** $(if [ "$LOCAL_HASH" = "$VPS_HASH" ]; then echo "✅ Sincronizado"; else echo "⚠️ Desatualizado"; fi)

### 🔗 URLs de Teste:
- **Health Check:** http://$VPS_HOST:3001/health
- **QR Code:** http://$VPS_HOST:3001/api/whatsapp/generate-qr
- **Frontend:** http://localhost:8080/agentes

### 📋 Checklist de Validação:
- [ ] Servidor WhatsApp iniciado
- [ ] PM2 rodando
- [ ] Health check respondendo
- [ ] QR Code gerando
- [ ] Código sincronizado

### 🚀 Próximos Passos:
1. Teste uma nova conexão no frontend
2. Gere QR Code para um agente
3. Escaneie com WhatsApp
4. Verifique se sincroniza corretamente

### 📞 Comandos Úteis:
\`\`\`bash
# Ver logs do servidor
ssh $VPS_USER@$VPS_HOST "pm2 logs atendeai-backend"

# Reiniciar servidor
ssh $VPS_USER@$VPS_HOST "pm2 restart atendeai-backend"

# Ver status
ssh $VPS_USER@$VPS_HOST "pm2 status"
\`\`\`
EOF

log "✅ Deploy completo concluído!"
log "📄 Relatório salvo em: $REPORT_FILE"

echo ""
echo "🎯 RESULTADO ESPERADO:"
echo "✅ Servidor WhatsApp atualizado na VPS"
echo "✅ Todos os endpoints funcionando"
echo "✅ Código sincronizado com GitHub"
echo "✅ Sistema pronto para conexões WhatsApp"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Teste uma nova conexão no frontend"
echo "2. Gere QR Code para um agente"
echo "3. Escaneie com WhatsApp"
echo "4. Verifique se sincroniza corretamente" 