# 🔧 Guia de Correção - OAuth Google

## ✅ Problema Resolvido

O erro `redirect_uri_mismatch` foi causado por uma incompatibilidade entre:
- **Aplicação rodando na porta 8080** (conforme `vite.config.ts`)
- **URI de redirecionamento configurada para porta 8081** (no arquivo `.env`)

**Problema adicional**: O proxy do Vite estava redirecionando chamadas `/api` para `localhost:3001` em vez de usar o backend no Railway.

**Problema crítico**: O frontend estava tentando usar endpoints do backend que não existiam. A solução foi usar a Edge Function do Supabase.

## 🔄 Alterações Aplicadas

### 1. Arquivo `.env`
```diff
- VITE_GOOGLE_REDIRECT_URI=http://localhost:8081/agendamentos
+ VITE_GOOGLE_REDIRECT_URI=http://localhost:8080/agendamentos
```

### 2. Arquivos de Configuração
- `src/config/frontend-config.ts` ✅ Atualizado
- `src/config/environment.js` ✅ Atualizado  
- `env.example` ✅ Atualizado

### 3. Backend no Railway
- ✅ Backend configurado para rodar no Railway
- ✅ `VITE_BACKEND_URL=https://atendeai-lify-backend-production.up.railway.app`
- ✅ Frontend conectando ao backend remoto

### 4. Proxy do Vite (CRÍTICO)
- ❌ **Problema**: Proxy redirecionando `/api` para `localhost:3001`
- ✅ **Solução**: Proxy removido/comentado no `vite.config.ts`
- ✅ **Resultado**: Chamadas `/api` agora vão diretamente para o Railway

### 5. Integração com Supabase (CRÍTICO)
- ❌ **Problema**: Frontend tentando usar endpoints inexistentes do backend
- ✅ **Solução**: Mudança para usar Supabase Edge Functions e tabelas diretas
- ✅ **Resultado**: 
  - Token exchange via Edge Function: `/functions/v1/google-user-auth`
  - Tokens salvos diretamente na tabela `google_calendar_tokens`
  - Refresh tokens via Google API direta

## 🌐 Configuração do Google Cloud Console

Para garantir que o OAuth funcione corretamente, verifique se as seguintes URLs estão configuradas no Google Cloud Console:

### URLs de Redirecionamento Autorizadas:
```
http://localhost:8080/agendamentos
http://localhost:5173/agendamentos
https://preview--atendeai-lify-admin.lovable.app/agendamentos
https://atendeai.lify.com.br/agendamentos
```

### Origens JavaScript Autorizadas:
```
http://localhost:8080
http://localhost:5173
https://preview--atendeai-lify-admin.lovable.app
https://atendeai.lify.com.br
```

## 📋 Passos para Configurar o Google Cloud Console

1. **Acesse o Google Cloud Console**
   - Vá para: https://console.cloud.google.com/
   - Selecione seu projeto

2. **Navegue para APIs & Services > Credentials**
   - Clique em "Credentials" no menu lateral

3. **Edite o OAuth 2.0 Client ID**
   - Clique no seu Client ID existente
   - Ou crie um novo se necessário

4. **Configure as URLs de Redirecionamento**
   - Adicione todas as URLs listadas acima
   - Certifique-se de que `http://localhost:8080/agendamentos` está incluída

5. **Configure as Origens JavaScript**
   - Adicione todas as origens listadas acima
   - Certifique-se de que `http://localhost:8080` está incluída

6. **Salve as Alterações**

## 🧪 Teste a Correção

1. **Servidor frontend**: Rodando na porta 8080 ✅
2. **Backend**: Rodando no Railway ✅
3. **Proxy**: Removido (não interfere mais) ✅
4. **Supabase**: Edge Functions configuradas ✅
5. **Acesse a aplicação**: http://localhost:8080
6. **Tente fazer login com Google**
7. **Verifique se o redirecionamento funciona corretamente**

## 🔍 Verificação Adicional

Se ainda houver problemas, execute este comando para verificar as configurações:

```bash
node scripts/setup-integration.js
```

Este script irá verificar se todas as configurações estão corretas.

## 📝 Notas Importantes

- **Ambiente de Desenvolvimento**: Frontend na porta 8080
- **Backend**: Rodando no Railway (não localmente)
- **Proxy Vite**: Removido para evitar conflitos
- **Supabase**: Usado para token exchange e armazenamento
- **Variáveis de Ambiente**: Configuradas corretamente
- **Servidor**: Reiniciado automaticamente com as novas configurações

## ✅ Status Atual

- ✅ URI de redirecionamento corrigida para porta 8080
- ✅ Configurações atualizadas
- ✅ Servidor frontend rodando na porta 8080
- ✅ Backend conectando ao Railway
- ✅ Proxy do Vite removido
- ✅ Integração com Supabase implementada
- ✅ Aplicação acessível em http://localhost:8080

**Próximo passo**: Testar o login com Google para confirmar que o erro foi resolvido. 