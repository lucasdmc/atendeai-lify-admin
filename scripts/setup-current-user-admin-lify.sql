-- Script para configurar o usuário atual como admin_lify
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar usuário atual
SELECT 
  u.id,
  u.email,
  up.role,
  up.created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasdmc@lify.com';

-- 2. Garantir que o perfil existe e está configurado como admin_lify
INSERT INTO user_profiles (user_id, email, role)
SELECT 
  u.id,
  u.email,
  'admin_lify' as role
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  role = 'admin_lify',
  updated_at = now();

-- 3. Confirmar email do usuário (se necessário)
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmed_at = now()
WHERE email = 'lucasdmc@lify.com';

-- 4. Verificar se as permissões do admin_lify estão configuradas
SELECT 
  role,
  COUNT(*) as total_permissions,
  STRING_AGG(module_name, ', ' ORDER BY module_name) as modules
FROM role_permissions 
WHERE role = 'admin_lify'
GROUP BY role;

-- 5. Verificar resultado final
SELECT 
  'CONFIGURAÇÃO FINAL' as status,
  u.email,
  up.role,
  up.created_at,
  (SELECT COUNT(*) FROM role_permissions WHERE role = 'admin_lify') as total_permissions
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasdmc@lify.com'; 