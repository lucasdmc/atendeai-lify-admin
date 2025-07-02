# 🔧 Correção Manual da Autenticação

## 🚨 Problema Atual
Após o reset do banco de dados, a autenticação não está funcionando porque:
1. A tabela `user_profiles` não existe
2. O email do usuário não foi confirmado
3. Não há perfil criado para o usuário

## ✅ Solução Manual

### Passo 1: Acessar o Supabase Dashboard
1. Vá para https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi
2. Acesse o **SQL Editor**

### Passo 2: Executar o Script SQL
Copie e cole o seguinte SQL no editor:

```sql
-- 1. Criar tabela user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);

-- 3. Habilitar Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Confirmar email do usuário admin
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'admin@teste.com';

-- 6. Criar perfil para o usuário admin
INSERT INTO public.user_profiles (user_id, email, role)
SELECT 
  id as user_id,
  email,
  'admin_lify' as role
FROM auth.users 
WHERE email = 'admin@teste.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = now();

-- 7. Verificar se tudo foi criado corretamente
SELECT 
  'user_profiles table created' as status,
  (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
  (SELECT email FROM auth.users WHERE email = 'admin@teste.com') as admin_email,
  (SELECT email_confirmed_at FROM auth.users WHERE email = 'admin@teste.com') as email_confirmed,
  (SELECT role FROM public.user_profiles WHERE email = 'admin@teste.com') as admin_role;
```

### Passo 3: Executar o Script
1. Clique em **"Run"** para executar o SQL
2. Verifique se não há erros
3. Confirme que o resultado mostra:
   - `profiles_count: 1`
   - `admin_email: admin@teste.com`
   - `email_confirmed: [timestamp]`
   - `admin_role: admin_lify`

### Passo 4: Testar o Login
1. Vá para http://localhost:8080
2. Faça login com:
   - **Email**: `admin@teste.com`
   - **Senha**: `123456789`
3. Verifique se o login funciona
4. Teste a navegação para `/agendamentos`

## 🔍 Verificação

Após executar o script, você pode verificar se tudo está funcionando:

```sql
-- Verificar usuários
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'admin@teste.com';

-- Verificar perfis
SELECT * FROM public.user_profiles WHERE email = 'admin@teste.com';
```

## 🎯 Resultado Esperado

Após seguir estes passos:
- ✅ Login funcionando
- ✅ Usuário com role `admin_lify`
- ✅ Navegação para `/agendamentos` sem erros
- ✅ Loop infinito corrigido
- ✅ Funcionalidade de desconexão funcionando

## 📞 Suporte

Se ainda houver problemas:
1. Verifique os logs do navegador
2. Confirme que o SQL foi executado sem erros
3. Tente fazer logout e login novamente
4. Limpe o cache do navegador se necessário 