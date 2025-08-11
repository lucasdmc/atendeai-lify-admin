# 🔐 Checklist de Configuração - Google Calendar Integration

## 📋 Pré-requisitos
- [ ] Conta Google Cloud Platform ativa
- [ ] Projeto criado no Google Cloud Console
- [ ] Google Calendar API habilitada
- [ ] Railway CLI instalado (`npm install -g @railway/cli`)
- [ ] Acesso ao projeto Railway

## 🚀 Passo 1: Configurar Google Cloud Console

### 1.1 Acessar Google Cloud Console
- [ ] Ir para [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Selecionar projeto: `atendeai-lify`

### 1.2 Habilitar APIs
- [ ] Google Calendar API
- [ ] Google+ API (se necessário)

### 1.3 Configurar OAuth 2.0
- [ ] Ir para "APIs & Services" > "Credentials"
- [ ] Criar ou editar OAuth 2.0 Client ID
- [ ] Tipo: Web application
- [ ] Nome: `AtendeAí Lify Admin`

### 1.4 URLs de Redirecionamento Autorizadas
**Adicionar TODAS estas URLs:**
- [ ] `http://localhost:8080/agendamentos` (desenvolvimento)
- [ ] `https://atendeai-lify-admin-production.up.railway.app/agendamentos` (produção)
- [ ] `https://atendeai.com.br/agendamentos` (domínio personalizado, se aplicável)

### 1.5 Obter Credenciais
- [ ] Copiar Client ID: `367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com`
- [ ] Copiar Client Secret (GOCSPX-...)

## 🏠 Passo 2: Configuração Local

### 2.1 Atualizar Arquivo de Configuração
- [ ] Editar `config/google-oauth2.json`
- [ ] Substituir `GOCSPX-your_actual_client_secret_here` pelo Client Secret real
- [ ] Verificar se as URLs de redirecionamento estão corretas

### 2.2 Testar Localmente
- [ ] Executar `npm run dev`
- [ ] Acessar `http://localhost:8080/agendamentos`
- [ ] Clicar em "Conectar Google Calendar"
- [ ] Verificar se o fluxo OAuth funciona
- [ ] Testar criação de eventos

## 🚂 Passo 3: Configuração Railway (Produção)

### 3.1 Login no Railway
```bash
railway login
```

### 3.2 Configurar Variáveis de Ambiente
```bash
./configure-railway-env.sh
```

**Ou manualmente:**
- [ ] `railway variables set VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com`
- [ ] `railway variables set VITE_GOOGLE_REDIRECT_URI=https://atendeai-lify-admin-production.up.railway.app/agendamentos`
- [ ] `railway variables set VITE_BACKEND_URL=https://atendeai-lify-backend-production.up.railway.app`

### 3.3 Deploy da Aplicação
```bash
railway up
```

### 3.4 Verificar Deploy
- [ ] Acessar URL de produção
- [ ] Verificar se não há erros de console
- [ ] Testar fluxo OAuth em produção

## 🧪 Passo 4: Testes de Validação

### 4.1 Teste Local
- [ ] ✅ Servidor roda em `localhost:8080`
- [ ] ✅ Página de agendamentos carrega
- [ ] ✅ Botão "Conectar Google Calendar" funciona
- [ ] ✅ Fluxo OAuth completa com sucesso
- [ ] ✅ Eventos são criados no Google Calendar

### 4.2 Teste Produção
- [ ] ✅ Aplicação roda no Railway
- [ ] ✅ Página de agendamentos carrega
- [ ] ✅ Botão "Conectar Google Calendar" funciona
- [ ] ✅ Fluxo OAuth completa com sucesso
- [ ] ✅ Eventos são criados no Google Calendar

## 🚨 Solução de Problemas Comuns

### Erro: "redirect_uri_mismatch"
- [ ] Verificar se todas as URLs estão configuradas no Google Cloud Console
- [ ] Verificar se não há espaços extras nas URLs
- [ ] Aguardar alguns minutos após alterações (cache do Google)

### Erro: "invalid_client"
- [ ] Verificar se Client ID e Client Secret estão corretos
- [ ] Verificar se as credenciais estão no projeto correto

### Erro: "ERR_CONNECTION_REFUSED"
- [ ] Verificar se o servidor está rodando
- [ ] Verificar se a porta está correta
- [ ] Verificar firewall/antivírus

### Erro: "Token exchange failed"
- [ ] Verificar se o Client Secret está correto
- [ ] Verificar se as URLs de redirecionamento estão configuradas
- [ ] Verificar se não há problemas de CORS

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do console do navegador
2. Verificar logs do servidor
3. Verificar configurações do Google Cloud Console
4. Verificar variáveis de ambiente no Railway

## 🔗 Links Úteis

- [Google Cloud Console](https://console.cloud.google.com)
- [Google Calendar API Docs](https://developers.google.com/calendar)
- [Railway Dashboard](https://railway.app)
- [Railway CLI Docs](https://docs.railway.app/reference/cli)
