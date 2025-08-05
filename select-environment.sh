
#!/bin/bash
# ========================================
# SELETOR DE AMBIENTE - DESENVOLVIMENTO/PRODUÇÃO
# ========================================

echo "🔧 SELETOR DE AMBIENTE"
echo "======================"

# Verificar argumento
if [ "$1" = "production" ]; then
    echo "📋 Configurando ambiente PRODUÇÃO (VPS)..."
    cp .env.production .env
    echo "✅ Ambiente de PRODUÇÃO configurado"
    echo "🌐 VITE_BACKEND_URL=https://atendeai-backend-production.up.railway.app"
    echo "🚀 Sistema pronto para VPS"
elif [ "$1" = "development" ]; then
    echo "📋 Configurando ambiente DESENVOLVIMENTO..."
    cp .env.development .env
    echo "✅ Ambiente de DESENVOLVIMENTO configurado"
    echo "🌐 VITE_BACKEND_URL=http://localhost:3001"
    echo "🔧 Sistema pronto para desenvolvimento local"
else
    echo "❌ Uso: ./select-environment.sh [development|production]"
    echo ""
    echo "Exemplos:"
    echo "  ./select-environment.sh development  # Para desenvolvimento local"
    echo "  ./select-environment.sh production   # Para VPS"
    exit 1
fi

echo ""
echo "📊 Configuração atual:"
echo "- NODE_ENV: $(grep NODE_ENV .env | cut -d'=' -f2)"
echo "- VITE_BACKEND_URL: $(grep VITE_BACKEND_URL .env | cut -d'=' -f2)"
echo "- LOG_LEVEL: $(grep LOG_LEVEL .env | cut -d'=' -f2)"
