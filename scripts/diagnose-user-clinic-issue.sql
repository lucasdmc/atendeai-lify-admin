-- Script de diagnóstico para verificar problemas de associação usuário-clínica
-- Execute este script no SQL Editor do Supabase ANTES de executar a correção

-- 1. Verificar usuários em auth.users
SELECT '=== USUÁRIOS EM AUTH.USERS ===' as info;
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2. Verificar usuários em user_profiles
SELECT '=== USUÁRIOS EM USER_PROFILES ===' as info;
SELECT 
  user_id,
  email,
  role,
  clinic_id,
  created_at
FROM public.user_profiles 
ORDER BY created_at DESC;

-- 3. Verificar usuários órfãos (estão em user_profiles mas não em auth.users)
SELECT '=== USUÁRIOS ÓRFÃOS ===' as info;
SELECT 
  up.user_id,
  up.email,
  up.role,
  up.created_at
FROM public.user_profiles up
WHERE up.user_id NOT IN (SELECT id FROM auth.users);

-- 4. Verificar clínicas existentes
SELECT '=== CLÍNICAS EXISTENTES ===' as info;
SELECT 
  id,
  name,
  email,
  created_at
FROM public.clinics 
ORDER BY created_at;

-- 5. Verificar se a tabela clinic_users existe
SELECT '=== VERIFICAR TABELA CLINIC_USERS ===' as info;
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clinic_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Verificar se a coluna clinic_id existe em user_profiles
SELECT '=== VERIFICAR COLUNA CLINIC_ID EM USER_PROFILES ===' as info;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'clinic_id'
AND table_schema = 'public';

-- 7. Contagem de registros
SELECT '=== CONTAGEM DE REGISTROS ===' as info;
SELECT 
  'auth.users' as tabela,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'user_profiles' as tabela,
  COUNT(*) as total
FROM public.user_profiles
UNION ALL
SELECT 
  'clinics' as tabela,
  COUNT(*) as total
FROM public.clinics
UNION ALL
SELECT 
  'clinic_users' as tabela,
  COUNT(*) as total
FROM public.clinic_users;

-- 8. Verificar usuário específico que causou erro
SELECT '=== VERIFICAR USUÁRIO PROBLEMÁTICO ===' as info;
SELECT 
  'auth.users' as origem,
  id,
  email,
  created_at
FROM auth.users 
WHERE id = '277e9b2d-323e-4032-85c1-f79a1e6d62c6'
UNION ALL
SELECT 
  'user_profiles' as origem,
  user_id as id,
  email,
  created_at
FROM public.user_profiles 
WHERE user_id = '277e9b2d-323e-4032-85c1-f79a1e6d62c6'; 