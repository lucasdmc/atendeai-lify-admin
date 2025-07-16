-- Script FINAL para corrigir a tabela user_profiles e resolver erro 500
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Verificar se a tabela existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_profiles' 
    AND table_schema = 'public'
  ) THEN
    -- Criar tabela se não existir
    CREATE TABLE public.user_profiles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      role TEXT NOT NULL DEFAULT 'atendente',
      status BOOLEAN DEFAULT true,
      clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
      timezone TEXT DEFAULT 'America/Sao_Paulo',
      language TEXT DEFAULT 'pt-BR',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      UNIQUE(user_id)
    );
    
    -- Criar índices
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
    CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
  END IF;
END $$;

-- 2. Desabilitar RLS temporariamente para evitar recursão
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 3. Remover TODAS as políticas existentes que podem estar causando recursão
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

-- 4. Criar políticas simples e seguras
CREATE POLICY "user_profiles_read_policy" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "user_profiles_insert_policy" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "user_profiles_update_policy" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Criar perfil para usuários existentes que não têm
INSERT INTO public.user_profiles (user_id, email, name, role, status)
SELECT 
  u.id as user_id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)) as name,
  CASE 
    WHEN u.email = 'lucasdmc@lify.com' THEN 'admin_lify'
    WHEN u.email = 'paulo@lify.com' THEN 'admin_lify'
    WHEN u.email = 'atende1@lify.com' THEN 'atendente'
    ELSE 'atendente'  -- Mudança: usar 'atendente' ao invés de 'user'
  END as role,
  true as status
FROM auth.users u
WHERE u.email_confirmed_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles up WHERE up.user_id = u.id
  )
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- 7. Associar clínica ao usuário atendente
UPDATE public.user_profiles 
SET clinic_id = (
  SELECT id FROM public.clinics 
  WHERE name = 'ESADI' 
  LIMIT 1
)
WHERE email = 'atende1@lify.com';

-- 8. Verificar se tudo funcionou
SELECT 
  'Verificação da tabela user_profiles' as teste,
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN role = 'admin_lify' THEN 1 END) as admin_lify,
  COUNT(CASE WHEN role = 'atendente' THEN 1 END) as atendente,
  COUNT(CASE WHEN role = 'gestor' THEN 1 END) as gestor,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin,
  COUNT(CASE WHEN role = 'suporte_lify' THEN 1 END) as suporte_lify
FROM public.user_profiles;

-- 9. Verificar políticas criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 10. Teste final - tentar ler a tabela
SELECT COUNT(*) as total_profiles FROM public.user_profiles LIMIT 1; 