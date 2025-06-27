-- Script específico para adicionar permissões ao lucasdmc@lify.com
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se o usuário existe
SELECT 'Verificando usuário:' as info;
SELECT id, email FROM auth.users WHERE email = 'lucasdmc@lify.com';

-- 2. Garantir que o usuário tem perfil com role admin_lify
INSERT INTO user_profiles (id, name, role, status, created_at, updated_at)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'lucasdmc@lify.com'),
    'Lucas Admin',
    'admin_lify',
    'active',
    NOW(),
    NOW()
ON CONFLICT (id) DO UPDATE SET
    role = 'admin_lify',
    status = 'active',
    updated_at = NOW();

-- 3. Limpar permissões antigas para admin_lify
DELETE FROM role_permissions WHERE role = 'admin_lify';

-- 4. Inserir TODAS as permissões para admin_lify
INSERT INTO role_permissions (role, module_name, can_access, created_at, updated_at) VALUES
('admin_lify', 'dashboard', true, NOW(), NOW()),
('admin_lify', 'conversas', true, NOW(), NOW()),
('admin_lify', 'conectar_whatsapp', true, NOW(), NOW()),
('admin_lify', 'agentes', true, NOW(), NOW()),
('admin_lify', 'agendamentos', true, NOW(), NOW()),
('admin_lify', 'clinicas', true, NOW(), NOW()),
('admin_lify', 'contextualizar', true, NOW(), NOW()),
('admin_lify', 'gestao_usuarios', true, NOW(), NOW()),
('admin_lify', 'configuracoes', true, NOW(), NOW());

-- 5. Verificar resultado
SELECT 'Perfil do usuário:' as info;
SELECT up.id, au.email, up.name, up.role, up.status 
FROM user_profiles up 
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'lucasdmc@lify.com';

SELECT 'Permissões admin_lify:' as info;
SELECT role, module_name, can_access FROM role_permissions WHERE role = 'admin_lify';

SELECT 'Total de permissões:' as info;
SELECT COUNT(*) as total_permissions FROM role_permissions WHERE role = 'admin_lify'; 