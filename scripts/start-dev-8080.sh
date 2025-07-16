#!/bin/bash

echo "🚀 Iniciando servidor de desenvolvimento na porta 8080..."

# Função para matar processos em uma porta
kill_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        echo "⚠️  Matando processo na porta $port..."
        lsof -ti :$port | xargs kill -9
        sleep 2
    fi
}

# Matar processos nas portas 8080, 8081, 8082
echo "🧹 Limpando portas..."
kill_port 8080
kill_port 8081
kill_port 8082

# Parar qualquer processo vite existente
echo "🛑 Parando processos Vite existentes..."
pkill -f "vite" 2>/dev/null || true
sleep 3

# Verificar se as portas estão livres
echo "🔍 Verificando portas..."
for port in 8080 8081 8082; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "❌ Porta $port ainda está em uso"
        lsof -i :$port
    else
        echo "✅ Porta $port está livre"
    fi
done

echo ""
echo "🎯 Iniciando servidor na porta 8080..."
echo "📱 URL: http://localhost:8080"
echo ""

# Iniciar o servidor
npm run dev 