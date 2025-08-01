#!/bin/bash

echo "🔧 Corrigindo configuração do WhatsApp..."

# Parar o serviço
pm2 stop atendeai-backend

# Criar novo .env com configurações corretas
cat > /root/atendeai-lify-backend/.env << 'EOF'
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Meta - CONFIGURAÇÃO CORRIGIDA
WHATSAPP_META_ACCESS_TOKEN=EAASAuWYr9JgBPFfCITv4EVVJJHId3h8ZAmVVeoszL9GvV8eFhLxgDOvlxCSFGNJpmWXk9au5ZAenVXQQb99KxIHbFrpzzcd74BA4P8kG6IZCbIFHspPBQPWN5bLxws8OQVFcu2fWzRx2AoRSHfRKK5YUtHX1aeRUsZCvUwZAMsZAoiaTCPgwLCqDfvZAprV60NpY5ss0bZCMEUjY2jkGoWJa8Ts7EE8P5FbHm4AVdO6W9tIyPZAIRqBBcv7cUo2oZD
WHATSAPP_META_PHONE_NUMBER_ID=698766983327246
WHATSAPP_META_BUSINESS_ID=742991528315493
WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token

# IDs padrão
DEFAULT_CLINIC_ID=test-clinic
DEFAULT_USER_ID=system-ai-user
EOF

echo "✅ Configuração atualizada!"
echo "📱 Phone Number ID: 698766983327246"
echo "🏢 Business ID: 742991528315493"

# Reiniciar o serviço
pm2 restart atendeai-backend

echo "🔄 Serviço reiniciado!"
echo "📊 Verificando status..."

sleep 3

# Verificar se está funcionando
curl -s http://localhost:3001/health
echo ""
curl -s http://localhost:3001/webhook/whatsapp-meta/test
echo ""

echo "✅ Configuração corrigida!"
echo "🎯 Agora o sistema deve enviar mensagens para o número correto!" 