#!/bin/bash

echo "🚀 Iniciando Front-end AtendeAí na porta 8080..."
echo "📱 URL: http://localhost:8080"
echo ""

# Verificar se a porta 8080 está em uso
if lsof -i :8080 > /dev/null 2>&1; then
    echo "⚠️  Porta 8080 está em uso. Matando processo..."
    lsof -ti :8080 | xargs kill -9
    sleep 2
fi

# Iniciar o servidor de desenvolvimento
echo "🎯 Iniciando servidor Vite..."
npm run dev:8080 