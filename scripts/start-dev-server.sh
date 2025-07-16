#!/bin/bash

echo "🚀 Iniciando servidor de desenvolvimento na porta 8080..."

# Verificar se a porta 8080 está em uso
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  Porta 8080 está em uso. Matando processo..."
    lsof -ti :8080 | xargs kill -9
    sleep 2
fi

# Verificar se a porta 8081 está em uso
if lsof -i :8081 > /dev/null 2>&1; then
    echo "⚠️  Porta 8081 está em uso. Matando processo..."
    lsof -ti :8081 | xargs kill -9
    sleep 2
fi

# Parar qualquer processo vite existente
echo "🧹 Parando processos Vite existentes..."
pkill -f "vite" 2>/dev/null || true
sleep 2

# Verificar se as portas estão livres
echo "🔍 Verificando portas..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "❌ Porta 8080 ainda está em uso"
    exit 1
fi

if lsof -i :8081 > /dev/null 2>&1; then
    echo "❌ Porta 8081 ainda está em uso"
    exit 1
fi

echo "✅ Portas livres. Iniciando servidor..."

# Iniciar o servidor
npm run dev 