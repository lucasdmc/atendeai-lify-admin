#!/bin/bash

echo "🚀 ATUALIZAÇÃO RÁPIDA VPS"
echo "=========================="

cd /home/lucascantoni/Lify-AtendeAI/atendeai-lify-admin/atendeai-lify-admin

echo "📥 Atualizando código..."
git pull origin main

echo "📦 Instalando dependências..."
npm install

echo "🛑 Parando servidor..."
pkill -f "server.js"
sleep 2

echo "🚀 Reiniciando servidor..."
nohup node server.js > logs.txt 2>&1 &

echo "✅ Pronto! Servidor reiniciado."
echo "📋 Logs: tail -f logs.txt"
echo "🌐 URL: http://31.97.241.19:3001" 