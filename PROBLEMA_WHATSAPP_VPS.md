# PROBLEMA: WhatsApp não está recebendo respostas

## 🔍 DIAGNÓSTICO

### Problema Identificado
A VPS `atendeai.com.br` está rodando **WordPress** (PHP/8.0.30) em vez do servidor Node.js que deveria processar os webhooks do WhatsApp.

### Evidências
- **Status**: 200 OK (VPS online)
- **Servidor**: LiteSpeed (WordPress)
- **Headers**: `x-powered-by: PHP/8.0.30`
- **Endpoints**: Todos retornando 404 (não existem no WordPress)

### Endpoints Testados
- `/webhook/whatsapp-meta` → 404
- `/webhook/test` → 404  
- `/api/ai/process` → 404
- `/health` → 404

## 🚨 CAUSA RAIZ

O servidor Node.js **não está rodando** na VPS. A VPS está servindo apenas o WordPress, não a aplicação Node.js que processa os webhooks do WhatsApp.

## 💡 SOLUÇÕES

### Solução 1: Verificar e Iniciar o Servidor Node.js na VPS

```bash
# Conectar na VPS
ssh root@atendeai.com.br

# Verificar se o PM2 está instalado
pm2 status

# Se não estiver rodando, iniciar o servidor
cd /path/to/atendeai-lify-admin
pm2 start server.js --name "atendeai-backend"

# Verificar logs
pm2 logs atendeai-backend
```

### Solução 2: Verificar Configuração do Nginx

```bash
# Verificar configuração do Nginx
nginx -t

# Verificar se há proxy reverso configurado
cat /etc/nginx/sites-available/atendeai.com.br

# Reiniciar Nginx se necessário
systemctl restart nginx
```

### Solução 3: Configurar Proxy Reverso no Nginx

Se o Node.js estiver rodando em uma porta diferente, configurar o Nginx para fazer proxy:

```nginx
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
    }
}
```

### Solução 4: Verificar Porta do Servidor Node.js

```bash
# Verificar se há processo Node.js rodando
ps aux | grep node

# Verificar portas em uso
netstat -tlnp | grep :3001

# Se não estiver rodando, iniciar manualmente
cd /path/to/atendeai-lify-admin
node server.js
```

## 🔧 PASSOS PARA CORRIGIR

### 1. Conectar na VPS
```bash
ssh root@atendeai.com.br
```

### 2. Verificar Status Atual
```bash
# Verificar PM2
pm2 status

# Verificar processos Node.js
ps aux | grep node

# Verificar portas
netstat -tlnp | grep :3001
```

### 3. Iniciar Servidor Node.js
```bash
# Navegar para o diretório da aplicação
cd /path/to/atendeai-lify-admin

# Instalar dependências se necessário
npm install

# Iniciar com PM2
pm2 start server.js --name "atendeai-backend"

# Verificar se iniciou
pm2 status
pm2 logs atendeai-backend
```

### 4. Configurar Nginx (se necessário)
```bash
# Editar configuração do site
nano /etc/nginx/sites-available/atendeai.com.br

# Aplicar configuração de proxy reverso (ver Solução 3)

# Testar configuração
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

### 5. Testar Webhook
```bash
# Testar localmente na VPS
curl -X POST http://localhost:3001/webhook/whatsapp-meta \
  -H "Content-Type: application/json" \
  -d '{"entry":[{"changes":[{"value":{"messages":[{"from":"5511999999999","text":{"body":"teste"}}]}}]}]}'
```

## 📊 STATUS ATUAL

- ✅ VPS online
- ❌ Servidor Node.js não está rodando
- ❌ Webhooks não funcionando
- ❌ WhatsApp não recebe respostas

## 🎯 PRÓXIMOS PASSOS

1. **Conectar na VPS** e verificar status do servidor
2. **Iniciar o servidor Node.js** com PM2
3. **Configurar Nginx** para proxy reverso (se necessário)
4. **Testar webhooks** localmente e externamente
5. **Verificar logs** para confirmar funcionamento

## 📞 CONTATO

Se precisar de ajuda para acessar a VPS ou configurar o servidor, entre em contato com o administrador da VPS. 