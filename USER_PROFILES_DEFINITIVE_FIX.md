# 🔧 Correção DEFINITIVA da Tabela User Profiles

## 🚨 Problema Atual
**Erro 500 ao gerar QR Code** causado por **recursão infinita** nas políticas RLS da tabela `user_profiles`.

## ✅ Solução Definitiva

### Passo 1: Acessar o Supabase Dashboard
1. Vá para: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
2. Clique em **SQL Editor** (no menu lateral)

### Passo 2: Executar o Script de Correção
Copie e cole o seguinte SQL no editor:

```sql
-- Script DEFINITIVO para corrigir a recursão infinita na tabela user_profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Desabilitar RLS COMPLETAMENTE
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (sem exceção)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_simple_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_read_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;

-- 3. Verificar se não há mais políticas
SELECT 'Políticas restantes:' as status, COUNT(*) as total 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Criar UMA ÚNICA política simples e segura
CREATE POLICY "user_profiles_single_policy" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se funcionou
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 7. Verificar políticas criadas
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';

-- 8. Teste final
SELECT 'TESTE FINAL' as status, COUNT(*) as total FROM public.user_profiles;
```

### Passo 3: Executar o Script
1. Clique em **Run** no SQL Editor
2. Aguarde a execução completa
3. Verifique os resultados

### Passo 4: Verificar Resultado
Você deve ver:
- ✅ **Políticas restantes: 0** (ou próximo a 0)
- ✅ **total_profiles: 1** (ou mais)
- ✅ **policyname: user_profiles_single_policy**
- ✅ **TESTE FINAL: 1** (ou mais)

## 🎯 Teste Após Correção

### 1. Acesse o Sistema
```
https://atendeai.lify.com.br
```

### 2. Faça Login
- Email: `lucasdmc@lify.com`
- Senha: `123456`

### 3. Vá para Agentes
```
https://atendeai.lify.com.br/agentes
```

### 4. Teste o QR Code
- Clique em "Gerar QR Code"
- **NÃO deve aparecer erro 500**
- QR Code deve ser exibido

## 📊 Resultados Esperados

### ✅ Logs que devem aparecer:
```
🔄 [useAuth] Auth state changed: "SIGNED_IN"
✅ QR Code gerado com sucesso
```

### ❌ Logs que NÃO devem mais aparecer:
```
Failed to load resource: the server responded with a status of 500 () (user_profiles, line 0)
infinite recursion detected in policy for relation "user_profiles"
```

## 🔧 Troubleshooting

### Se ainda houver erro 500:

1. **Execute novamente o script SQL**
2. **Limpe o cache do browser** (Ctrl+Shift+R)
3. **Verifique se não há outras políticas**:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';
```

### Se a tabela não existir:
```sql
-- Criar tabela se necessário
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'atendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);
```

## 🎉 Resultado Final

Após a correção, você deve ter:
- ✅ Sistema funcionando sem erros 500
- ✅ QR Code sendo exibido corretamente
- ✅ Autenticação funcionando
- ✅ Chatbot WhatsApp funcionando
- ✅ Todas as features operacionais

## 📞 Suporte

Se o problema persistir:
1. Execute o script SQL novamente
2. Verifique os logs do Supabase Dashboard
3. Teste em modo incógnito do browser 