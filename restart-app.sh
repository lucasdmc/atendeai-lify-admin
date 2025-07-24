#!/bin/bash

echo "🔄 Reiniciando aplicação AtendeAí..."

# Função para matar processos
kill_process() {
    local process_name=$1
    local pids=$(pgrep -f "$process_name")
    if [ ! -z "$pids" ]; then
        echo "🛑 Parando $process_name..."
        kill $pids 2>/dev/null || true
        sleep 2
    fi
}

# Parar processos existentes
kill_process "node server.js"
kill_process "vite"

echo "⏳ Aguardando processos terminarem..."
sleep 3

# Iniciar backend
echo "🚀 Iniciando backend..."
cd ../atendeai-lify-backend
npm start &
BACKEND_PID=$!

# Aguardar backend inicializar
echo "⏳ Aguardando backend inicializar..."
sleep 5

# Verificar se backend está rodando
if curl -s http://localhost:3001/health > /dev/null; then
    echo "✅ Backend iniciado com sucesso na porta 3001"
else
    echo "❌ Erro ao iniciar backend"
    exit 1
fi

# Iniciar frontend
echo "🎨 Iniciando frontend..."
cd ../atendeai-lify-admin
npm run dev &
FRONTEND_PID=$!

# Aguardar frontend inicializar
echo "⏳ Aguardando frontend inicializar..."
sleep 8

# Verificar se frontend está rodando
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend iniciado com sucesso na porta 8080"
else
    echo "❌ Erro ao iniciar frontend"
    exit 1
fi

echo ""
echo "🎉 Aplicação reiniciada com sucesso!"
echo ""
echo "📱 URLs de acesso:"
echo "   Frontend: http://localhost:8080"
echo "   Backend:  http://localhost:3001"
echo "   Health:   http://localhost:3001/health"
echo ""
echo "🛑 Para parar a aplicação, pressione Ctrl+C"

# Manter script rodando
wait 