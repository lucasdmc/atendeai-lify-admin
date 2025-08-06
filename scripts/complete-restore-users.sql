-- Script completo para restaurar usuários e permissões
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se os usuários existem no auth.users
SELECT 
  'VERIFICANDO USUÁRIOS NO AUTH' as status,
  u.id,
  u.email,
  u.email_confirmed_at
FROM auth.users u
WHERE u.email IN ('lucasdmc@lify.com', 'suporte@lify.com');

-- 2. Criar tabela role_permissions se não existir
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  module_name TEXT NOT NULL,
  can_access BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT false,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, module_name)
);

-- 3. Criar constraint única no user_profiles se não existir
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

-- 4. Inserir usuário admin_lify (Lucas) - SEM ON CONFLICT primeiro
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
AND NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- 5. Atualizar usuário admin_lify se já existir
UPDATE user_profiles 
SET 
  email = 'lucasdmc@lify.com',
  name = 'Lucas Admin Lify',
  role = 'admin_lify',
  status = true,
  updated_at = now()
WHERE user_id = (
  SELECT u.id FROM auth.users u WHERE u.email = 'lucasdmc@lify.com'
);

-- 6. Inserir usuário suporte_lify (se existir) - SEM ON CONFLICT primeiro
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
AND NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- 7. Atualizar usuário suporte_lify se já existir
UPDATE user_profiles 
SET 
  email = 'suporte@lify.com',
  name = 'Suporte Lify',
  role = 'suporte_lify',
  status = true,
  updated_at = now()
WHERE user_id = (
  SELECT u.id FROM auth.users u WHERE u.email = 'suporte@lify.com'
);

-- 8. Limpar permissões existentes para evitar duplicatas
DELETE FROM role_permissions WHERE role IN ('admin_lify', 'suporte_lify');

-- 9. Criar permissões para admin_lify
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
) AS modules(module_name);

-- 10. Criar permissões para suporte_lify
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
) AS modules(module_name);

-- 11. Verificar resultado final
SELECT 
  'RESULTADO FINAL - USER_PROFILES' as status,
  COUNT(*) as total_profiles,
  STRING_AGG(role, ', ' ORDER BY role) as roles
FROM user_profiles;

-- 12. Verificar permissões criadas
SELECT 
  'RESULTADO FINAL - PERMISSÕES' as status,
  role,
  COUNT(*) as total_modules
FROM role_permissions
GROUP BY role
ORDER BY role;

-- 13. Verificar usuários criados
SELECT 
  'USUÁRIOS CRIADOS' as status,
  up.email,
  up.name,
  up.role,
  up.status
FROM user_profiles up
ORDER BY up.role; 