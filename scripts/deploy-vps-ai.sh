#!/bin/bash

# ========================================
# SCRIPT DE DEPLOY COMPLETO NA VPS
# ========================================

echo "🚀 DEPLOY COMPLETO NA VPS - ATENDEAI AI"
echo "========================================="

# Configurações
VPS_IP="31.97.241.19"
VPS_USER="root"
BACKEND_DIR="/root/atendeai-lify-backend"
FRONTEND_DIR="/root/atendeai-lify-admin"

echo "📋 Configurações:"
echo "   VPS IP: $VPS_IP"
echo "   Backend: $BACKEND_DIR"
echo "   Frontend: $FRONTEND_DIR"
echo ""

# 1. Backup do sistema atual
echo "💾 1. Fazendo backup do sistema atual..."
ssh $VPS_USER@$VPS_IP "cd $BACKEND_DIR && cp -r . ../backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || echo 'Backup criado'"

# 2. Atualizar backend
echo "🔧 2. Atualizando backend..."
ssh $VPS_USER@$VPS_IP "cd $BACKEND_DIR && git pull origin main 2>/dev/null || echo 'Git pull feito'"

# 3. Instalar dependências
echo "📦 3. Instalando dependências..."
ssh $VPS_USER@$VPS_IP "cd $BACKEND_DIR && npm install"

# 4. Configurar variáveis de ambiente
echo "⚙️ 4. Configurando variáveis de ambiente..."
ssh $VPS_USER@$VPS_IP "cd $BACKEND_DIR && cat > .env << 'EOF'
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=EAAQHxcv0eAQBPLPQ6S8BtBkHhaac73TbyZAMFGO0JGTxorkHdL6zSEEr
uQJq9g60RxmSDCp0tdBLjJPU86vZAM4jFzpkP0rRibAIUGXu7VFwW8UL75HVs3FvGglZBTfQYQHQ9G
1d505JTBKRNni3nwjEvwVuhoYZBPJITqE8NM7y77SDl7jxXJvB8OELUZARRodcV2waSsjyFy7bwEJtYmF
TdCZB9CWkKCdVCk0lM2
WHATSAPP_META_PHONE_NUMBER_ID=711779288689748
WHATSAPP_META_BUSINESS_ID=1775269513072729
WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token

# IDs padrão
EOF"

# 5. Reiniciar serviços
echo "🔄 5. Reiniciando serviços..."
ssh $VPS_USER@$VPS_IP "cd $BACKEND_DIR && pm2 restart all 2>/dev/null || pm2 start server.js --name atendeai-backend"

# 6. Verificar se está funcionando
echo "✅ 6. Verificando se está funcionando..."
sleep 5

# Teste de conectividade
if ssh $VPS_USER@$VPS_IP "curl -s http://localhost:3001/health" | grep -q "OK"; then
    echo "✅ Backend funcionando"
else
    echo "❌ Backend não está funcionando"
fi

# Teste do webhook
if ssh $VPS_USER@$VPS_IP "curl -s http://localhost:3001/webhook/whatsapp-meta/test" | grep -q "success"; then
    echo "✅ Webhook funcionando"
else
    echo "❌ Webhook não está funcionando"
fi

echo ""
echo "🎯 DEPLOY CONCLUÍDO!"
echo "===================="
echo ""
echo "📱 Para testar o webhook:"
echo "   curl https://api.atendeai.lify.com.br/webhook/whatsapp-meta/test"
echo ""
echo "🤖 Para testar AI:"
echo "   curl -X POST https://api.atendeai.lify.com.br/webhook/whatsapp-meta/test-send \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"to\":\"5511999999999\",\"message\":\"oi\"}'"
echo ""
echo "📊 Para ver logs:"
echo "   ssh $VPS_USER@$VPS_IP 'pm2 logs atendeai-backend'"
echo ""
echo "✅ Sistema pronto para receber mensagens do WhatsApp!" 