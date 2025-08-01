#!/bin/bash

# ========================================
# SCRIPT MANUAL DE DEPLOY NA VPS
# ========================================

echo "🚀 DEPLOY MANUAL NA VPS - ATENDEAI AI"
echo "======================================"

echo ""
echo "📋 PASSO A PASSO:"
echo "=================="
echo ""

echo "1️⃣ CONECTAR NA VPS:"
echo "   ssh root@31.97.241.19"
echo ""

echo "2️⃣ NAVEGAR PARA O DIRETÓRIO:"
echo "   cd /root/atendeai-lify-backend"
echo ""

echo "3️⃣ FAZER BACKUP:"
echo "   cp -r . ../backup-\$(date +%Y%m%d-%H%M%S)"
echo ""

echo "4️⃣ INSTALAR DEPENDÊNCIAS:"
echo "   npm install axios"
echo ""

echo "5️⃣ CRIAR ARQUIVO .env:"
echo "   cat > .env << 'EOF'"
echo "NODE_ENV=production"
echo "PORT=3001"
echo ""
echo "# Supabase"
echo "SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co"
echo "SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw"
echo ""
echo "# WhatsApp Meta"
echo "WHATSAPP_META_ACCESS_TOKEN=EAAQHxcv0eAQBPLPQ6S8BtBkHhaac73TbyZAMFGO0JGTxorkHdL6zSEEr"
echo "uQJq9g60RxmSDCp0tdBLjJPU86vZAM4jFzpkP0rRibAIUGXu7VFwW8UL75HVs3FvGglZBTfQYQHQ9G"
echo "1d505JTBKRNni3nwjEvwVuhoYZBPJITqE8NM7y77SDl7jxXJvB8OELUZARRodcV2waSsjyFy7bwEJtYmF"
echo "TdCZB9CWkKCdVCk0lM2"
echo "WHATSAPP_META_PHONE_NUMBER_ID=711779288689748"
echo "WHATSAPP_META_BUSINESS_ID=1775269513072729"
echo "WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta"
echo "WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token"
echo ""
echo "# IDs padrão"
echo "EOF"
echo ""

echo "6️⃣ REINICIAR SERVIÇOS:"
echo "   pm2 restart all"
echo "   # ou se não existir:"
echo "   pm2 start server.js --name atendeai-backend"
echo ""

echo "7️⃣ VERIFICAR SE ESTÁ FUNCIONANDO:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/webhook/whatsapp-meta/test"
echo ""

echo "8️⃣ VER LOGS:"
echo "   pm2 logs atendeai-backend"
echo ""

echo "🎯 DEPLOY CONCLUÍDO!"
echo "===================="
echo ""
echo "📱 Para testar o webhook:"
echo "   curl https://api.atendeai.lify.com.br/webhook/whatsapp-meta/test"
echo ""
echo "✅ Sistema pronto para receber mensagens do WhatsApp!" 