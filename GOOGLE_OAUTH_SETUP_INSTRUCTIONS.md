# 🔧 Instruções: Configuração Google Cloud Console para OAuth

## 📋 **AÇÕES NECESSÁRIAS PARA CORRIGIR O PROBLEMA**

### **🎯 Problema Atual**
O OAuth está redirecionando para `localhost:8080` em produção ao invés de `https://atendeai.lify.com.br/agendamentos`.

### **✅ Passos para Resolver**

## **1. Acessar Google Cloud Console**

1. Vá para [console.cloud.google.com](https://console.cloud.google.com)
2. Selecione o projeto: `atendeai-lify` (ou o projeto correto)
3. Navegue para: **APIs & Services** > **Credentials**

## **2. Localizar OAuth 2.0 Client ID**

1. Procure pelo Client ID: `367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com`
2. Clique no ícone de **editar** (lápis) ao lado do Client ID

## **3. Configurar URLs de Redirecionamento**

### **CRITICAL: Adicionar estas URLs na seção "Authorized redirect URIs":**

```
https://atendeai.lify.com.br/agendamentos
http://localhost:8080/agendamentos
```

### **📝 Explicação:**
- `https://atendeai.lify.com.br/agendamentos` - Para produção (OBRIGATÓRIO)
- `http://localhost:8080/agendamentos` - Para desenvolvimento local

### **⚠️ URLs que devem estar presentes:**
- ✅ `https://atendeai.lify.com.br/agendamentos`
- ✅ `http://localhost:8080/agendamentos`
- ❓ Outras URLs de staging/preview se existirem

## **4. Verificar Client Secret**

1. Anote o **Client Secret** (será necessário para o Supabase)
2. Se não houver Client Secret, gere um novo

## **5. Configurar Supabase Edge Function**

### **No Supabase Dashboard:**

1. Vá para **Edge Functions** no Supabase
2. Deploy da função `google-user-auth` se ainda não estiver ativa
3. Configure a variável de ambiente:
   - **Nome:** `GOOGLE_CLIENT_SECRET`
   - **Valor:** [O Client Secret do Google Cloud Console]

### **Comando para deploy (se necessário):**
```bash
supabase functions deploy google-user-auth
```

## **6. Teste de Validação**

### **Teste 1: Verificar URLs**
1. Acesse: https://atendeai.lify.com.br/agendamentos
2. Tente autenticar com Google Calendar
3. Verifique se NÃO é redirecionado para localhost

### **Teste 2: Verificar Edge Function**
1. Abra o Developer Tools do browser
2. Vá para Network tab
3. Durante a autenticação, procure por chamadas para:
   - `functions/v1/google-user-auth`
4. Verifique se retorna status 200

### **Teste 3: Verificar Tokens**
1. Após autenticação bem-sucedida
2. Verifique se calendários são listados
3. Tente criar um evento de teste

## **🚨 Checklist de Verificação**

### **Google Cloud Console:**
- [ ] URL `https://atendeai.lify.com.br/agendamentos` adicionada
- [ ] Client ID correto: `367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com`
- [ ] Client Secret anotado/configurado

### **Supabase:**
- [ ] Edge Function `google-user-auth` existe
- [ ] Variável `GOOGLE_CLIENT_SECRET` configurada
- [ ] Edge Function retorna status 200 em testes

### **Frontend:**
- [ ] ✅ Código já atualizado para detectar ambiente automaticamente
- [ ] ✅ URLs dinâmicas configuradas
- [ ] ✅ Logs de debug ativados para desenvolvimento

## **🔍 Como Verificar se Funcionou**

### **✅ Sucesso:**
- OAuth redireciona para `https://atendeai.lify.com.br/agendamentos?code=...`
- Não há erro `ERR_CONNECTION_REFUSED`
- Tokens são trocados com sucesso
- Calendários aparecem na interface

### **❌ Ainda com problema:**
- Ainda redireciona para `localhost:8080`
- Erro `redirect_uri_mismatch`
- Edge Function retorna erro 500

## **📞 Próximos Passos**

Após completar estas configurações, execute:

1. **Teste em produção:** https://atendeai.lify.com.br/agendamentos
2. **Reporte o resultado:** Se funcionou ou se ainda há erros
3. **Compartilhe logs:** Se houver erros, compartilhe os logs do browser

---

**⚡ Esta configuração deve resolver completamente o problema de OAuth em produção!**
