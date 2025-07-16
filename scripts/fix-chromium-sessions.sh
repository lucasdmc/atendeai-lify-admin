#!/bin/bash

echo "🔧 CORREÇÃO DEFINITIVA - Sessões Chromium"
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

log "🚀 Iniciando correção definitiva das sessões Chromium..."

# 1. PARAR COMPLETAMENTE O SISTEMA
log "1️⃣ Parando completamente o sistema..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "🛑 Parando todos os serviços..."
    
    # Parar PM2
    pm2 stop all 2>/dev/null || echo "PM2 já estava parado"
    pm2 delete all 2>/dev/null || echo "PM2 já estava limpo"
    
    # Matar TODOS os processos Chrome/Chromium
    echo "🔪 Matando todos os processos Chrome..."
    pkill -f chrome 2>/dev/null || echo "Nenhum processo Chrome encontrado"
    pkill -f chromium 2>/dev/null || echo "Nenhum processo Chromium encontrado"
    pkill -f chromium-browser 2>/dev/null || echo "Nenhum processo chromium-browser encontrado"
    
    # Matar processos Node relacionados ao WhatsApp
    echo "🔪 Matando processos Node..."
    pkill -f "node.*server" 2>/dev/null || echo "Nenhum processo Node encontrado"
    pkill -f "node.*whatsapp" 2>/dev/null || echo "Nenhum processo WhatsApp encontrado"
    
    # Aguardar para garantir que todos os processos foram finalizados
    echo "⏳ Aguardando 5 segundos..."
    sleep 5
    
    # Verificar se ainda há processos
    echo "🔍 Verificando processos restantes..."
    ps aux | grep -E "(chrome|chromium|node.*server)" | grep -v grep || echo "Nenhum processo restante"
EOF

# 2. LIMPEZA COMPLETA DE DIRETÓRIOS
log "2️⃣ Limpeza completa de diretórios..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "🧹 Limpando diretórios de sessão..."
    
    # Limpar diretórios do WhatsApp
    rm -rf /root/LifyChatbot-Node-Server/.wwebjs_auth/* 2>/dev/null || echo "Diretório .wwebjs_auth já estava limpo"
    rm -rf /root/atendeai-lify-admin/sessions/* 2>/dev/null || echo "Diretório sessions não existe"
    rm -rf /root/atendeai-lify-admin/whatsapp-data/* 2>/dev/null || echo "Diretório whatsapp-data não existe"
    
    # Limpar cache do Chrome/Chromium
    echo "🧹 Limpando cache do Chrome..."
    rm -rf /root/.cache/chromium 2>/dev/null || echo "Cache do Chrome não existe"
    rm -rf /root/.config/chromium 2>/dev/null || echo "Config do Chrome não existe"
    rm -rf /root/.cache/google-chrome 2>/dev/null || echo "Cache do Google Chrome não existe"
    rm -rf /root/.config/google-chrome 2>/dev/null || echo "Config do Google Chrome não existe"
    
    # Limpar arquivos temporários
    echo "🧹 Limpando arquivos temporários..."
    rm -rf /tmp/.org.chromium.Chromium.* 2>/dev/null || echo "Arquivos temporários do Chrome não existem"
    rm -rf /tmp/.com.google.Chrome.* 2>/dev/null || echo "Arquivos temporários do Google Chrome não existem"
    
    # Verificar espaço em disco
    echo "💾 Verificando espaço em disco..."
    df -h /root
EOF

# 3. REINICIAR SERVIÇOS LIMPOS
log "3️⃣ Reiniciando serviços limpos..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "🚀 Reiniciando servidor WhatsApp..."
    
    # Navegar para o diretório do projeto
    cd /root/atendeai-lify-admin
    
    # Verificar se o servidor existe
    ls -la server.cjs
    
    # Iniciar servidor com PM2
    echo "📦 Iniciando PM2..."
    pm2 start server.cjs --name "atendeai-backend" --env production
    
    # Salvar configuração
    pm2 save
    
    # Aguardar inicialização
    echo "⏳ Aguardando 10 segundos para inicialização..."
    sleep 10
    
    # Verificar status
    echo "📊 Status do PM2:"
    pm2 status
    
    echo "📊 Processos ativos:"
    ps aux | grep -E "(chrome|chromium|node)" | grep -v grep || echo "Nenhum processo ativo"
EOF

# 4. VERIFICAR CONECTIVIDADE
log "4️⃣ Verificando conectividade..."
sleep 5

echo "🧪 Testando health check..."
curl -s http://$VPS_HOST:3001/health | jq '.' 2>/dev/null || curl -s http://$VPS_HOST:3001/health

# 5. TESTAR NOVA CONEXÃO
log "5️⃣ Testando nova conexão..."
echo "🧪 Testando geração de QR Code..."
curl -s -X POST http://$VPS_HOST:3001/api/whatsapp/generate-qr \
    -H "Content-Type: application/json" \
    -d '{"agentId":"test-cleanup"}' | head -c 100 && echo "..." || echo "❌ Erro ao gerar QR Code"

# 6. VERIFICAR PROCESSOS FINAIS
log "6️⃣ Verificação final..."
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'EOF'
    echo "📊 === VERIFICAÇÃO FINAL ==="
    
    echo "🔍 Processos Chrome/Chromium:"
    ps aux | grep -E "(chrome|chromium)" | grep -v grep | wc -l
    
    echo "🔍 Processos Node:"
    ps aux | grep node | grep -v grep | wc -l
    
    echo "💾 Uso de memória:"
    free -h
    
    echo "🖥️ Uso de CPU:"
    top -bn1 | head -5
    
    echo "📁 Diretórios de sessão:"
    ls -la /root/LifyChatbot-Node-Server/.wwebjs_auth/ 2>/dev/null || echo "Diretório não existe"
    
    echo "📊 Status do PM2:"
    pm2 status
EOF

log "✅ Correção definitiva concluída!"
echo ""
echo "📋 RESULTADO ESPERADO:"
echo "✅ Apenas 1 processo Chrome por sessão"
echo "✅ Sessões não travam mais"
echo "✅ QR Code gera corretamente"
echo "✅ Conexão sincroniza normalmente"
echo ""
echo "🚀 PRÓXIMOS PASSOS:"
echo "1. Teste uma nova conexão no frontend"
echo "2. Gere QR Code para um agente"
echo "3. Escaneie com WhatsApp"
echo "4. Verifique se sincroniza corretamente"
echo ""
echo "🔗 URLs:"
echo "- Frontend: http://localhost:8080/agentes"
echo "- Health Check: http://$VPS_HOST:3001/health" 