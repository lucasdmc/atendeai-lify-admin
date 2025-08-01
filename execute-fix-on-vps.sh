#!/bin/bash

echo "🚀 EXECUTANDO CORREÇÃO NA VPS"
echo "=============================="

# Verificar se estamos na VPS
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "❌ Node.js não está rodando na porta 3001"
    echo "💡 Iniciando Node.js..."
    
    # Navegar para o diretório da aplicação
    cd /root/atendeai-lify-admin || cd /home/ubuntu/atendeai-lify-admin || cd /var/www/atendeai-lify-admin
    
    # Iniciar com PM2
    pm2 start server.js --name "atendeai-backend" || echo "⚠️ Erro ao iniciar Node.js"
fi

# Executar o script de correção
echo "🔧 Executando correção do proxy reverso..."
bash fix-nginx-proxy.sh

echo ""
echo "✅ CORREÇÃO EXECUTADA!"
echo "======================"
echo "📱 Agora teste enviando uma mensagem no WhatsApp"
echo "📊 Para monitorar: pm2 logs atendeai-backend"
echo "🌐 Para ver logs: tail -f /var/log/nginx/access.log" 