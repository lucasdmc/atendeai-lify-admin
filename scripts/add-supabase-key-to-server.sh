#!/bin/bash

# Script para adicionar a chave do Supabase no servidor VPS
# Necessário para o webhook funcionar

echo "🔑 Adicionando chave do Supabase no servidor VPS..."

# Configurações
VPS_HOST="31.97.241.19"
PROJECT_DIR="/root/LifyChatbot-Node-Server"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M"

echo "📡 Conectando ao servidor VPS..."
ssh root@$VPS_HOST << EOF

echo "🔍 Verificando arquivo .env..."
cd /root/LifyChatbot-Node-Server

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    touch .env
fi

# Adicionar a chave do Supabase
echo "🔑 Adicionando SUPABASE_SERVICE_ROLE_KEY..."
if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
    # Se já existe, atualizar
    sed -i 's|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M|' .env
    echo "✅ Chave do Supabase atualizada"
else
    # Se não existe, adicionar
    echo "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M" >> .env
    echo "✅ Chave do Supabase adicionada"
fi

# Mostrar configuração atual
echo "📋 Configuração atual do .env:"
grep -E "(SUPABASE_WEBHOOK_URL|SUPABASE_SERVICE_ROLE_KEY)" .env || echo "❌ Variáveis não encontradas"

# Reiniciar o servidor com as novas variáveis
echo "🔄 Reiniciando servidor WhatsApp com novas variáveis..."
pm2 restart atendeai-backend --update-env

# Verificar status
echo "📊 Status do servidor:"
pm2 status atendeai-backend

echo "✅ Chave do Supabase adicionada com sucesso!"
echo ""
echo "🎯 Agora o servidor pode enviar webhooks para o Supabase"

EOF

echo "✅ Script concluído!"
echo ""
echo "🔍 Para testar o webhook:"
echo "1. Gere um novo QR Code no sistema"
echo "2. Escaneie o QR Code com o WhatsApp"
echo "3. Envie uma mensagem de teste"
echo "4. Verifique se o chatbot responde" 