#!/bin/bash

# Script de Deploy para VPS - AtendeAI Lify
# Execute na VPS: ./deploy-vps.sh

set -e

echo "🚀 Deploy para VPS - AtendeAI Lify"

# Instalar PM2 se não estiver instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Parar processo anterior se existir
pm2 stop atendeai-whatsapp || true
pm2 delete atendeai-whatsapp || true

# Iniciar servidor WhatsApp com PM2
echo "🔄 Iniciando servidor WhatsApp..."
pm2 start server.production.js --name "atendeai-whatsapp" --interpreter node

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar com o sistema
pm2 startup

echo "✅ Servidor WhatsApp iniciado com PM2"
echo "📊 Status: pm2 status"
echo "📋 Logs: pm2 logs atendeai-whatsapp"
