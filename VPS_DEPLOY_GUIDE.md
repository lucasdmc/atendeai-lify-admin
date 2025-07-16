# 🚀 Guia de Deploy para VPS AtendeAI

## 📋 Informações da VPS

- **IP**: 31.97.241.19
- **Hostname**: atendeai.server.com.br
- **Usuário**: root
- **Sistema**: Ubuntu 22.04 LTS
- **RAM**: 8GB
- **CPU**: 2 vCPUs
- **Storage**: 100GB SSD

## 🔧 Scripts Disponíveis

### 1. Configuração Rápida da VPS
```bash
./scripts/setup-vps-quick.sh
```
**O que faz:**
- Instala dependências básicas (curl, git, ufw)
- Instala Node.js 18.x e PM2
- Instala Nginx
- Configura firewall (SSH, HTTP, HTTPS, porta 3001)
- Clona o repositório do servidor WhatsApp
- Configura PM2 para gerenciar o processo

### 2. Deploy Completo
```bash
./scripts/deploy-production-vps.sh
```
**O que faz:**
- Tudo do script rápido +
- Backup do servidor atual
- Atualização do código
- Configuração do Nginx com proxy reverso
- Configuração de SSL com Certbot
- Deploy do frontend
- Testes de conectividade

## 🚀 Como Usar

### Passo 1: Configurar SSH Key
```bash
# Gerar SSH key (se não tiver)
ssh-keygen -t rsa -b 4096 -C "seu-email@exemplo.com"

# Copiar para VPS
ssh-copy-id root@31.97.241.19
```

### Passo 2: Configuração Inicial (Primeira vez)
```bash
# Executar configuração rápida
./scripts/setup-vps-quick.sh
```

### Passo 3: Deploy Completo
```bash
# Executar deploy completo
./scripts/deploy-production-vps.sh
```

## 📊 Monitoramento

### Verificar Status
```bash
# Status do servidor WhatsApp
ssh root@31.97.241.19 'pm2 status'

# Logs do servidor
ssh root@31.97.241.19 'pm2 logs'

# Status do Nginx
ssh root@31.97.241.19 'systemctl status nginx'

# Status do firewall
ssh root@31.97.241.19 'ufw status'
```

### Testes de Conectividade
```bash
# Testar servidor WhatsApp
curl http://31.97.241.19:3001/health

# Testar Nginx
curl http://31.97.241.19

# Testar HTTPS (após configurar SSL)
curl https://atendeai.server.com.br/health
```

## 🔧 Configurações Manuais

### 1. Configurar SSL
```bash
# Instalar Certbot
ssh root@31.97.241.19 'apt-get install -y certbot python3-certbot-nginx'

# Solicitar certificado
ssh root@31.97.241.19 'certbot --nginx -d atendeai.server.com.br -d www.atendeai.server.com.br --non-interactive --agree-tos --email admin@lify.com.br'
```

### 2. Configurar Nginx (se necessário)
```bash
# Acessar VPS
ssh root@31.97.241.19

# Editar configuração
nano /etc/nginx/sites-available/atendeai.server.com.br

# Testar configuração
nginx -t

# Recarregar
systemctl reload nginx
```

### 3. Configurar Variáveis de Ambiente
```bash
# Acessar VPS
ssh root@31.97.241.19

# Editar arquivo de ambiente
nano /opt/whatsapp-server/.env

# Reiniciar servidor
pm2 restart whatsapp-server
```

## 🐛 Troubleshooting

### Problema: SSH não conecta
```bash
# Verificar se a chave está configurada
ssh -v root@31.97.241.19

# Reconfigurar chave
ssh-copy-id root@31.97.241.19
```

### Problema: Servidor não inicia
```bash
# Verificar logs
ssh root@31.97.241.19 'pm2 logs'

# Verificar se Node.js está instalado
ssh root@31.97.241.19 'node --version'

# Reinstalar dependências
ssh root@31.97.241.19 'cd /opt/whatsapp-server && npm install'
```

### Problema: Nginx não funciona
```bash
# Verificar status
ssh root@31.97.241.19 'systemctl status nginx'

# Verificar configuração
ssh root@31.97.241.19 'nginx -t'

# Reiniciar
ssh root@31.97.241.19 'systemctl restart nginx'
```

### Problema: Firewall bloqueando
```bash
# Verificar regras
ssh root@31.97.241.19 'ufw status'

# Liberar porta específica
ssh root@31.97.241.19 'ufw allow 3001'
```

## 📋 Checklist de Deploy

### ✅ Pré-requisitos
- [ ] SSH key configurada
- [ ] Acesso root à VPS
- [ ] Domínio atendeai.server.com.br apontando para 31.97.241.19
- [ ] Repositório do servidor WhatsApp atualizado

### ✅ Configuração
- [ ] Dependências instaladas
- [ ] Node.js e PM2 funcionando
- [ ] Nginx configurado
- [ ] Firewall configurado
- [ ] Servidor WhatsApp rodando

### ✅ SSL e Domínio
- [ ] Certificado SSL instalado
- [ ] Nginx configurado para HTTPS
- [ ] Redirecionamento HTTP → HTTPS
- [ ] Proxy reverso configurado

### ✅ Testes
- [ ] Servidor responde em http://31.97.241.19:3001/health
- [ ] Nginx responde em https://atendeai.server.com.br
- [ ] Frontend carrega corretamente
- [ ] WhatsApp conecta e gera QR Code
- [ ] Todas as funcionalidades testadas

## 🔄 Atualizações

### Atualizar Servidor WhatsApp
```bash
# Acessar VPS
ssh root@31.97.241.19

# Parar servidor
pm2 stop whatsapp-server

# Atualizar código
cd /opt/whatsapp-server
git pull origin main
npm install

# Reiniciar
pm2 restart whatsapp-server
```

### Atualizar Frontend
```bash
# Fazer build localmente
npm run build

# Enviar para VPS
scp -r dist/* root@31.97.241.19:/var/www/atendeai/

# Configurar permissões
ssh root@31.97.241.19 'chown -R www-data:www-data /var/www/atendeai'
```

## 📞 Suporte

### Logs Importantes
```bash
# Logs do servidor WhatsApp
ssh root@31.97.241.19 'pm2 logs'

# Logs do Nginx
ssh root@31.97.241.19 'tail -f /var/log/nginx/access.log'

# Logs de erro do Nginx
ssh root@31.97.241.19 'tail -f /var/log/nginx/error.log'
```

### URLs de Teste
- **Health Check**: https://atendeai.server.com.br/health
- **API**: https://atendeai.server.com.br/api
- **Frontend**: https://atendeai.server.com.br
- **WhatsApp Status**: https://atendeai.server.com.br/api/whatsapp/status

### Comandos Úteis
```bash
# Reiniciar tudo
ssh root@31.97.241.19 'pm2 restart all && systemctl restart nginx'

# Ver uso de recursos
ssh root@31.97.241.19 'htop'

# Ver espaço em disco
ssh root@31.97.241.19 'df -h'

# Ver uso de RAM
ssh root@31.97.241.19 'free -h'
```

---

**🎉 Sistema configurado e pronto para uso!** 