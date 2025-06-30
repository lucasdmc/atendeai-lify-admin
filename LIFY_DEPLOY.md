# 🚀 Deploy no Lify - AtendeAI Admin

## 📋 Pré-requisitos

✅ Build de produção funcionando localmente  
✅ Variáveis de ambiente configuradas  
✅ URLs de redirecionamento configuradas no Google Cloud Console  

## 🔧 Configurações Necessárias

### 1. Google Cloud Console

Acesse [Google Cloud Console](https://console.cloud.google.com) e adicione as seguintes URLs de redirecionamento:

```
https://atendeai.lify.com.br/agendamentos
https://www.atendeai.lify.com.br/agendamentos
```

### 2. Variáveis de Ambiente

As variáveis já estão configuradas no `lovable.json`:

```json
{
  "VITE_SUPABASE_URL": "https://niakqdolcdwxtrkbqmdi.supabase.co",
  "VITE_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "VITE_GOOGLE_CLIENT_ID": "367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com",
  "VITE_WHATSAPP_SERVER_URL": "https://lify-chatbot-production.up.railway.app",
  "NODE_ENV": "production"
}
```

## 🚀 Processo de Deploy

### Opção 1: Deploy Automatizado (Recomendado)

```bash
# Executar script de deploy
./scripts/deploy.sh
```

### Opção 2: Deploy Manual

```bash
# 1. Limpar builds anteriores
rm -rf dist

# 2. Instalar dependências
npm install

# 3. Verificar TypeScript
npm run type-check

# 4. Build de produção
npm run build:prod

# 5. Verificar build
ls -la dist/
```

## 📁 Estrutura do Build

Após o build, você terá:

```
dist/
├── index.html              # Página principal
├── assets/
│   ├── index-*.css         # Estilos
│   ├── vendor-*.js         # Dependências principais
│   ├── ui-*.js            # Componentes UI
│   ├── supabase-*.js      # Cliente Supabase
│   ├── charts-*.js        # Gráficos
│   └── index-*.js         # Código principal
└── _redirects              # Configuração de rotas
```

## 🌐 Configuração do Servidor

### Para Nginx:

```nginx
server {
    listen 80;
    server_name atendeai.lify.com.br www.atendeai.lify.com.br;

    root /var/www/atendeai/dist;
    index index.html;

    # Configuração para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Headers de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### Para Apache (.htaccess):

```apache
RewriteEngine On
RewriteBase /

# Se o arquivo/diretório não existe, redireciona para index.html
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache para assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>
```

## 🔍 Testes Pós-Deploy

### 1. Teste de Funcionalidades Básicas

- [ ] ✅ Aplicação carrega sem erros
- [ ] ✅ Login funciona
- [ ] ✅ Navegação entre páginas funciona
- [ ] ✅ Autenticação Google funciona
- [ ] ✅ Agendamentos funcionam

### 2. Teste de Integrações

- [ ] ✅ Supabase conecta
- [ ] ✅ Google Calendar integra
- [ ] ✅ WhatsApp conecta
- [ ] ✅ Upload de arquivos funciona

### 3. Teste de Performance

- [ ] ✅ Página carrega em < 3 segundos
- [ ] ✅ Assets são carregados corretamente
- [ ] ✅ Cache está funcionando

## 🐛 Troubleshooting

### Problema: Página não carrega
**Solução:** Verificar se o servidor está configurado para SPA (todas as rotas vão para index.html)

### Problema: Autenticação Google não funciona
**Solução:** Verificar URLs de redirecionamento no Google Cloud Console

### Problema: Supabase não conecta
**Solução:** Verificar variáveis de ambiente e CORS no Supabase

### Problema: Assets não carregam
**Solução:** Verificar configuração de cache e headers do servidor

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique o console do navegador
3. Teste localmente primeiro
4. Consulte a documentação do Supabase e Google Cloud

## 🔗 Links Úteis

- **Google Cloud Console:** https://console.cloud.google.com
- **Supabase Dashboard:** https://app.supabase.com
- **Lify Dashboard:** https://lify.com.br
- **Documentação Vite:** https://vitejs.dev/guide/deploy.html 