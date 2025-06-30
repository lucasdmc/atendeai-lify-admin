# 🚀 Deploy no Domínio Principal - atendeai.lify.com.br

## 📋 Status Atual

✅ **Preview Lovable:** Funcionando (https://preview--atendeai-lify-admin.lovable.app)  
❌ **Domínio Principal:** Precisa de deploy (https://atendeai.lify.com.br)  

## 🎯 Problema Identificado

O domínio principal `atendeai.lify.com.br` está configurado separadamente do Lovable e precisa de deploy manual.

## 📁 Arquivos Prontos para Deploy

O build de produção está pronto na pasta `dist/`:

```
dist/
├── index.html (1.31 kB) - Página principal
├── _redirects (4.0K) - Configuração SPA
├── assets/ (1.2M) - Arquivos JavaScript e CSS
├── favicon.ico (8.0K)
├── placeholder.svg (4.0K)
└── robots.txt (4.0K)
```

## 🚀 Opções de Deploy

### Opção 1: Deploy Manual (Recomendado)

1. **Acesse o painel de controle** do servidor onde está hospedado `atendeai.lify.com.br`

2. **Faça backup** dos arquivos atuais

3. **Substitua os arquivos** da pasta `dist/` pelos arquivos atuais

4. **Configure o servidor** para SPA:
   ```nginx
   location / {
       try_files $uri $uri/ /index.html;
   }
   ```

### Opção 2: Deploy via FTP/SFTP

1. **Conecte via FTP** ao servidor
2. **Navegue** até o diretório raiz do site
3. **Faça upload** de todos os arquivos da pasta `dist/`

### Opção 3: Deploy via Git (se configurado)

```bash
# Se o servidor suporta deploy automático via Git
git push origin production
```

## 🔧 Configurações Necessárias

### 1. Google Cloud Console (OBRIGATÓRIO)

Acesse [Google Cloud Console](https://console.cloud.google.com) e adicione:

```
https://atendeai.lify.com.br/agendamentos
https://www.atendeai.lify.com.br/agendamentos
```

### 2. Variáveis de Ambiente

Verifique se o servidor tem as variáveis de ambiente configuradas:

```env
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
VITE_WHATSAPP_SERVER_URL=https://lify-chatbot-production.up.railway.app
NODE_ENV=production
```

### 3. Configuração do Servidor

#### Para Nginx:
```nginx
server {
    listen 80;
    server_name atendeai.lify.com.br www.atendeai.lify.com.br;

    root /var/www/atendeai/dist;
    index index.html;

    # Configuração SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

#### Para Apache (.htaccess):
```apache
RewriteEngine On
RewriteBase /

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

## 🧪 Testes Pós-Deploy

### 1. Testes Básicos
- [ ] ✅ Página carrega sem erros
- [ ] ✅ Login funciona
- [ ] ✅ Navegação entre páginas funciona

### 2. Testes de Integração
- [ ] ✅ Autenticação Google funciona
- [ ] ✅ Módulo de agendamentos carrega
- [ ] ✅ Criação de eventos funciona
- [ ] ✅ Botão "Atualizar eventos" funciona

### 3. Testes de Performance
- [ ] ✅ Página carrega em < 3 segundos
- [ ] ✅ Assets são carregados corretamente

## 🐛 Troubleshooting

### Problema: Página não carrega
**Solução:** Verificar se o servidor está configurado para SPA

### Problema: Autenticação Google não funciona
**Solução:** Verificar URLs de redirecionamento no Google Cloud Console

### Problema: Assets não carregam
**Solução:** Verificar permissões de arquivo e configuração de cache

### Problema: Rotas não funcionam
**Solução:** Verificar configuração de redirecionamento para index.html

## 📞 Suporte

Se encontrar problemas:

1. **Verifique logs do servidor**
2. **Verifique console do navegador**
3. **Compare com o preview** que está funcionando
4. **Teste localmente** primeiro

## 🔗 Links Úteis

- **Preview (funcionando):** https://preview--atendeai-lify-admin.lovable.app
- **Produção:** https://atendeai.lify.com.br
- **Google Cloud Console:** https://console.cloud.google.com
- **Supabase Dashboard:** https://app.supabase.com

---

**🎯 Objetivo:** Fazer o domínio principal funcionar igual ao preview do Lovable 