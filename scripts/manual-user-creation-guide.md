# Guia para Criar Usuários Manualmente no Supabase

## Problema Identificado
O erro `23503: insert or update on table "user_profiles" violates foreign key constraint` indica que não há usuários na tabela `auth.users`.

## Solução Manual

### Passo 1: Criar Usuário no Supabase Dashboard

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Selecione seu projeto

2. **Ir para Authentication > Users**
   - No menu lateral, clique em "Authentication"
   - Clique em "Users"

3. **Adicionar Novo Usuário**
   - Clique no botão "Add User"
   - Preencha os campos:
     - **Email**: `lucasdmc@lify.com`
     - **Password**: `password123`
     - **Email Confirmed**: ✅ (marcar como confirmado)
   - Clique em "Save"

### Passo 2: Executar Script de Restauração

Após criar o usuário, execute este script:

```sql
-- Execute no Supabase Dashboard > SQL Editor
-- scripts/simple-restore-users.sql
```

### Passo 3: Verificar Resultado

Execute este script para verificar se tudo foi criado corretamente:

```sql
-- Verificar usuários criados
SELECT 
  'USUÁRIOS CRIADOS' as status,
  up.email,
  up.name,
  up.role,
  up.status,
  u.email as auth_email,
  u.email_confirmed_at
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
ORDER BY up.role;
```

## Credenciais de Login

Após criar o usuário e executar o script:
- **Email**: `lucasdmc@lify.com`
- **Password**: `password123`

## Teste do Sistema

1. Acesse `http://localhost:8080`
2. Faça login com as credenciais acima
3. Verifique se todas as funcionalidades estão disponíveis

## Status do Frontend

✅ **Frontend funcionando** em `http://localhost:8080`
✅ **Scripts SQL prontos** para restaurar usuários
✅ **Sistema pronto** para uso 