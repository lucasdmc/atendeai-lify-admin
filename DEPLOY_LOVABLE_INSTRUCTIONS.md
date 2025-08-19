# 🚀 Deploy no Lovable - Instruções

## ✅ Status Atual
- **Build funcionando**: ✅ Pasta `dist/` criada com sucesso
- **Configuração Lovable**: ✅ `lovable.json` configurado
- **Variáveis de ambiente**: ✅ Configuradas
- **Domínio**: `atendeai.lify.com.br` (configurado mas não deployado)

## 🔧 Como Fazer o Deploy Funcionar

### **Passo 1: Acessar o Lovable**
1. Vá para [https://lovable.dev](https://lovable.dev)
2. Faça login com sua conta GitHub

### **Passo 2: Conectar o Repositório**
1. Clique em "New Project"
2. Selecione "Import from GitHub"
3. Escolha o repositório: `atendeai-lify-admin`
4. Autorize o acesso

### **Passo 3: Configurar o Projeto**
1. **Nome do projeto**: `atendeai-lify-admin`
2. **Framework**: React/Vite
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Node Version**: 18

### **Passo 4: Configurar Variáveis de Ambiente**
```env
VITE_GOOGLE_CLIENT_ID=367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com
VITE_SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw
VITE_WHATSAPP_SERVER_URL=https://atendeai-lify-backend-production.up.railway.app
VITE_BACKEND_URL=https://atendeai-lify-backend-production.up.railway.app
NODE_ENV=production
```

### **Passo 5: Configurar Domínio**
1. **Domínio personalizado**: `atendeai.lify.com.br`
2. **SSL**: Automático (Lovable gerencia)
3. **DNS**: Configurar CNAME para o domínio do Lovable

### **Passo 6: Fazer o Deploy**
1. Clique em "Deploy"
2. Aguarde o build e deploy
3. Verifique se o site está funcionando

## 🚨 Problemas Comuns e Soluções

### **Problema: Build falha**
- **Solução**: Verificar se `npm run build` funciona localmente
- **Status**: ✅ Resolvido - build funcionando

### **Problema: Domínio não resolve**
- **Solução**: Verificar configuração DNS e domínio no Lovable
- **Status**: ⚠️ Pendente - precisa configurar domínio

### **Problema: Variáveis de ambiente não carregam**
- **Solução**: Verificar se estão configuradas no Lovable
- **Status**: ✅ Configuradas no `lovable.json`

## 📋 Checklist de Deploy
- [ ] Repositório conectado ao Lovable
- [ ] Build command configurado: `npm run build`
- [ ] Output directory: `dist`
- [ ] Variáveis de ambiente configuradas
- [ ] Domínio `atendeai.lify.com.br` configurado
- [ ] Deploy executado com sucesso
- [ ] Site funcionando em produção

## 🔍 Verificação Pós-Deploy
1. **URL principal**: https://atendeai.lify.com.br
2. **Página de agendamentos**: https://atendeai.lify.com.br/agendamentos
3. **OAuth Google**: Funcionando com redirect correto
4. **Supabase**: Conexão funcionando
5. **Backend**: Conectando com Railway

## 📞 Suporte
- **Lovable**: [https://lovable.dev](https://lovable.dev)
- **Documentação**: [https://docs.lovable.dev](https://docs.lovable.dev)
- **Status**: [https://status.lovable.dev](https://status.lovable.dev)

---
**Última atualização**: $(date)
**Status**: Build funcionando, aguardando deploy no Lovable
