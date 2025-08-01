#!/bin/bash

echo "🔐 ATUALIZANDO TOKEN DO WHATSAPP..."
echo "======================================"

# Parar PM2
echo "🛑 Parando PM2..."
pm2 stop atendeai-backend

# Atualizar token no .env
echo "📝 Atualizando token no .env..."
cat > /root/atendeai-lify-backend/.env << 'EOF'
# Configurações do servidor
PORT=3001
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# WhatsApp Meta API
WHATSAPP_META_ACCESS_TOKEN=EAASAuWYr9JgBPGIAwDRUrsnSLDpcfY0ZCbUhFeXEVYAQ3oZAMITjTqUAW8vNZCF9G3OZCTkeb8BCWEWiDPy1F3iBfaV8uECMy2kx6IEk3DsZCCNZAvbihA1nZCEDZAUNFqnEBgZBWKAhpIW2PJve8TDWQg6QvsOHVuuRh1tCQi56DPmA3A11NeG6UPoVlKEcnMbxpoHH7hQFwU31XXhqXAw4a9rlQXkMq2hZAnQfKWkeYxyvc6hmddSONLpufw9AZDZD
WHATSAPP_META_PHONE_NUMBER_ID=698766983327246
WHATSAPP_META_BUSINESS_ID=742991528315493
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your-verify-token

# Clínica padrão
DEFAULT_CLINIC_ID=default-clinic

# OpenAI (se necessário)
OPENAI_API_KEY=your-openai-key
EOF

# Reiniciar PM2
echo "🔄 Reiniciando PM2..."
pm2 restart atendeai-backend

echo "✅ TOKEN ATUALIZADO!"
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Execute o SQL para corrigir a tabela conversation_memory"
echo "2. Obtenha um novo token do WhatsApp Meta"
echo "3. Atualize o token no script acima"
echo "4. Execute o script novamente" 