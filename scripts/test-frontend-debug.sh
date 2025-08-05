#!/bin/bash

# Script para testar frontend e capturar logs da Edge Function
# VPS: atendeai.server.com.br (atendeai-backend-production.up.railway.app)

echo "🧪 Teste Frontend + Debug - VPS AtendeAI"
echo "========================================"

# Configurações
VPS_IP="atendeai-backend-production.up.railway.app"
VPS_USER="root"

echo "📍 VPS: $VPS_IP"
echo ""

# 1. Verificar se o backend está rodando
echo "🔍 1. Verificando backend..."
ssh "$VPS_USER@$VPS_IP" "pm2 list | grep LifyChatbot-Node-Server"

# 2. Limpar arquivo de logs
echo ""
echo "🧹 2. Limpando logs anteriores..."
ssh "$VPS_USER@$VPS_IP" "> /tmp/whatsapp-requests.log"

# 3. Iniciar monitoramento de logs
echo ""
echo "📊 3. Iniciando monitoramento de logs..."
echo "💡 Agora teste a geração de QR Code pelo frontend!"
echo "⏰ Monitorando por 120 segundos..."

# Monitorar logs em background
ssh "$VPS_USER@$VPS_IP" "
    timeout 120s bash -c '
        echo \"🔍 Monitorando logs...\"
        pm2 logs LifyChatbot-Node-Server --lines 0 &
        PM2_PID=\$!
        tail -f /tmp/whatsapp-requests.log &
        TAIL_PID=\$!
        wait
        kill \$PM2_PID 2>/dev/null || true
        kill \$TAIL_PID 2>/dev/null || true
    '
" &

# 4. Aguardar um pouco e mostrar instruções
sleep 5
echo ""
echo "🎯 INSTRUÇÕES PARA TESTE:"
echo "=========================="
echo "1. Abra o frontend em outra aba"
echo "2. Vá para a seção de Agentes/WhatsApp"
echo "3. Tente gerar um QR Code para qualquer agente"
echo "4. Observe se aparece erro 500 ou funciona"
echo "5. Os logs serão capturados automaticamente"
echo ""
echo "⏰ Aguardando 120 segundos para capturar logs..."

# Aguardar o monitoramento
wait

# 5. Mostrar resultados
echo ""
echo "📋 RESULTADOS DO DEBUG:"
echo "======================="

# Verificar se houve requests capturados
ssh "$VPS_USER@$VPS_IP" "
    echo '📝 Arquivo de requests:'
    ls -la /tmp/whatsapp-requests.log
    echo ''
    echo '📄 Conteúdo dos logs:'
    cat /tmp/whatsapp-requests.log
    echo ''
    echo '📊 Últimos logs do PM2:'
    pm2 logs LifyChatbot-Node-Server --lines 20
"

echo ""
echo "🎯 Debug concluído!"
echo "📝 Verifique os logs acima para identificar diferenças" 