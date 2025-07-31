# 🚀 GUIA DE DEPLOY COMPLETO - SISTEMA AI

## 📋 **PRÉ-REQUISITOS**

### **1. Servidor/Ambiente**
- Ubuntu 20.04+ ou similar
- Node.js 18+
- npm ou yarn
- Git
- PM2 (será instalado automaticamente)

### **2. Contas e APIs**
- **Supabase**: Projeto configurado
- **OpenAI**: API Key para GPT-4o, Whisper, TTS
- **Anthropic**: API Key para Claude 3.5 Sonnet
- **Google AI**: API Key para Gemini Pro

---

## 🔧 **PASSO A PASSO**

### **Passo 1: Preparar o Ambiente**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version

# Instalar PM2 globalmente
npm install -g pm2

# Instalar Supabase CLI
curl -fsSL https://supabase.com/install.sh | sh
```

### **Passo 2: Clonar e Configurar Projetos**

```bash
# Criar diretório do projeto
mkdir -p /var/www/atendeai
cd /var/www/atendeai

# Clonar repositórios
git clone https://github.com/seu-usuario/atendeai-lify-admin.git
git clone https://github.com/seu-usuario/atendeai-lify-backend.git

# Entrar no diretório frontend
cd atendeai-lify-admin
```

### **Passo 3: Configurar Variáveis de Ambiente**

```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar variáveis de ambiente
nano .env
```

**Conteúdo do `.env`:**
```env
# Supabase
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# JWT
JWT_SECRET=sua_chave_jwt_super_secreta

# OpenAI
OPENAI_API_KEY=sua_chave_openai
OPENAI_ORG_ID=sua_org_id_opcional

# Anthropic
ANTHROPIC_API_KEY=sua_chave_anthropic

# Google AI
GOOGLE_API_KEY=sua_chave_google
GOOGLE_PROJECT_ID=seu_project_id

# Azure (opcional)
AZURE_OPENAI_API_KEY=sua_chave_azure
AZURE_OPENAI_ENDPOINT=seu_endpoint_azure
AZURE_OPENAI_DEPLOYMENT_NAME=seu_deployment_name

# Servidor
NODE_ENV=production
PORT=3000
```

### **Passo 4: Configurar Banco de Dados**

1. **Acessar Supabase Dashboard**
2. **Ir para SQL Editor**
3. **Executar script de reset:**
   ```sql
   -- Copiar e executar o conteúdo de:
   -- scripts/reset-database-complete-simple.sql
   ```

### **Passo 5: Instalar Dependências**

```bash
# Frontend
npm install

# Backend
cd ../atendeai-lify-backend
npm install
cd ../atendeai-lify-admin

# Dependências AI específicas
npm install openai @anthropic-ai/sdk @google/generative-ai
```

### **Passo 6: Executar Deploy Automático**

```bash
# Tornar script executável
chmod +x scripts/deploy-ai-system.sh

# Executar deploy
./scripts/deploy-ai-system.sh
```

### **Passo 7: Verificar Deploy**

```bash
# Verificar status dos serviços
pm2 status

# Verificar logs
pm2 logs

# Testar endpoints
curl http://localhost:3000
curl http://localhost:3001/health
curl http://localhost:3001/api/ai/test-connection
```

---

## 🔍 **VERIFICAÇÕES PÓS-DEPLOY**

### **1. Testar Frontend**
- Acessar: `http://seu-ip:3000`
- Verificar se carrega corretamente
- Testar login/autenticação

### **2. Testar Backend**
- Acessar: `http://seu-ip:3001/health`
- Verificar resposta de saúde
- Testar autenticação JWT

### **3. Testar APIs AI**
- Acessar: `http://seu-ip:3001/api/ai/test-connection`
- Verificar conectividade com todas as APIs
- Testar chat AI no dashboard

### **4. Verificar Banco de Dados**
- Acessar Supabase Dashboard
- Verificar se todas as tabelas foram criadas
- Testar inserção de dados

---

## 📊 **MONITORAMENTO**

### **Comandos PM2 Úteis**

