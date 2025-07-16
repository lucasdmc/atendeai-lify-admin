#!/bin/bash

echo "🧹 Limpando sessões do WhatsApp na VPS..."
echo "=========================================="

# Configurações da VPS
VPS_HOST="31.97.241.19"
VPS_USER="root"

# Função para log colorido
log() {
    echo -e "\033[0;32m[$(date +'%Y-%m-%d %H:%M:%S')] $1\033[0m"
}

warn() {
    echo -e "\033[1;33m[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1\033[0m"
}

error() {
    echo -e "\033[0;31m[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1\033[0m"
}

# 1. Parar o servidor WhatsApp
log "🛑 Parando servidor WhatsApp..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "Parando PM2..."
    pm2 stop atendeai-backend 2>/dev/null || echo "Servidor não estava rodando"
    pm2 delete atendeai-backend 2>/dev/null || echo "Servidor não estava no PM2"
    
    echo "Matando processos Chrome..."
    pkill -f chrome 2>/dev/null || echo "Nenhum processo Chrome encontrado"
    pkill -f chromium 2>/dev/null || echo "Nenhum processo Chromium encontrado"
    
    echo "Aguardando 3 segundos..."
    sleep 3
    
    echo "Verificando se ainda há processos Chrome..."
    ps aux | grep chrome | grep -v grep || echo "Nenhum processo Chrome restante"
EOF

# 2. Limpar diretórios de sessão
log "🧹 Limpando diretórios de sessão..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "Limpando diretório .wwebjs_auth..."
    rm -rf /root/LifyChatbot-Node-Server/.wwebjs_auth/* 2>/dev/null || echo "Diretório já estava limpo"
    
    echo "Limpando diretório sessions..."
    rm -rf /root/atendeai-lify-admin/sessions/* 2>/dev/null || echo "Diretório sessions não existe"
    
    echo "Limpando diretório whatsapp-data..."
    rm -rf /root/atendeai-lify-admin/whatsapp-data/* 2>/dev/null || echo "Diretório whatsapp-data não existe"
    
    echo "Limpando cache do Chrome..."
    rm -rf /root/.cache/chromium 2>/dev/null || echo "Cache do Chrome não existe"
    rm -rf /root/.config/chromium 2>/dev/null || echo "Config do Chrome não existe"
    
    echo "Verificando espaço em disco..."
    df -h /root
EOF

# 3. Limpar tabela de conexões no Supabase
log "🗄️ Limpando tabela de conexões no Supabase..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "Atualizando status das conexões para disconnected..."
    curl -s -X POST https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/disconnect-all \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw" \
        -d '{"action":"disconnect-all"}' || echo "Erro ao limpar conexões"
EOF

# 4. Reiniciar o servidor
log "🚀 Reiniciando servidor WhatsApp..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "Navegando para o diretório do projeto..."
    cd /root/atendeai-lify-admin
    
    echo "Verificando se o servidor existe..."
    ls -la server.cjs
    
    echo "Iniciando servidor com PM2..."
    pm2 start server.cjs --name "atendeai-backend" --env production
    
    echo "Salvando configuração do PM2..."
    pm2 save
    
    echo "Aguardando 5 segundos para o servidor inicializar..."
    sleep 5
    
    echo "Verificando status do PM2..."
    pm2 status
    
    echo "Verificando logs do servidor..."
    pm2 logs atendeai-backend --lines 10
EOF

# 5. Testar conectividade
log "🧪 Testando conectividade..."
sleep 3

echo "Testando health check..."
curl -s http://$VPS_HOST:3001/health && echo "✅ Servidor respondendo!" || echo "❌ Servidor não responde"

echo "Testando geração de QR Code..."
curl -s -X POST http://$VPS_HOST:3001/api/whatsapp/generate-qr \
    -H "Content-Type: application/json" \
    -d '{"agentId":"test-cleanup"}' | head -c 100 && echo "..." || echo "❌ Erro ao gerar QR Code"

# 6. Verificar processos
log "📊 Verificando processos..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "=== Processos Chrome ==="
    ps aux | grep chrome | grep -v grep | wc -l
    
    echo "=== Processos Node ==="
    ps aux | grep node | grep -v grep | wc -l
    
    echo "=== Uso de memória ==="
    free -h
    
    echo "=== Uso de CPU ==="
    top -bn1 | head -5
EOF

log "✅ Limpeza concluída!"
echo ""
echo "📋 Próximos passos:"
echo "1. Teste a conexão no frontend"
echo "2. Gere um novo QR Code"
echo "3. Escaneie o QR Code com o WhatsApp"
echo "4. Verifique se a sincronização funciona"
echo ""
echo "🔗 URLs de teste:"
echo "- Health Check: http://$VPS_HOST:3001/health"
echo "- Frontend: http://localhost:8080/agentes" 