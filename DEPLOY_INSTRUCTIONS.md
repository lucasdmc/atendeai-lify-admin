# 🚀 Instruções de Deploy - AtendeAI

## 📋 Pré-requisitos

Antes de fazer o deploy, certifique-se de que:

1. ✅ Todas as configurações do [SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md) foram completadas
2. ✅ Variáveis de ambiente de produção estão configuradas
3. ✅ URLs de redirecionamento de produção foram adicionadas no Google Cloud Console
4. ✅ Build de produção foi testado localmente

## 🔧 Preparação para Deploy

### 1. Configurar Variáveis de Ambiente de Produção

Crie um arquivo `.env.production` com as variáveis de produção:

```env
# Google OAuth Configuration (Produção)
VITE_GOOGLE_CLIENT_ID=your_production_google_client_id
VITE_GOOGLE_CLIENT_SECRET=your_production_google_client_secret

# Supabase Configuration (Produção)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key

# WhatsApp Configuration (Produção)
VITE_WHATSAPP_SERVER_URL=https://your-whatsapp-server.com

# Environment
NODE_ENV=production
```

### 2. Build de Produção

```bash
# Build para produção
npm run build:prod

# Verificar se o build foi bem-sucedido
npm run preview
```

### 3. Configurar URLs de Redirecionamento

No Google Cloud Console, adicione as URLs de redirecionamento de produção:

- `https://seu-dominio.com/agendamentos`
- `https://www.seu-dominio.com/agendamentos` (se aplicável)

## 🌐 Opções de Deploy

### Opção 1: Vercel (Recomendado)

#### 1.1. Preparação
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login no Vercel
vercel login
```

#### 1.2. Deploy
```bash
# Deploy inicial
vercel

# Para produção
vercel --prod
```

#### 1.3. Configuração no Vercel Dashboard
1. Acesse o dashboard do Vercel
2. Vá em Settings > Environment Variables
3. Adicione todas as variáveis do `.env.production`

#### 1.4. Configuração de Domínio
1. Vá em Settings > Domains
2. Adicione seu domínio personalizado
3. Configure os registros DNS conforme instruído

### Opção 2: Netlify

#### 2.1. Preparação
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login no Netlify
netlify login
```

#### 2.2. Deploy
```bash
# Build
npm run build:prod

# Deploy
netlify deploy --prod --dir=dist
```

#### 2.3. Configuração
1. Acesse o dashboard do Netlify
2. Vá em Site settings > Environment variables
3. Adicione as variáveis de produção

### Opção 3: GitHub Pages

#### 3.1. Preparação
```bash
# Adicionar script de deploy no package.json
{
  "scripts": {
    "deploy": "npm run build:prod && gh-pages -d dist"
  }
}

# Instalar gh-pages
npm install --save-dev gh-pages
```

#### 3.2. Deploy
```bash
npm run deploy
```

#### 3.3. Configuração
1. Vá em Settings > Pages no GitHub
2. Configure o source como "Deploy from a branch"
3. Selecione a branch `gh-pages`

### Opção 4: Deploy Manual (VPS/Server)

#### 4.1. Preparação do Servidor
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar nginx
sudo apt-get install nginx

# Instalar PM2 para gerenciar processos
npm install -g pm2
```

#### 4.2. Deploy
```bash
# Clonar repositório
git clone <your-repo-url>
cd atendeai-lify-admin

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env.production
# Editar .env.production com valores de produção

# Build
npm run build:prod

# Configurar nginx
sudo nano /etc/nginx/sites-available/atendeai
```

#### 4.3. Configuração Nginx
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    root /var/www/atendeai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 4.4. Ativar Site
```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/atendeai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configurar SSL com Let's Encrypt
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## 🔒 Configurações de Segurança

### 1. Headers de Segurança
Adicione os seguintes headers no seu servidor web:

```nginx
# Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### 2. HTTPS
- Configure SSL/TLS em todos os domínios
- Use Let's Encrypt para certificados gratuitos
- Configure redirecionamento HTTP → HTTPS

### 3. Variáveis de Ambiente
- Nunca commite arquivos `.env` no repositório
- Use variáveis de ambiente da plataforma de deploy
- Rotacione credenciais regularmente

## 📊 Monitoramento

### 1. Logs
Configure logs para monitorar:
- Erros de aplicação
- Performance
- Acessos
- Tentativas de acesso não autorizado

### 2. Métricas
Monitore:
- Tempo de resposta
- Taxa de erro
- Uso de recursos
- Disponibilidade

### 3. Alertas
Configure alertas para:
- Downtime
- Erros críticos
- Performance degradada
- Tentativas de acesso suspeitas

## 🔄 CI/CD (Opcional)

### GitHub Actions
Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm run type-check && npm run lint
    
    - name: Build
      run: npm run build:prod
      env:
        VITE_GOOGLE_CLIENT_ID: ${{ secrets.VITE_GOOGLE_CLIENT_ID }}
        VITE_GOOGLE_CLIENT_SECRET: ${{ secrets.VITE_GOOGLE_CLIENT_SECRET }}
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
        VITE_WHATSAPP_SERVER_URL: ${{ secrets.VITE_WHATSAPP_SERVER_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🆘 Solução de Problemas

### Problemas Comuns

1. **Erro 404 em rotas**
   - Configure fallback para `index.html`
   - Verifique configuração do servidor web

2. **Problemas de CORS**
   - Configure headers CORS no servidor
   - Verifique URLs permitidas

3. **Variáveis de ambiente não carregadas**
   - Verifique se as variáveis estão configuradas na plataforma
   - Reinicie o deploy após adicionar variáveis

4. **Problemas de performance**
   - Configure cache para assets estáticos
   - Otimize imagens e recursos
   - Use CDN se possível

## 📞 Suporte

Para problemas de deploy:
1. Verifique os logs da plataforma
2. Teste localmente primeiro
3. Consulte a documentação da plataforma
4. Entre em contato com o suporte da plataforma
5. Abra uma issue no GitHub do projeto