```bash
# Status dos serviços
pm2 status

# Logs em tempo real
pm2 logs

# Monitoramento interativo
pm2 monit

# Reiniciar todos os serviços
pm2 restart all

# Parar todos os serviços
pm2 stop all

# Iniciar todos os serviços
pm2 start all

# Ver informações detalhadas
pm2 show atendeai-frontend
pm2 show atendeai-backend
```

### **Logs Importantes**

```bash
# Logs do frontend
tail -f logs/frontend-combined.log

# Logs do backend
tail -f logs/backend-combined.log

# Logs do worker AI
tail -f logs/ai-worker-combined.log

# Logs de erro
tail -f logs/*-error.log
```

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### **1. Nginx (Recomendado)**

```bash
# Instalar Nginx
sudo apt install nginx

# Configurar proxy reverso
sudo nano /etc/nginx/sites-available/atendeai
```

**Configuração Nginx:**
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/atendeai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **2. SSL/HTTPS (Let's Encrypt)**

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **3. Firewall**

```bash
# Configurar UFW
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 🚨 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **1. Serviços não iniciam**
```bash
# Verificar logs
pm2 logs

# Verificar variáveis de ambiente
echo $NODE_ENV
echo $PORT

# Reiniciar PM2
pm2 delete all
pm2 start ecosystem.config.js
```

#### **2. Erro de conexão com banco**
```bash
# Verificar credenciais Supabase
# Testar conexão manual
curl -X POST "https://seu-projeto.supabase.co/rest/v1/" \
  -H "apikey: sua_chave_anonima" \
  -H "Authorization: Bearer sua_chave_anonima"
```

#### **3. APIs AI não funcionam**
```bash
# Verificar chaves de API
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
echo $GOOGLE_API_KEY

# Testar APIs individualmente
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### **4. Erro de memória**
```bash
# Aumentar limite de memória
export NODE_OPTIONS="--max-old-space-size=4096"

# Reiniciar serviços
pm2 restart all
```

---

## 📈 **OTIMIZAÇÕES**

### **1. Performance**
```bash
# Otimizar Node.js
export NODE_OPTIONS="--max-old-space-size=4096 --optimize-for-size"

# Configurar cache
npm install -g pm2-cache
pm2 install pm2-cache
```

### **2. Segurança**
```bash
# Atualizar dependências regularmente
npm audit fix

# Configurar rate limiting
# (já implementado no código)

# Monitorar logs de segurança
tail -f logs/*-error.log | grep -i "error\|fail\|denied"
```

### **3. Backup**
```bash
# Backup do banco (Supabase)
# Usar funcionalidade de backup do Supabase

# Backup dos arquivos
tar -czf backup-$(date +%Y%m%d).tar.gz /var/www/atendeai

# Backup das configurações
cp .env backup-env-$(date +%Y%m%d)
```

---

## 🎯 **PRÓXIMOS PASSOS**

### **1. Testes em Produção**
- [ ] Testar todas as funcionalidades AI
- [ ] Verificar performance
- [ ] Testar com múltiplos usuários
- [ ] Validar logs e monitoramento

### **2. Configurações Adicionais**
- [ ] Configurar domínio personalizado
- [ ] Implementar CDN
- [ ] Configurar backup automático
- [ ] Implementar alertas de monitoramento

### **3. Manutenção**
- [ ] Agendar atualizações regulares
- [ ] Monitorar uso de recursos
- [ ] Revisar logs periodicamente
- [ ] Atualizar dependências

---

## 📞 **SUPORTE**

### **Comandos de Diagnóstico**
```bash
# Status geral do sistema
pm2 status && df -h && free -h

# Logs de erro recentes
pm2 logs --lines 50 | grep -i error

# Teste de conectividade
curl -f http://localhost:3000 && echo "Frontend OK"
curl -f http://localhost:3001/health && echo "Backend OK"
```

### **Contatos**
- **Desenvolvedor**: [Seu Nome]
- **Email**: [seu-email@exemplo.com]
- **Documentação**: [Link para docs]

---

## ✅ **CHECKLIST FINAL**

- [ ] Ambiente preparado
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados configurado
- [ ] APIs externas configuradas
- [ ] Frontend funcionando
- [ ] Backend funcionando
- [ ] APIs AI funcionando
- [ ] SSL configurado (opcional)
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] Documentação atualizada

**🎉 SISTEMA AI PRONTO PARA PRODUÇÃO!** 