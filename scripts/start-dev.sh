#!/bin/bash

# ========================================
# SCRIPT DE INICIALIZAÇÃO - DESENVOLVIMENTO
# ========================================

echo "🚀 INICIANDO SISTEMA AI - DESENVOLVIMENTO"
echo "=========================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se o backend existe
if [ ! -d "../atendeai-lify-backend" ]; then
    echo "❌ Backend não encontrado em ../atendeai-lify-backend"
    exit 1
fi

# Verificar se .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado"
    echo "📝 Copie as configurações de ai-config-template.env para .env"
    exit 1
fi

echo "✅ Verificações iniciais concluídas"

# Função para parar processos
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    echo "✅ Serviços parados"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Iniciar backend em background
echo "🔧 Iniciando backend..."
cd ../atendeai-lify-backend
npm start &
BACKEND_PID=$!
cd ../atendeai-lify-admin

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 3

# Verificar se backend está rodando
if curl -f http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Backend iniciado com sucesso"
else
    echo "❌ Falha ao iniciar backend"
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

# Aguardar frontend inicializar
echo "⏳ Aguardando frontend inicializar..."
sleep 5

# Verificar se frontend está rodando
if curl -f http://localhost:8080 >/dev/null 2>&1; then
    echo "✅ Frontend iniciado com sucesso"
else
    echo "❌ Falha ao iniciar frontend"
    exit 1
fi

echo ""
echo "🎉 SISTEMA AI INICIADO COM SUCESSO!"
echo "====================================="
echo ""
echo "🌐 URLs:"
echo "Frontend: http://localhost:8080"
echo "Backend:  http://localhost:3001"
echo "Health:   http://localhost:3001/health"
echo "AI API:   http://localhost:3001/api/ai"
echo ""
echo "📊 Para ver logs:"
echo "Backend:  tail -f ../atendeai-lify-backend/logs/*.log"
echo "Frontend: tail -f logs/*.log"
echo ""
echo "🛑 Pressione Ctrl+C para parar todos os serviços"
echo ""

# Manter script rodando
wait 