-- Script corrigido para limpar e configurar admin_lify
-- Execute este script no Supabase SQL Editor

-- 1. Limpar todos os usuários exceto lucasdmc@lify.com
DELETE FROM user_profiles 
WHERE id IN (SELECT id FROM auth.users WHERE email != 'lucasdmc@lify.com');

-- 2. Garantir que lucasdmc@lify.com tem role admin_lify
UPDATE user_profiles 
SET role = 'admin_lify' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'lucasdmc@lify.com');

-- 3. Se o usuário não existir em user_profiles, criar
INSERT INTO user_profiles (id, name, role, status, created_at, updated_at)
SELECT 
    (SELECT id FROM auth.users WHERE email = 'lucasdmc@lify.com'),
    'Lucas Admin',
    'admin_lify',
    'active',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = (SELECT id FROM auth.users WHERE email = 'lucasdmc@lify.com')
);

-- 4. Limpar permissões antigas da tabela role_permissions para admin_lify
DELETE FROM role_permissions WHERE role = 'admin_lify';

-- 5. Inserir todas as permissões para admin_lify (sem can_create, can_update, can_delete)
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

-- 6. Verificar resultado
SELECT 'Usuários restantes:' as info;
SELECT up.id, au.email, up.name, up.role, up.status 
FROM user_profiles up 
JOIN auth.users au ON up.id = au.id;

SELECT 'Permissões admin_lify:' as info;
SELECT role, module_name, can_access FROM role_permissions WHERE role = 'admin_lify'; 