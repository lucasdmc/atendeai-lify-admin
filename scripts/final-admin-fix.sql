-- Script final para garantir que lucasdmc@lify.com seja admin_lify
-- Execute este script diretamente no editor SQL do Supabase

-- 1. Verificar se o usuário existe
SELECT up.id, u.email, up.role 
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
WHERE u.email = 'lucasdmc@lify.com';

-- 2. Atualizar o role para admin_lify
UPDATE user_profiles 
SET role = 'admin_lify' 
WHERE id IN (SELECT up.id FROM user_profiles up JOIN auth.users u ON up.id = u.id WHERE u.email = 'lucasdmc@lify.com');

-- 3. Verificar se o role admin_lify existe na tabela role_permissions
SELECT DISTINCT role FROM role_permissions WHERE role = 'admin_lify';

-- 4. Se não existir, inserir todas as permissões para admin_lify
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete)
VALUES 
  ('admin_lify', 'dashboard', true, true, true, true, true),
  ('admin_lify', 'conversas', true, true, true, true, true),
  ('admin_lify', 'conectar_whatsapp', true, true, true, true, true),
  ('admin_lify', 'agentes', true, true, true, true, true),
  ('admin_lify', 'agendamentos', true, true, true, true, true),
  ('admin_lify', 'clinicas', true, true, true, true, true),
  ('admin_lify', 'contextualizar', true, true, true, true, true),
  ('admin_lify', 'gestao_usuarios', true, true, true, true, true),
  ('admin_lify', 'configuracoes', true, true, true, true, true)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_create = EXCLUDED.can_create,
  can_read = EXCLUDED.can_read,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete;

-- 5. Verificar resultado final
SELECT 
  u.email,
  up.role,
  COUNT(rp.module_name) as total_permissions
FROM user_profiles up
JOIN auth.users u ON up.id = u.id
LEFT JOIN role_permissions rp ON up.role = rp.role AND rp.can_access = true
WHERE u.email = 'lucasdmc@lify.com'
GROUP BY u.email, up.role;

-- 6. Listar todas as permissões do admin_lify
SELECT module_name, can_access, can_create, can_read, can_update, can_delete
FROM role_permissions 
WHERE role = 'admin_lify' 
ORDER BY module_name; 