#!/bin/bash

echo "🧹 LIMPEZA COMPLETA DO SISTEMA WHATSAPP"
echo "=========================================="

# Configurações
VPS_IP="31.97.241.19"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M"

echo "📡 Conectando à VPS..."

# 1. Matar todos os processos Chromium
echo "🔪 Matando processos Chromium..."
ssh root@$VPS_IP "pkill -f chromium || true"
ssh root@$VPS_IP "pkill -f chrome || true"
ssh root@$VPS_IP "pkill -f puppeteer || true"

# 2. Limpar todas as sessões WhatsApp
echo "🗑️ Limpando sessões WhatsApp..."
ssh root@$VPS_IP "rm -rf /root/atendeai-lify-admin/.wwebjs_auth/* || true"
ssh root@$VPS_IP "rm -rf /tmp/.org.chromium.Chromium.* || true"

# 3. Corrigir URLs no servidor
echo "🔧 Corrigindo URLs no servidor..."
ssh root@$VPS_IP "sed -i 's|https://your-project.supabase.co|https://niakqdolcdwxtrkbqmdi.supabase.co|g' /root/atendeai-lify-admin/server.js"

# 4. Exportar variável de ambiente
echo "🔑 Exportando SUPABASE_SERVICE_ROLE_KEY..."
ssh root@$VPS_IP "export SUPABASE_SERVICE_ROLE_KEY='$SUPABASE_SERVICE_ROLE_KEY'"

# 5. Reiniciar backend
echo "🔄 Reiniciando backend..."
ssh root@$VPS_IP "pm2 restart atendeai-backend"

# 6. Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# 7. Verificar status
echo "📊 Verificando status do servidor..."
ssh root@$VPS_IP "pm2 status"
ssh root@$VPS_IP "curl -s http://localhost:3001/health"

echo ""
echo "✅ LIMPEZA CONCLUÍDA!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Execute o script SQL no Supabase Dashboard:"
echo "   DELETE FROM agent_whatsapp_connections;"
echo ""
echo "2. Gere um novo QR Code no frontend"
echo "3. Escaneie com o número 5547999528232"
echo "4. Teste o chatbot"
echo ""
echo "📞 Para verificar logs:"
echo "   ssh root@$VPS_IP 'pm2 logs atendeai-backend --lines 20'" 