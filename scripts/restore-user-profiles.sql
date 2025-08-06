-- Script para restaurar os usuários principais e suas permissões
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela user_profiles existe
SELECT 
  'VERIFICANDO TABELA' as status,
  COUNT(*) as total_profiles
FROM user_profiles;

-- 2. Verificar se existe constraint única no user_id
SELECT 
  'VERIFICANDO CONSTRAINT' as status,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'user_profiles' 
AND constraint_type = 'UNIQUE';

-- 3. Criar constraint única no user_id se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' 
    AND constraint_name = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Constraint única criada em user_id';
  ELSE
    RAISE NOTICE 'Constraint única já existe em user_id';
  END IF;
END $$;

-- 4. Verificar se a tabela role_permissions existe
SELECT 
  'VERIFICANDO ROLE_PERMISSIONS' as status,
  COUNT(*) as total_permissions
FROM role_permissions;

-- 5. Criar constraint única em role_permissions se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'role_permissions' 
    AND constraint_name = 'role_permissions_role_module_key'
  ) THEN
    ALTER TABLE role_permissions ADD CONSTRAINT role_permissions_role_module_key UNIQUE (role, module_name);
    RAISE NOTICE 'Constraint única criada em role_permissions';
  ELSE
    RAISE NOTICE 'Constraint única já existe em role_permissions';
  END IF;
END $$;

-- 6. Inserir usuário admin_lify (Lucas)
INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'Lucas Admin Lify',
  'admin_lify',
  true,
  now(),
  now()
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = 'Lucas Admin Lify',
  role = 'admin_lify',
  status = true,
  updated_at = now();

-- 7. Inserir usuário suporte_lify (se existir)
INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  'Suporte Lify',
  'suporte_lify',
  true,
  now(),
  now()
FROM auth.users u
WHERE u.email = 'suporte@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = 'Suporte Lify',
  role = 'suporte_lify',
  status = true,
  updated_at = now();

-- 8. Criar permissões para admin_lify
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete, created_at, updated_at)
SELECT 'admin_lify', module_name, true, true, true, true, true, now(), now()
FROM (
  VALUES 
    ('dashboard'),
    ('conversas'),
    ('agendamentos'),
    ('clinicas'),
    ('contextualizar'),
    ('gestao_usuarios'),
    ('ai_dashboard'),
    ('ai_test'),
    ('whatsapp_ai_test')
) AS modules(module_name)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = true,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = true,
  updated_at = now();

-- 9. Criar permissões para suporte_lify
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete, created_at, updated_at)
SELECT 'suporte_lify', module_name, true, true, true, true, false, now(), now()
FROM (
  VALUES 
    ('dashboard'),
    ('conversas'),
    ('agendamentos'),
    ('clinicas'),
    ('contextualizar'),
    ('ai_dashboard'),
    ('ai_test')
) AS modules(module_name)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = true,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = false,
  updated_at = now();

-- 10. Verificar resultado final
SELECT 
  'RESULTADO FINAL' as status,
  COUNT(*) as total_profiles,
  STRING_AGG(role, ', ' ORDER BY role) as roles
FROM user_profiles;

-- 11. Verificar permissões criadas
SELECT 
  'PERMISSÕES CRIADAS' as status,
  role,
  COUNT(*) as total_modules
FROM role_permissions
GROUP BY role
ORDER BY role; 