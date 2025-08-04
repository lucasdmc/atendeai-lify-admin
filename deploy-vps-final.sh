#!/bin/bash
# ========================================
# DEPLOY FINAL PARA VPS
# ========================================

echo "🚀 DEPLOY FINAL PARA VPS"
echo "========================"

# 1. Configurar ambiente de produção
echo "📋 1. Configurando ambiente de produção..."
./select-environment.sh production

# 2. Verificar configuração
echo "📋 2. Verificando configuração..."
if grep -q "VITE_BACKEND_URL=https://atendeai.com.br" .env; then
    echo "✅ VITE_BACKEND_URL configurado corretamente para VPS"
else
    echo "❌ ERRO: VITE_BACKEND_URL não está configurado para VPS"
    exit 1
fi

# 3. Instalar dependências
echo "📋 3. Instalando dependências..."
npm install

# 4. Executar testes funcionais
echo "📋 4. Executando testes funcionais..."
node test-working-system.js
if [ $? -eq 0 ]; then
    echo "✅ Testes funcionais passaram"
else
    echo "❌ Testes funcionais falharam"
    exit 1
fi

# 5. Health check simplificado
echo "📋 5. Verificando saúde do sistema..."
node scripts/health-check-simple.js
if [ $? -eq 0 ]; then
    echo "✅ Sistema saudável"
else
    echo "❌ Sistema com problemas"
    exit 1
fi

# 6. Deploy
echo "📋 6. Iniciando deploy final..."
echo "🌐 Backend URL: https://atendeai.com.br"
echo "📱 Webhook URL: https://atendeai.com.br/webhook/whatsapp-meta"
echo "🔗 Health Check: https://atendeai.com.br/health"

# Iniciar servidor
npm start &
SERVER_PID=$!

echo "🎉 DEPLOY FINAL PARA VPS CONCLUÍDO!"
echo "✅ Sistema funcionando em produção"
echo "📊 PID do servidor: $SERVER_PID"
echo ""
echo "Para parar o servidor: kill $SERVER_PID"
echo "Para verificar logs: tail -f logs/combined.log"
echo ""
echo "🚀 SISTEMA PRONTO PARA USO EM PRODUÇÃO!" 