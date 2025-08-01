#!/bin/bash

echo "🔧 REMOVENDO VARIÁVEIS DEFAULT DA VPS"
echo "======================================"

# 1. Conectar na VPS e fazer backup
echo "📋 1. Conectando na VPS e fazendo backup..."
ssh root@31.97.241.19 << 'EOF'

# Navegar para o diretório da aplicação
cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# Fazer backup do arquivo .env atual
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup do .env criado"
else
    echo "⚠️ Arquivo .env não encontrado"
fi

# Fazer backup do arquivo .env.production se existir
if [ -f .env.production ]; then
    cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup do .env.production criado"
else
    echo "⚠️ Arquivo .env.production não encontrado"
fi

EOF

# 2. Remover variáveis do arquivo .env na VPS
echo "📋 2. Removendo variáveis do .env..."
ssh root@31.97.241.19 << 'EOF'

cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# Remover linhas com DEFAULT_CLINIC_ID e DEFAULT_USER_ID
if [ -f .env ]; then
    sed -i '/^DEFAULT_CLINIC_ID=/d' .env
    sed -i '/^DEFAULT_USER_ID=/d' .env
    sed -i '/^# IDs padrão$/d' .env
    sed -i '/^# IDs padrão para produção$/d' .env
    echo "✅ Variáveis removidas do .env"
else
    echo "⚠️ Arquivo .env não encontrado"
fi

# Remover do .env.production se existir
if [ -f .env.production ]; then
    sed -i '/^DEFAULT_CLINIC_ID=/d' .env.production
    sed -i '/^DEFAULT_USER_ID=/d' .env.production
    sed -i '/^# IDs padrão$/d' .env.production
    sed -i '/^# IDs padrão para produção$/d' .env.production
    echo "✅ Variáveis removidas do .env.production"
fi

EOF

# 3. Atualizar arquivo routes/webhook.js na VPS
echo "📋 3. Atualizando routes/webhook.js..."
ssh root@31.97.241.19 << 'EOF'

cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# Fazer backup do arquivo
if [ -f routes/webhook.js ]; then
    cp routes/webhook.js routes/webhook.js.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup do webhook.js criado"
fi

# Substituir as linhas que usam as variáveis de ambiente
if [ -f routes/webhook.js ]; then
    sed -i "s/const clinicId = process.env.DEFAULT_CLINIC_ID || 'test-clinic';/const clinicId = 'test-clinic';/g" routes/webhook.js
    sed -i "s/const userId = process.env.DEFAULT_USER_ID || 'system-user';/const userId = 'system-user';/g" routes/webhook.js
    echo "✅ webhook.js atualizado"
else
    echo "⚠️ Arquivo routes/webhook.js não encontrado"
fi

EOF

# 4. Reiniciar o servidor na VPS
echo "📋 4. Reiniciando servidor..."
ssh root@31.97.241.19 << 'EOF'

cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# Parar o processo atual
pkill -f "node server.js" || echo "Nenhum processo encontrado"

# Aguardar um momento
sleep 2

# Iniciar o servidor novamente
nohup node server.js > server.log 2>&1 &
echo "✅ Servidor reiniciado"

# Aguardar um momento para o servidor inicializar
sleep 5

EOF

# 5. Testar se está funcionando
echo "📋 5. Testando funcionamento..."
ssh root@31.97.241.19 << 'EOF'

cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin

# Testar health check
echo "🧪 Testando health check..."
curl -s http://localhost:3001/health

# Testar webhook
echo ""
echo "🧪 Testando webhook..."
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}' \
  -s

echo ""
echo "✅ Testes concluídos!"

EOF

echo ""
echo "🎉 REMOÇÃO CONCLUÍDA!"
echo "====================="
echo "✅ Variáveis DEFAULT_CLINIC_ID e DEFAULT_USER_ID removidas da VPS"
echo "✅ Servidor reiniciado"
echo "✅ Testes realizados"
echo ""
echo "📱 Agora teste enviando uma mensagem no WhatsApp para verificar se está funcionando" 