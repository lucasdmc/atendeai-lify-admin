-- Script corrigido para criar a tabela user_profiles e configurar o usuário lucasdmc@lify.com
-- Execute este script no SQL Editor do Supabase

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

-- 5. Confirmar email do usuário (SEM confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'lucasdmc@lify.com';

-- 6. Criar perfil para o usuário
INSERT INTO public.user_profiles (user_id, email, role)
SELECT 
  id as user_id,
  email,
  'admin_lify' as role
FROM auth.users 
WHERE email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = now();

-- 7. Verificar se tudo foi criado corretamente
SELECT 
  'user_profiles table created' as status,
  (SELECT COUNT(*) FROM public.user_profiles) as profiles_count,
  (SELECT email FROM auth.users WHERE email = 'lucasdmc@lify.com') as admin_email,
  (SELECT email_confirmed_at FROM auth.users WHERE email = 'lucasdmc@lify.com') as email_confirmed,
  (SELECT role FROM public.user_profiles WHERE email = 'lucasdmc@lify.com') as admin_role; 