#!/bin/bash

echo "🔧 CORRIGINDO PROXY REVERSO DO NGINX"
echo "====================================="

# Configurações
DOMAIN="atendeai.com.br"
NODE_PORT="3001"
NGINX_CONFIG="/etc/nginx/sites-available/$DOMAIN"

echo "📋 Configurações:"
echo "   Domínio: $DOMAIN"
echo "   Node.js Porta: $NODE_PORT"
echo "   Config Nginx: $NGINX_CONFIG"
echo ""

# 1. Fazer backup da configuração atual
echo "💾 1. Fazendo backup da configuração atual..."
if [ -f "$NGINX_CONFIG" ]; then
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    echo "   ✅ Backup criado: $NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
else
    echo "   ⚠️ Arquivo de configuração não encontrado, criando novo"
fi
echo ""

# 2. Criar nova configuração do Nginx
echo "📝 2. Criando nova configuração do Nginx..."
cat > "$NGINX_CONFIG" << 'EOF'
server {
    listen 80;
    server_name atendeai.com.br;
    
    # WordPress (página principal)
    location / {
        root /var/www/html;
        index index.php index.html;
        try_files $uri $uri/ /index.php?$args;
    }
    
    # Node.js API (webhooks)
    location /webhook/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Configuração HTTPS (se necessário)
server {
    listen 443 ssl;
    server_name atendeai.com.br;
    
    # Configurações SSL (ajustar conforme necessário)
    # ssl_certificate /path/to/certificate.crt;
    # ssl_certificate_key /path/to/private.key;
    
    # WordPress (página principal)
    location / {
        root /var/www/html;
        index index.php index.html;
        try_files $uri $uri/ /index.php?$args;
    }
    
    # Node.js API (webhooks)
    location /webhook/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "   ✅ Configuração criada"
echo ""

# 3. Verificar se o Node.js está rodando
echo "🔍 3. Verificando se o Node.js está rodando..."
if curl -s http://localhost:$NODE_PORT/health > /dev/null; then
    echo "   ✅ Node.js está rodando na porta $NODE_PORT"
else
    echo "   ❌ Node.js não está rodando na porta $NODE_PORT"
    echo "   💡 Iniciando Node.js..."
    pm2 start server.js --name "atendeai-backend" || echo "   ⚠️ Erro ao iniciar Node.js"
fi
echo ""

# 4. Testar configuração do Nginx
echo "🧪 4. Testando configuração do Nginx..."
if nginx -t; then
    echo "   ✅ Configuração do Nginx está válida"
else
    echo "   ❌ Erro na configuração do Nginx"
    exit 1
fi
echo ""

# 5. Reiniciar Nginx
echo "🔄 5. Reiniciando Nginx..."
systemctl restart nginx
if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx reiniciado com sucesso"
else
    echo "   ❌ Erro ao reiniciar Nginx"
    exit 1
fi
echo ""

# 6. Testar webhook
echo "📨 6. Testando webhook..."
TEST_RESPONSE=$(curl -s -X POST https://$DOMAIN/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}')

if echo "$TEST_RESPONSE" | grep -q "success.*true\|Webhook recebido"; then
    echo "   ✅ Webhook funcionando!"
    echo "   📝 Resposta: $TEST_RESPONSE"
else
    echo "   ❌ Webhook não funcionando"
    echo "   📝 Resposta: $TEST_RESPONSE"
fi
echo ""

# 7. Testar health check
echo "🏥 7. Testando health check..."
HEALTH_RESPONSE=$(curl -s https://$DOMAIN/health)
if echo "$HEALTH_RESPONSE" | grep -q "healthy\|ok"; then
    echo "   ✅ Health check funcionando!"
else
    echo "   ❌ Health check não funcionando"
    echo "   📝 Resposta: $HEALTH_RESPONSE"
fi
echo ""

echo "🎉 CORREÇÃO CONCLUÍDA!"
echo "======================"
echo "✅ Proxy reverso configurado"
echo "✅ Nginx reiniciado"
echo "✅ Webhook testado"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "   1. Testar envio de mensagem no WhatsApp"
echo "   2. Verificar logs: tail -f /var/log/nginx/access.log"
echo "   3. Monitorar: pm2 logs atendeai-backend"
echo ""
echo "🔧 COMANDOS ÚTEIS:"
echo "   - Ver logs Nginx: tail -f /var/log/nginx/error.log"
echo "   - Ver status PM2: pm2 status"
echo "   - Testar webhook: curl -X POST https://$DOMAIN/webhook/whatsapp-meta" 