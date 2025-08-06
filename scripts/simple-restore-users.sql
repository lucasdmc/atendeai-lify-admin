-- Script simples para restaurar usuários
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se há usuários no auth.users
SELECT 
  'VERIFICANDO USUÁRIOS NO AUTH' as status,
  COUNT(*) as total_users
FROM auth.users;

-- 2. Mostrar usuários disponíveis
SELECT 
  'USUÁRIOS DISPONÍVEIS' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- 3. Adicionar constraint única no user_id (se não existir)
DO $$
BEGIN
  -- Verificar se a constraint já existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_profiles' 
    AND constraint_name = 'user_profiles_user_id_key'
  ) THEN
    -- Adicionar constraint única
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Constraint única adicionada em user_id';
  ELSE
    RAISE NOTICE 'Constraint única já existe em user_id';
  END IF;
END $$;

-- 4. Criar tabela role_permissions se não existir
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

-- 5. Limpar dados existentes para evitar conflitos
DELETE FROM user_profiles;
DELETE FROM role_permissions WHERE role IN ('admin_lify', 'suporte_lify');

-- 6. Inserir usuário admin usando o primeiro usuário disponível
INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
SELECT 
  u.id,
  'lucasdmc@lify.com',
  'Lucas Admin Lify',
  'admin_lify',
  true,
  now(),
  now()
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 1;

-- 7. Inserir usuário suporte usando o segundo usuário disponível (se houver)
INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
SELECT 
  u.id,
  'suporte@lify.com',
  'Suporte Lify',
  'suporte_lify',
  true,
  now(),
  now()
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM user_profiles WHERE role = 'admin_lify')
ORDER BY u.created_at DESC
LIMIT 1;

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
) AS modules(module_name);

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
) AS modules(module_name);

-- 10. Verificar resultado final
SELECT 
  'RESULTADO FINAL - USER_PROFILES' as status,
  COUNT(*) as total_profiles,
  STRING_AGG(role, ', ' ORDER BY role) as roles
FROM user_profiles;

-- 11. Verificar permissões criadas
SELECT 
  'RESULTADO FINAL - PERMISSÕES' as status,
  role,
  COUNT(*) as total_modules
FROM role_permissions
GROUP BY role
ORDER BY role;

-- 12. Verificar usuários criados
SELECT 
  'USUÁRIOS CRIADOS' as status,
  up.email,
  up.name,
  up.role,
  up.status,
  u.email as auth_email,
  u.email_confirmed_at
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
ORDER BY up.role; 