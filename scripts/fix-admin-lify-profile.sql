-- Script para corrigir o perfil do usuário como admin_lify
-- Execute este script no SQL Editor do Supabase

-- 1. Primeiro, vamos verificar se o usuário existe
SELECT 
  'VERIFICANDO USUÁRIO' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.confirmed_at
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com';

-- 2. Verificar se a tabela user_profiles existe e sua estrutura
SELECT 
  'ESTRUTURA DA TABELA' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verificar se já existe um perfil para o usuário
SELECT 
  'PERFIL ATUAL' as status,
  up.*
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
WHERE u.email = 'lucasdmc@lify.com';

-- 4. Inserir ou atualizar o perfil como admin_lify (CORRIGIDO - incluindo email)
INSERT INTO user_profiles (user_id, email, name, role, status)
SELECT 
  u.id,
  u.email,
  'Lucas Admin Lify',
  'admin_lify',
  true
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = 'Lucas Admin Lify',
  role = 'admin_lify',
  status = true,
  updated_at = now();

-- 5. Verificar se as permissões do admin_lify existem
SELECT 
  'PERMISSÕES ADMIN_LIFY' as status,
  COUNT(*) as total_permissions,
  STRING_AGG(module_name, ', ' ORDER BY module_name) as modules
FROM role_permissions 
WHERE role = 'admin_lify';

-- 6. Se não existirem permissões, criar
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete)
SELECT 'admin_lify', module_name, true, true, true, true, true
FROM (
  VALUES 
    ('conectar_whatsapp'),
    ('agendamentos'),
    ('conversas'),
    ('dashboard'),
    ('agentes'),
    ('contextualizar'),
    ('gestao_usuarios'),
    ('clinicas'),
    ('configuracoes')
) AS modules(module_name)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = true,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = true,
  updated_at = now();

-- 7. Verificar resultado final
SELECT 
  'RESULTADO FINAL' as status,
  u.email,
  up.role,
  up.name,
  up.status,
  (SELECT COUNT(*) FROM role_permissions WHERE role = 'admin_lify') as total_permissions
FROM auth.users u
JOIN user_profiles up ON u.id = up.user_id
WHERE u.email = 'lucasdmc@lify.com';

-- 8. Testar acesso direto
SELECT 
  'TESTE DE ACESSO' as status,
  (SELECT COUNT(*) FROM user_profiles WHERE user_id = u.id) as profile_exists,
  (SELECT role FROM user_profiles WHERE user_id = u.id) as user_role
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com'; 