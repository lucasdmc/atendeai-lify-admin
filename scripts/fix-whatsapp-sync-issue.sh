#!/bin/bash

echo "🔧 Resolvendo problema de sincronização do WhatsApp..."

VPS_USER="root"
VPS_IP="31.97.241.19"

echo "📍 Conectando na VPS: $VPS_IP"

# 1. Parar completamente o servidor
echo "1️⃣ Parando servidor WhatsApp..."
ssh "$VPS_USER@$VPS_IP" "pm2 stop whatsapp-server"

# 2. Matar TODOS os processos Chrome
echo "2️⃣ Matando todos os processos Chrome..."
ssh "$VPS_USER@$VPS_IP" "pkill -9 -f chrome"

# 3. Limpar completamente os diretórios de sessão
echo "3️⃣ Limpando diretórios de sessão..."
ssh "$VPS_USER@$VPS_IP" << 'EOF'
    cd /root/LifyChatbot-Node-Server
    
    echo "   Removendo .wwebjs_auth..."
    rm -rf .wwebjs_auth/*
    
    echo "   Removendo .wwebjs_cache..."
    rm -rf .wwebjs_cache/*
    
    echo "   Removendo sessions..."
    rm -rf sessions/*
    
    echo "   Removendo arquivos de lock..."
    find . -name "*.lock" -delete
    find . -name "SingletonLock" -delete
    
    echo "   Verificando permissões..."
    ls -la .wwebjs_auth/ 2>/dev/null || echo "   Diretório .wwebjs_auth não existe"
EOF

# 4. Verificar se há processos Chrome restantes
echo "4️⃣ Verificando processos Chrome restantes..."
CHROME_COUNT=$(ssh "$VPS_USER@$VPS_IP" "ps aux | grep chrome | grep -v grep | wc -l")
echo "   Processos Chrome restantes: $CHROME_COUNT"

if [ "$CHROME_COUNT" -gt 0 ]; then
    echo "   ⚠️  Ainda há processos Chrome. Matando novamente..."
    ssh "$VPS_USER@$VPS_IP" "pkill -9 -f chrome"
    sleep 3
fi

# 5. Reiniciar o servidor
echo "5️⃣ Reiniciando servidor WhatsApp..."
ssh "$VPS_USER@$VPS_IP" "pm2 start whatsapp-server"

# 6. Aguardar inicialização
echo "6️⃣ Aguardando inicialização..."
sleep 10

# 7. Verificar status
echo "7️⃣ Verificando status do servidor..."
ssh "$VPS_USER@$VPS_IP" "pm2 status"

# 8. Testar geração de QR Code
echo "8️⃣ Testando geração de QR Code..."
TEST_RESULT=$(ssh "$VPS_USER@$VPS_IP" "curl -s -X POST http://localhost:3001/api/whatsapp/generate-qr -H 'Content-Type: application/json' -d '{\"agentId\":\"test-sync-fix\"}' | head -c 200")

if [[ $TEST_RESULT == *"success"* ]]; then
    echo "✅ Servidor funcionando corretamente"
else
    echo "❌ Problema persistente"
    echo "   Resposta: $TEST_RESULT"
fi

# 9. Verificar logs
echo "9️⃣ Verificando logs mais recentes..."
ssh "$VPS_USER@$VPS_IP" "pm2 logs whatsapp-server --lines 10"

echo ""
echo "🎯 Próximos passos:"
echo "   1. Acesse a página de Agentes no frontend"
echo "   2. Gere um QR Code para um agente"
echo "   3. Escaneie o QR Code com WhatsApp"
echo "   4. Aguarde 30 segundos"
echo "   5. Verifique se o status muda para 'Conectado'"
echo ""
echo "🔍 Se o problema persistir, execute:"
echo "   ssh $VPS_USER@$VPS_IP"
echo "   pm2 logs whatsapp-server --lines 50"
echo "   # Procurar por erros específicos de autenticação" 