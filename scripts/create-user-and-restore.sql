-- Script para criar usuário e restaurar perfil
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se há usuários no auth.users
SELECT 
  'VERIFICANDO USUÁRIOS NO AUTH' as status,
  COUNT(*) as total_users
FROM auth.users;

-- 2. Se não há usuários, criar um usuário de teste
DO $$
DECLARE
  user_count INTEGER;
  new_user_id UUID;
BEGIN
  -- Verificar quantos usuários existem
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  -- Se não há usuários, criar um
  IF user_count = 0 THEN
    -- Inserir usuário diretamente na tabela auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      invited_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_sent_at,
      reauthentication_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'lucasdmc@lify.com',
      crypt('password123', gen_salt('bf')),
      now(),
      now(),
      '',
      now(),
      '',
      now(),
      '',
      '',
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Lucas Admin Lify"}',
      false,
      now(),
      now(),
      '',
      now(),
      '',
      '',
      now(),
      '',
      0,
      now(),
      now(),
      ''
    ) RETURNING id INTO new_user_id;
    
    RAISE NOTICE 'Usuário criado com ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'Usuários já existem no sistema';
  END IF;
END $$;

-- 3. Mostrar usuários disponíveis
SELECT 
  'USUÁRIOS DISPONÍVEIS' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
ORDER BY u.created_at DESC
LIMIT 5;

-- 4. Adicionar constraint única no user_id (se não existir)
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

-- 5. Criar tabela role_permissions se não existir
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

-- 6. Limpar dados existentes para evitar conflitos
DELETE FROM user_profiles;
DELETE FROM role_permissions WHERE role IN ('admin_lify', 'suporte_lify');

-- 7. Inserir usuário admin usando o primeiro usuário disponível
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

-- 8. Inserir usuário suporte usando o segundo usuário disponível (se houver)
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
  up.status,
  u.email as auth_email,
  u.email_confirmed_at
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
ORDER BY up.role; 