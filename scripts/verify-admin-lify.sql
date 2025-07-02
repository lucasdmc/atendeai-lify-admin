-- Verificar configuração do perfil admin_lify
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuário e perfil
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.role,
    p.created_at,
    p.updated_at
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.user_id
WHERE u.email = 'lucasdmc@lify.com';

-- 2. Verificar se o perfil existe
SELECT 
    COUNT(*) as profile_count
FROM public.user_profiles 
WHERE email = 'lucasdmc@lify.com' 
AND role = 'admin_lify';

-- 3. Listar todos os perfis para comparação
SELECT 
    email,
    role,
    created_at,
    updated_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- 4. Verificar estrutura da tabela user_profiles
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position; 