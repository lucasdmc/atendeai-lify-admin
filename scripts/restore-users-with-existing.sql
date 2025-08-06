-- Script para restaurar usuários usando usuários existentes ou criando novos
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se há usuários no auth.users
SELECT 
  'VERIFICANDO USUÁRIOS EXISTENTES' as status,
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
LIMIT 10;

-- 3. Criar usuário admin_lify se não existir
-- Primeiro, vamos usar o primeiro usuário disponível ou criar um novo
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'lucasdmc@lify.com';
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO admin_user_id 
  FROM auth.users 
  WHERE email = admin_email;
  
  -- Se não existir, usar o primeiro usuário disponível
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE 'Usando usuário existente: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Usuário admin já existe: %', admin_user_id;
  END IF;
  
  -- Inserir ou atualizar perfil
  INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
  VALUES (
    admin_user_id,
    admin_email,
    'Lucas Admin Lify',
    'admin_lify',
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = 'Lucas Admin Lify',
    role = 'admin_lify',
    status = true,
    updated_at = now();
    
  RAISE NOTICE 'Perfil admin_lify criado/atualizado para usuário: %', admin_user_id;
END $$;

-- 4. Criar usuário suporte_lify se não existir
DO $$
DECLARE
  suporte_user_id UUID;
  suporte_email TEXT := 'suporte@lify.com';
BEGIN
  -- Verificar se o usuário já existe
  SELECT id INTO suporte_user_id 
  FROM auth.users 
  WHERE email = suporte_email;
  
  -- Se não existir, usar o segundo usuário disponível (se houver)
  IF suporte_user_id IS NULL THEN
    SELECT id INTO suporte_user_id 
    FROM auth.users 
    WHERE id NOT IN (
      SELECT user_id FROM user_profiles WHERE role = 'admin_lify'
    )
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF suporte_user_id IS NOT NULL THEN
      RAISE NOTICE 'Usando usuário existente para suporte: %', suporte_user_id;
    ELSE
      RAISE NOTICE 'Nenhum usuário disponível para suporte';
      RETURN;
    END IF;
  ELSE
    RAISE NOTICE 'Usuário suporte já existe: %', suporte_user_id;
  END IF;
  
  -- Inserir ou atualizar perfil
  INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
  VALUES (
    suporte_user_id,
    suporte_email,
    'Suporte Lify',
    'suporte_lify',
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    name = 'Suporte Lify',
    role = 'suporte_lify',
    status = true,
    updated_at = now();
    
  RAISE NOTICE 'Perfil suporte_lify criado/atualizado para usuário: %', suporte_user_id;
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

-- 6. Limpar permissões existentes para evitar duplicatas
DELETE FROM role_permissions WHERE role IN ('admin_lify', 'suporte_lify');

-- 7. Criar permissões para admin_lify
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

-- 8. Criar permissões para suporte_lify
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

-- 9. Verificar resultado final
SELECT 
  'RESULTADO FINAL - USER_PROFILES' as status,
  COUNT(*) as total_profiles,
  STRING_AGG(role, ', ' ORDER BY role) as roles
FROM user_profiles;

-- 10. Verificar permissões criadas
SELECT 
  'RESULTADO FINAL - PERMISSÕES' as status,
  role,
  COUNT(*) as total_modules
FROM role_permissions
GROUP BY role
ORDER BY role;

-- 11. Verificar usuários criados
SELECT 
  'USUÁRIOS CRIADOS' as status,
  up.email,
  up.name,
  up.role,
  up.status,
  u.email_confirmed_at
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
ORDER BY up.role; 