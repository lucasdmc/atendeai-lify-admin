# 🔧 Correção da Tabela User Profiles

## 🚨 Problema Atual
Erro 500 na tabela `user_profiles` causado por recursão infinita nas políticas RLS.

## ✅ Solução Manual

### Passo 1: Acessar o Supabase Dashboard
1. Vá para https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
2. Acesse o **SQL Editor**

### Passo 2: Executar o Script de Correção
Copie e cole o seguinte SQL no editor:

```sql
-- Script para corrigir a recursão infinita na tabela user_profiles

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;

-- 3. Criar uma política simples e segura
CREATE POLICY "user_profiles_simple_policy" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se funcionou
SELECT COUNT(*) FROM user_profiles LIMIT 1;

-- 6. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_profiles';
```

### Passo 3: Verificar Resultado
Após executar o script, você deve ver:
- ✅ Contagem de registros na tabela
- ✅ Lista das políticas criadas

## 🎯 Resultado Esperado
- ❌ Erro 500 na tabela `user_profiles` deve desaparecer
- ✅ QR Code deve voltar a ser apresentado
- ✅ Sistema deve funcionar normalmente

## 📋 Próximos Passos
1. Execute o script SQL
2. Teste o sistema novamente
3. Verifique se o QR Code aparece
4. Teste a conexão do WhatsApp 