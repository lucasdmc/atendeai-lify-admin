#!/bin/bash

echo "=== APLICANDO CORREÇÕES DO BAILEYS ==="

# 1. Fazer backup do arquivo atual
echo "1. Fazendo backup..."
ssh root@31.97.241.19 "cd /root && cp server-baileys-production.js server-baileys-production.js.backup.$(date +%Y%m%d_%H%M%S)"

# 2. Instalar dependências necessárias
echo "2. Instalando dependências..."
ssh root@31.97.241.19 "cd /root && npm install pino qrcode qrcode-terminal @whiskeysockets/baileys"

# 3. Parar o servidor atual
echo "3. Parando servidor atual..."
ssh root@31.97.241.19 "pm2 stop atendeai-backend"

# 4. Aplicar as correções no arquivo
echo "4. Aplicando correções..."

# Adicionar importação do pino
ssh root@31.97.241.19 "cd /root && sed -i 's/import https from '\''https'\'';/import https from '\''https'\'';\nimport pino from '\''pino'\'';/' server-baileys-production.js"

# 5. Reiniciar o servidor
echo "5. Reiniciando servidor..."
ssh root@31.97.241.19 "pm2 start atendeai-backend"

# 6. Verificar logs
echo "6. Verificando logs..."
ssh root@31.97.241.19 "pm2 logs atendeai-backend --lines 20"

echo "=== CORREÇÕES APLICADAS ==="
echo "Agora teste o QR Code no frontend!" 