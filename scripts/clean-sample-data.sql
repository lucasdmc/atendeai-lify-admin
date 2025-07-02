-- Script para limpar dados de exemplo e manter apenas o usuário principal
-- Execute este script no SQL Editor do Supabase

-- 1. Limpar dados de exemplo (manter apenas o usuário principal)
DELETE FROM public.appointments;
DELETE FROM public.messages;
DELETE FROM public.conversations;
DELETE FROM public.users WHERE email != 'lucasdmc@lify.com';
DELETE FROM public.clinics;

-- 2. Verificar dados restantes
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as count
FROM public.user_profiles
UNION ALL
SELECT 
    'clinics' as table_name,
    COUNT(*) as count
FROM public.clinics
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'conversations' as table_name,
    COUNT(*) as count
FROM public.conversations
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as count
FROM public.messages
UNION ALL
SELECT 
    'appointments' as table_name,
    COUNT(*) as count
FROM public.appointments
ORDER BY table_name;

-- 3. Verificar usuário principal
SELECT 
    u.email,
    u.email_confirmed_at,
    p.role
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'lucasdmc@lify.com'; 