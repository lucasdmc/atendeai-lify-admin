-- Script para corrigir as políticas RLS da tabela user_profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;

-- 3. Verificar se há dados na tabela
SELECT 
  'DADOS ATUAIS' as status,
  COUNT(*) as total_profiles,
  STRING_AGG(role, ', ') as roles
FROM public.user_profiles;

-- 4. Criar políticas RLS corretas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Política para usuários inserirem seu próprio perfil
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para admin_lify gerenciar todos os perfis
CREATE POLICY "Admin Lify can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.user_id = auth.uid() 
      AND up.role = 'admin_lify'
    )
  );

-- 5. Verificar se as políticas foram criadas
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

-- 6. Testar acesso
SELECT 
  'TESTE DE ACESSO' as status,
  (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
  (SELECT role FROM public.user_profiles LIMIT 1) as sample_role;

-- 7. Verificar estrutura final
SELECT 
  'ESTRUTURA FINAL' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 