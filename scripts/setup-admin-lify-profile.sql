-- Script para configurar perfil admin_lify
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.role as current_role
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'lucasdmc@lify.com';

-- 2. Criar ou atualizar perfil como admin_lify
INSERT INTO public.user_profiles (
    user_id,
    email,
    role,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM auth.users WHERE email = 'lucasdmc@lify.com'),
    'lucasdmc@lify.com',
    'admin_lify',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    role = 'admin_lify',
    updated_at = NOW();

-- 3. Verificar resultado
SELECT 
    u.email,
    u.email_confirmed_at,
    p.role,
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'lucasdmc@lify.com';

-- 4. Verificar permissões RLS
-- A role admin_lify deve ter acesso a todas as tabelas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('clinics', 'users', 'conversations', 'messages', 'appointments', 'user_profiles')
ORDER BY tablename, policyname; 