#!/bin/bash

# Script para corrigir a URL do webhook no servidor WhatsApp
# Resolve o problema do chatbot não responder

echo "🔧 Corrigindo URL do webhook no servidor WhatsApp..."

# Configurações
VPS_HOST="31.97.241.19"
PROJECT_DIR="/root/LifyChatbot-Node-Server"
CORRECT_WEBHOOK_URL="https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/webhook"

echo "📡 Conectando ao servidor VPS..."
ssh root@$VPS_HOST << 'EOF'

echo "🔍 Verificando arquivo .env..."
cd /root/LifyChatbot-Node-Server

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    touch .env
fi

# Atualizar ou adicionar a URL correta do webhook
echo "🔧 Atualizando SUPABASE_WEBHOOK_URL..."
if grep -q "SUPABASE_WEBHOOK_URL" .env; then
    # Se já existe, atualizar
    sed -i 's|SUPABASE_WEBHOOK_URL=.*|SUPABASE_WEBHOOK_URL=https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/webhook|' .env
    echo "✅ URL do webhook atualizada"
else
    # Se não existe, adicionar
    echo "SUPABASE_WEBHOOK_URL=https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/webhook" >> .env
    echo "✅ URL do webhook adicionada"
fi

# Verificar se a chave do Supabase está configurada
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY não encontrada no .env"
    echo "💡 Adicione manualmente a chave service_role do Supabase"
fi

# Mostrar configuração atual
echo "📋 Configuração atual do .env:"
grep -E "(SUPABASE_WEBHOOK_URL|SUPABASE_SERVICE_ROLE_KEY)" .env || echo "❌ Variáveis não encontradas"

# Reiniciar o servidor
echo "🔄 Reiniciando servidor WhatsApp..."
pm2 restart atendeai-backend

# Verificar status
echo "📊 Status do servidor:"
pm2 status atendeai-backend

echo "✅ Correção concluída!"
echo ""
echo "🎯 Próximos passos:"
echo "1. Gere um novo QR Code no sistema"
echo "2. Escaneie o QR Code com o WhatsApp"
echo "3. Envie uma mensagem de teste"
echo "4. Verifique se o chatbot responde"

EOF

echo "✅ Script concluído!"
echo ""
echo "🔍 Para verificar se funcionou:"
echo "curl -X GET http://31.97.241.19:3001/health" 