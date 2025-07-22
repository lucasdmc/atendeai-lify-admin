#!/bin/bash

echo "🔍 Monitorando servidor VPS..."
echo "⏰ Aguardando servidor voltar online..."
echo ""

attempts=0
max_attempts=60

while [ $attempts -lt $max_attempts ]; do
    attempts=$((attempts + 1))
    
    echo "📡 Tentativa $attempts/$max_attempts - Testando conectividade..."
    
    # Teste de ping
    if ping -c 1 31.97.241.19 &> /dev/null; then
        echo "✅ Ping OK - Servidor respondendo!"
        
        # Teste de porta
        if curl -s --connect-timeout 5 http://31.97.241.19:3001/health &> /dev/null; then
            echo "✅ Porta 3001 OK - Servidor WhatsApp funcionando!"
        else
            echo "⚠️ Porta 3001 não responde ainda - Servidor pode estar inicializando..."
        fi
        
        # Teste SSH
        if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@31.97.241.19 "echo OK" &> /dev/null; then
            echo "✅ SSH OK - Conectividade completa!"
        else
            echo "⚠️ SSH não responde ainda - Pode estar inicializando..."
        fi
        
        echo ""
        echo "🎉 SERVIDOR ONLINE!"
        echo ""
        echo "📋 Próximos passos:"
        echo "   1. Aguarde mais 1-2 minutos para inicialização completa"
        echo "   2. Teste: ssh root@31.97.241.19 \"pm2 list\""
        echo "   3. Se necessário, reinicie o servidor WhatsApp"
        echo "   4. Teste QR Code: curl -X POST http://31.97.241.19:3001/api/whatsapp/generate-qr"
        
        exit 0
    else
        echo "❌ Tentativa $attempts falhou - Servidor ainda offline"
        
        if [ $attempts -ge $max_attempts ]; then
            echo ""
            echo "⏰ Timeout - Servidor não voltou online em 5 minutos"
            echo "📋 Verifique:"
            echo "   1. Se a VPS realmente reiniciou no painel"
            echo "   2. Se há problemas de hardware"
            echo "   3. Se há problemas de rede"
            exit 1
        fi
        
        echo "⏰ Aguardando 5 segundos..."
        sleep 5
    fi
done 