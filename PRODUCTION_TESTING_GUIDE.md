# 🚀 Guia de Teste em Produção - AtendeAI Lify

## 📋 Checklist de Deploy

### ✅ **1. Configurações do Frontend**
- [ ] Build otimizado executado
- [ ] Variáveis de ambiente configuradas
- [ ] CORS configurado para `https://atendeai.lify.com.br`
- [ ] Google OAuth configurado para produção

### ✅ **2. Configurações da VPS**
- [ ] Servidor VPS acessível
- [ ] Porta 3001 liberada no firewall
- [ ] Node.js instalado
- [ ] PM2 instalado e configurado
- [ ] Servidor WhatsApp rodando

### ✅ **3. Configurações do Domínio**
- [ ] DNS configurado para `atendeai.lify.com.br`
- [ ] SSL/HTTPS configurado
- [ ] Proxy reverso (Nginx) configurado
- [ ] Redirecionamentos funcionando

## 🧪 **Testes de Funcionalidade**

### **1. Teste de Autenticação**
```bash
# URL: https://atendeai.lify.com.br
# Ações:
1. Acessar a página inicial
2. Fazer login com credenciais válidas
3. Verificar se redireciona para dashboard
4. Testar logout
```

### **2. Teste de Agendamentos**
```bash
# URL: https://atendeai.lify.com.br/agendamentos
# Ações:
1. Verificar se carrega sem erro 406
2. Testar conexão com Google Calendar
3. Criar um agendamento de teste
4. Editar o agendamento
5. Deletar o agendamento
```

### **3. Teste de WhatsApp**
```bash
# URL: https://atendeai.lify.com.br/agentes
# Ações:
1. Acessar página de agentes
2. Gerar QR Code para um agente
3. Escanear QR Code com WhatsApp
4. Verificar status de conexão
5. Enviar mensagem de teste
```

### **4. Teste de Performance**
```bash
# Verificações:
1. Tempo de carregamento inicial < 3s
2. Carregamento de agendamentos < 2s
3. Geração de QR Code < 5s
4. Sem travamentos na interface
```

## 🔧 **Comandos de Deploy**

### **1. Preparar Build Local**
```bash
# No diretório do projeto
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### **2. Deploy na VPS**
```bash
# Copiar arquivos para VPS
scp -r dist/ usuario@seu-servidor-vps.com:/home/usuario/atendeai/
scp scripts/deploy-vps.sh usuario@seu-servidor-vps.com:/home/usuario/

# Conectar na VPS
ssh usuario@seu-servidor-vps.com

# Executar deploy
cd /home/usuario
chmod +x deploy-vps.sh
./deploy-vps.sh
```

### **3. Verificar Status**
```bash
# Na VPS
pm2 status
pm2 logs atendeai-whatsapp
pm2 monit
```

## 🌐 **Configuração do Nginx**

### **Arquivo de Configuração**
```nginx
server {
    listen 80;
    server_name atendeai.lify.com.br;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name atendeai.lify.com.br;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Frontend
    location / {
        root /var/www/atendeai;
        try_files $uri $uri/ /index.html;
        
        # Cache estático
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
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

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        access_log off;
    }
}
```

## 📊 **Monitoramento**

### **1. Logs do Frontend**
```bash
# Verificar logs do Lify
# Acessar dashboard do Lify
# Verificar métricas de performance
```

### **2. Logs do Backend**
```bash
# Na VPS
pm2 logs atendeai-whatsapp --lines 100
pm2 logs atendeai-whatsapp --follow
```

### **3. Health Checks**
```bash
# Verificar status da API
curl https://atendeai.lify.com.br/api/health

# Verificar status do WhatsApp
curl https://atendeai.lify.com.br/api/whatsapp/status/agent-id
```

## 🔒 **Segurança**

### **1. Variáveis de Ambiente**
```bash
# Verificar se estão protegidas
- VITE_GOOGLE_CLIENT_ID
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_WHATSAPP_SERVER_URL
```

### **2. CORS**
```bash
# Verificar se está configurado corretamente
- Origin: https://atendeai.lify.com.br
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization
```

## 🚨 **Troubleshooting**

### **Problema: Erro 406**
```bash
# Solução:
1. Verificar se a tabela user_calendars existe
2. Verificar se o usuário tem calendários conectados
3. Verificar se os tokens estão válidos
```

### **Problema: Loading Lento**
```bash
# Solução:
1. Verificar cache do navegador
2. Verificar conexão com Supabase
3. Verificar timeout das requisições
4. Verificar logs do backend
```

### **Problema: WhatsApp Não Conecta**
```bash
# Solução:
1. Verificar se o servidor está rodando
2. Verificar logs do PM2
3. Verificar firewall da VPS
4. Verificar QR Code gerado
```

## 📞 **Contatos de Suporte**

- **Desenvolvimento**: Lucas Cantoni
- **Infraestrutura**: VPS Provider
- **Domínio**: Lify.com.br
- **Banco de Dados**: Supabase

## 🎯 **URLs de Produção**

- **Frontend**: https://atendeai.lify.com.br
- **API**: https://atendeai.lify.com.br/api
- **Health Check**: https://atendeai.lify.com.br/health
- **Dashboard**: https://atendeai.lify.com.br/dashboard
- **Agendamentos**: https://atendeai.lify.com.br/agendamentos
- **Agentes**: https://atendeai.lify.com.br/agentes

## ✅ **Checklist Final**

- [ ] Sistema carrega sem erros
- [ ] Login funciona corretamente
- [ ] Agendamentos carregam rapidamente
- [ ] WhatsApp conecta sem problemas
- [ ] Performance está otimizada
- [ ] Logs estão funcionando
- [ ] Backup está configurado
- [ ] Monitoramento ativo

---

**🎉 Sistema pronto para produção!** 