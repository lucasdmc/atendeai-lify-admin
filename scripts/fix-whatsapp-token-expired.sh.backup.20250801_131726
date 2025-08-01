#!/bin/bash

echo "🔧 CORRIGINDO TOKEN EXPIRADO DO WHATSAPP..."
echo "=============================================="

# Parar PM2
echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

# Atualizar .env com novo token
echo "📝 Atualizando token do WhatsApp..."
cat > /root/atendeai-lify-backend/.env << 'EOF'
NODE_ENV=production
PORT=3001
# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
# WhatsApp Meta - TOKEN ATUALIZADO
WHATSAPP_META_ACCESS_TOKEN=EAASAuWYr9JgBPFfCITv4EVVJJHId3h8ZAmVVeoszL9GvV8eFhLxgDOvlxCSFGNJpmWXk9au5ZAenVXQQb99KxIHbFrpzzcd74BA4P8kG6IZCbIFHspPBQPWN5bLxws8OQVFcu2fWzRx2AoRSHfRKK5YUtHX1aeRUsZCvUwZAMsZAoiaTCPgwLCqDfvZAprV60NpY5ss0bZCMEUjY2jkGoTJa8Ts7EE8P5FbHm4AVdO6W9tIyPZAIRqBBcv7cUo2oZD
WHATSAPP_META_PHONE_NUMBER_ID=698766983327246
WHATSAPP_META_BUSINESS_ID=742991528315493
WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token
# IDs padrão
DEFAULT_CLINIC_ID=test-clinic
DEFAULT_USER_ID=system-ai-user
EOF

echo "✅ Token atualizado!"

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "📊 Verificando status..."
sleep 3
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "✅ TOKEN CORRIGIDO!"
echo "🎯 Agora o sistema deve responder no WhatsApp!"
echo ""
echo "⚠️ IMPORTANTE: Se o problema persistir, você precisará gerar um novo token no Meta Developer Console"
echo "🔗 Link: https://developers.facebook.com/apps/742991528315493/whatsapp-business-api"
echo ""
echo "✅ Script de correção aplicado com sucesso!" 