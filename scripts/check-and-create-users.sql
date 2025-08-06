-- Script para verificar e criar usuários no auth.users
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se os usuários existem no auth.users
SELECT 
  'VERIFICANDO USUÁRIOS NO AUTH' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.confirmed_at,
  u.created_at
FROM auth.users u
WHERE u.email IN ('lucasdmc@lify.com', 'suporte@lify.com');

-- 2. Verificar se há algum usuário no auth.users
SELECT 
  'TODOS OS USUÁRIOS NO AUTH' as status,
  COUNT(*) as total_users
FROM auth.users;

-- 3. Mostrar os primeiros 5 usuários para referência
SELECT 
  'PRIMEIROS 5 USUÁRIOS' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- 4. Verificar se há usuários na user_profiles
SELECT 
  'USUÁRIOS NA USER_PROFILES' as status,
  COUNT(*) as total_profiles
FROM user_profiles;

-- 5. Mostrar usuários existentes na user_profiles
SELECT 
  'DETALHES USER_PROFILES' as status,
  up.user_id,
  up.email,
  up.name,
  up.role,
  up.status
FROM user_profiles up
ORDER BY up.created_at DESC; 