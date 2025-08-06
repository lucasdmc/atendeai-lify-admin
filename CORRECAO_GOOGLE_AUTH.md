# 🔧 Correção dos Problemas de Autenticação Google

## 📋 Problemas Identificados

1. **Erro de autenticação**: `"error": "invalid_client", "error_description": "Unauthorized"`
2. **Registros duplicados**: 13 registros na tabela `google_calendar_tokens` para o mesmo usuário
3. **Credenciais não configuradas**: Edge Function sem as credenciais Google

## 🛠️ Soluções

### 1. Corrigir Registros Duplicados

Execute o script SQL no Supabase SQL Editor:

```sql
-- Script para corrigir registros duplicados
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar registros duplicados
SELECT 
  user_id,
  COUNT(*) as total_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM google_calendar_tokens
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total_records DESC;

-- 2. Criar tabela temporária com os registros mais recentes
CREATE TEMP TABLE temp_latest_tokens AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  access_token,
  refresh_token,
  expires_at,
  scope,
  created_at,
  updated_at
FROM google_calendar_tokens
ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC;

-- 3. Deletar todos os registros da tabela original
DELETE FROM google_calendar_tokens;

-- 4. Reinserir apenas os registros mais recentes
INSERT INTO google_calendar_tokens (
  id,
  user_id,
  access_token,
  refresh_token,
  expires_at,
  scope,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  access_token,
  refresh_token,
  expires_at,
  scope,
  created_at,
  updated_at
FROM temp_latest_tokens;

-- 5. Adicionar constraint único se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'google_calendar_tokens_user_id_unique'
  ) THEN
    ALTER TABLE google_calendar_tokens 
    ADD CONSTRAINT google_calendar_tokens_user_id_unique 
    UNIQUE (user_id);
  END IF;
END $$;

-- 6. Verificar resultado
SELECT 
  user_id,
  COUNT(*) as total_records
FROM google_calendar_tokens
GROUP BY user_id
ORDER BY total_records DESC;

-- 7. Limpar tabela temporária
DROP TABLE temp_latest_tokens;
```

### 2. Configurar Credenciais Google

#### 2.1. Obter Credenciais do Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Selecione o projeto correto
3. Vá para "APIs & Services" > "Credentials"
4. Encontre ou crie um OAuth 2.0 Client ID
5. Copie o Client ID e Client Secret

#### 2.2. Configurar URLs de Redirecionamento

No Google Cloud Console, adicione estas URLs autorizadas:

```
http://localhost:8080/agendamentos
https://atendeai.lify.com.br/agendamentos
```

#### 2.3. Configurar Secrets na Edge Function

Execute o script de configuração:

```bash
./configure-google-credentials.sh
```

Ou manualmente:

```bash
# Fazer login no Supabase CLI
supabase login

# Configurar secrets
supabase secrets set GOOGLE_CLIENT_ID="seu_client_id_aqui"
supabase secrets set GOOGLE_CLIENT_SECRET="seu_client_secret_aqui"

# Fazer deploy da Edge Function
supabase functions deploy google-user-auth
```

### 3. Verificar Configurações

#### 3.1. Verificar Client ID no Frontend

O Client ID está configurado em `src/config/frontend-config.ts`:

```typescript
google: {
  clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  // ...
}
```

#### 3.2. Verificar URLs de Redirecionamento

As URLs estão configuradas em:

```typescript
urls: {
  redirectUri: 'http://localhost:8080/agendamentos'
}
```

### 4. Testar a Autenticação

1. Acesse: http://localhost:8080/agendamentos
2. Clique em "Conectar Google Calendar"
3. Complete o fluxo de autenticação
4. Verifique se não há erros no console

## 🔍 Diagnóstico

### Verificar Logs da Edge Function

```bash
supabase functions logs google-user-auth
```

### Verificar Secrets Configurados

```bash
supabase secrets list
```

### Testar Edge Function

```bash
curl -X POST "https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth" \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw" \
  -d '{"code": "test", "redirectUri": "http://localhost:8080/agendamentos"}'
```

## 📝 Checklist de Correção

- [ ] Executar script SQL para corrigir registros duplicados
- [ ] Configurar Client ID e Client Secret na Edge Function
- [ ] Verificar URLs no Google Cloud Console
- [ ] Fazer deploy da Edge Function
- [ ] Testar autenticação no localhost
- [ ] Verificar logs para confirmar funcionamento

## 🚨 Problemas Comuns

### "invalid_client" Error
- Verificar se o Client ID está correto
- Verificar se o Client Secret está configurado
- Verificar se as URLs de redirecionamento estão corretas

### Múltiplos Registros
- Executar o script SQL de correção
- Verificar se a constraint único foi aplicada

### Edge Function 500 Error
- Verificar se os secrets estão configurados
- Verificar logs da Edge Function
- Fazer deploy novamente da função 