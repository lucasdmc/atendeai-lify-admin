# ✅ Checklist de Configuração - AtendeAI

## 🔧 Configuração Inicial

### 1. Ambiente de Desenvolvimento
- [ ] Node.js 18+ instalado
- [ ] npm ou yarn instalado
- [ ] Git configurado
- [ ] Editor configurado (VS Code recomendado)

### 2. Configuração do Projeto
- [ ] Repositório clonado
- [ ] Dependências instaladas (`npm install`)
- [ ] Script de setup executado (`npm run setup`)
- [ ] Arquivo `.env` criado e configurado

### 3. Variáveis de Ambiente (.env)
- [ ] `VITE_GOOGLE_CLIENT_ID` configurado
- [ ] `VITE_GOOGLE_CLIENT_SECRET` configurado
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_ANON_KEY` configurado
- [ ] `VITE_WHATSAPP_SERVER_URL` configurado

## 🌐 Configuração Externa

### 4. Google Cloud Platform
- [ ] Projeto criado no Google Cloud Console
- [ ] API do Google Calendar ativada
- [ ] Credenciais OAuth 2.0 criadas
- [ ] URLs de redirecionamento configuradas:
  - [ ] `http://localhost:8080/agendamentos` (desenvolvimento)
  - [ ] `https://seu-dominio.com/agendamentos` (produção)
- [ ] Escopo `https://www.googleapis.com/auth/calendar` adicionado

### 5. Supabase
- [ ] Projeto criado no Supabase
- [ ] Migrações executadas:
  - [ ] `20250618170051-864453c0-1ead-4eb7-80f7-619670e3cd6f.sql`
  - [ ] `20250618170052-create-admin-user.sql`
  - [ ] `20250618174236-86953654-7d42-4b4f-a008-f712d3ecc79c.sql`
  - [ ] `20250619133939-74caa83a-02f7-4439-8c36-9dca838eb376.sql`
  - [ ] `20250619150208-4445bce7-d95e-4f3a-b26f-dd02cc6f864c.sql`
  - [ ] `20250623132400-add-agendamentos-permission.sql`
  - [ ] `20250623132620-aa927c94-9ed5-440c-b4cb-5f3d8a0acb31.sql`
  - [ ] `20250623134016-25aac8e4-39f4-4dcc-a5f7-620f3b756e3b.sql`
  - [ ] `20250624_add_appointment_system.sql`
  - [ ] `20250625142640-56d56778-fd42-4f86-9c80-7f447852184f.sql`
  - [ ] `20250626220212-f4ad81f9-cc9d-4db0-a82f-25689cf20958.sql`
  - [ ] `20250626221900-65c6197b-617e-438d-bde1-0b38986491dc.sql`
  - [ ] `20250626222123-0ddd9fe9-6599-4952-a2af-b334039b0b79.sql`
  - [ ] `20250626222501-update-handle-new-user-function.sql`
  - [ ] `20250626222909-f73eac01-61da-42dc-8f1b-154829e70760.sql`
  - [ ] `20250626223000-update-handle-new-user-clinicas.sql`
  - [ ] `20250626223553-3c324a16-5b3c-4047-b21d-3fc1c5e63b2a.sql`
  - [ ] `20250626230040-8bbcf4ea-6636-4bc0-97de-edf8dc19bc5a.sql`
  - [ ] `20250626230458-ae54ecb3-4116-4fc5-ba8d-ad4a37d48fef.sql`
- [ ] Políticas RLS configuradas
- [ ] Edge Functions deployadas:
  - [ ] `ai-chat-response`
  - [ ] `appointment-manager`
  - [ ] `contextualize-chat`
  - [ ] `google-service-auth`
  - [ ] `update-dashboard-metrics`
  - [ ] `whatsapp-integration`
- [ ] Usuário admin criado
- [ ] Permissões configuradas

### 6. WhatsApp Integration
- [ ] Servidor WhatsApp configurado
- [ ] URL do servidor configurada no `.env`
- [ ] Webhook configurado
- [ ] QR Code funcionando

## 🧪 Testes e Validação

### 7. Testes de Funcionalidade
- [ ] Aplicação inicia sem erros (`npm run dev`)
- [ ] Login funciona corretamente
- [ ] Dashboard carrega
- [ ] Navegação entre páginas funciona
- [ ] Integração Google Calendar testada
- [ ] WhatsApp conecta e envia mensagens
- [ ] Agendamentos funcionam
- [ ] Sistema de permissões funciona

### 8. Testes de Segurança
- [ ] `npm run security-check` sem vulnerabilidades críticas
- [ ] Credenciais não estão expostas no código
- [ ] Variáveis de ambiente configuradas corretamente
- [ ] Políticas RLS funcionando

### 9. Testes de Performance
- [ ] Build de produção bem-sucedido (`npm run build:prod`)
- [ ] Aplicação carrega rapidamente
- [ ] Sem memory leaks detectados
- [ ] Logs não poluem o console em produção

## 🚀 Deploy

### 10. Preparação para Produção
- [ ] Variáveis de ambiente de produção configuradas
- [ ] URLs de redirecionamento de produção adicionadas
- [ ] Build de produção testado
- [ ] Domínio configurado (se aplicável)
- [ ] SSL configurado (se aplicável)

### 11. Monitoramento
- [ ] Logs configurados
- [ ] Métricas de performance configuradas
- [ ] Alertas configurados
- [ ] Backup configurado

## 📋 Comandos Úteis

```bash
# Setup inicial
npm run setup

# Desenvolvimento
npm run dev

# Build
npm run build:prod

# Verificações
npm run type-check
npm run lint
npm run security-check
npm run format:check

# Correções
npm run lint:fix
npm run security-fix
npm run format

# Limpeza
npm run clean
npm run clean:all
```

## 🆘 Solução de Problemas

### Problemas Comuns

1. **Erro de build TypeScript**
   - Execute `npm run type-check` para ver erros
   - Execute `npm run lint:fix` para correções automáticas

2. **Vulnerabilidades de segurança**
   - Execute `npm run security-check`
   - Execute `npm run security-fix` para correções automáticas

3. **Problemas de autenticação Google**
   - Verifique URLs de redirecionamento no Google Cloud Console
   - Verifique se as credenciais estão corretas no `.env`

4. **Problemas de conexão Supabase**
   - Verifique URL e chave anônima no `.env`
   - Verifique se as migrações foram executadas

5. **Problemas de WhatsApp**
   - Verifique se o servidor WhatsApp está rodando
   - Verifique a URL no `.env`
   - Verifique se o webhook está configurado

## 📞 Suporte

Se encontrar problemas:
1. Consulte este checklist
2. Verifique os logs da aplicação
3. Consulte a documentação no README.md
4. Abra uma issue no GitHub
5. Entre em contato com o suporte 