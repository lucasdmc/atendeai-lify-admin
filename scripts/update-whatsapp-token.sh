#!/bin/bash
echo "🔧 ATUALIZANDO TOKEN DO WHATSAPP..."
echo "=============================================="

echo "📝 Insira o NOVO token do WhatsApp Meta:"
read -s NEW_TOKEN

echo "🛑 Parando PM2..."
ssh root@31.97.241.19 "pm2 stop atendeai-backend"

echo "📝 Atualizando .env com novo token..."
ssh root@31.97.241.19 "cat > /root/atendeai-lify-backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
# WhatsApp Meta - TOKEN ATUALIZADO
WHATSAPP_META_ACCESS_TOKEN=$NEW_TOKEN
WHATSAPP_META_PHONE_NUMBER_ID=698766983327246
WHATSAPP_META_BUSINESS_ID=742991528315493
WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token
# IDs padrão
DEFAULT_CLINIC_ID=test-clinic
DEFAULT_USER_ID=system-ai-user
EOF"

echo "🔄 Reiniciando PM2..."
ssh root@31.97.241.19 "pm2 restart atendeai-backend"

echo "✅ TOKEN ATUALIZADO!"
echo "📊 Verificando status..."
sleep 3
ssh root@31.97.241.19 "curl -s http://localhost:3001/health"
echo ""
ssh root@31.97.241.19 "curl -s http://localhost:3001/webhook/whatsapp-meta/test"
echo ""
echo "🎯 TESTE: Envie uma mensagem para o WhatsApp Business!"
echo "📱 Número: 554730915628"
echo "🤖 O sistema agora deve responder corretamente!" 