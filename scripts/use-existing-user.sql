-- Script para usar usuário existente no auth.users
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se há usuários no auth.users
SELECT 
  'VERIFICANDO USUÁRIOS NO AUTH' as status,
  COUNT(*) as total_users
FROM auth.users;

-- 2. Mostrar todos os usuários disponíveis
SELECT 
  'USUÁRIOS DISPONÍVEIS' as status,
  u.id,
  u.email,
  u.email_confirmed_at,
  u.created_at
FROM auth.users u
ORDER BY u.created_at DESC;

-- 3. Usar o primeiro usuário disponível para criar o perfil admin
DO $$
DECLARE
  first_user_id UUID;
  first_user_email TEXT;
BEGIN
  -- Pegar o primeiro usuário disponível
  SELECT id, email INTO first_user_id, first_user_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF first_user_id IS NULL THEN
    RAISE NOTICE '❌ NENHUM USUÁRIO ENCONTRADO NO AUTH.USERS';
    RAISE NOTICE 'Por favor, crie um usuário manualmente no Supabase Dashboard:';
    RAISE NOTICE '1. Vá para Authentication > Users';
    RAISE NOTICE '2. Clique em "Add User"';
    RAISE NOTICE '3. Email: lucasdmc@lify.com';
    RAISE NOTICE '4. Password: password123';
    RAISE NOTICE '5. Marque "Email Confirmed"';
    RAISE NOTICE '6. Execute este script novamente';
  ELSE
    RAISE NOTICE '✅ USANDO USUÁRIO: % (Email: %)', first_user_id, first_user_email;
    
    -- Adicionar constraint única no user_id (se não existir)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'user_profiles' 
      AND constraint_name = 'user_profiles_user_id_key'
    ) THEN
      ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
      RAISE NOTICE 'Constraint única adicionada em user_id';
    END IF;
    
    -- Criar tabela role_permissions se não existir
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
    
    -- Limpar dados existentes para evitar conflitos
    DELETE FROM user_profiles WHERE user_id = first_user_id;
    DELETE FROM role_permissions WHERE role = 'admin_lify';
    
    -- Inserir perfil admin usando o usuário existente
    INSERT INTO user_profiles (user_id, email, name, role, status, created_at, updated_at)
    VALUES (
      first_user_id,
      'lucasdmc@lify.com',
      'Lucas Admin Lify',
      'admin_lify',
      true,
      now(),
      now()
    );
    
    RAISE NOTICE '✅ PERFIL ADMIN CRIADO PARA USUÁRIO: %', first_user_id;
    
    -- Criar permissões para admin_lify
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
    
    RAISE NOTICE '✅ PERMISSÕES CRIADAS PARA ADMIN_LIFY';
  END IF;
END $$;

-- 4. Verificar resultado final
SELECT 
  'RESULTADO FINAL - USER_PROFILES' as status,
  COUNT(*) as total_profiles,
  STRING_AGG(role, ', ' ORDER BY role) as roles
FROM user_profiles;

-- 5. Verificar permissões criadas
SELECT 
  'RESULTADO FINAL - PERMISSÕES' as status,
  role,
  COUNT(*) as total_modules
FROM role_permissions
GROUP BY role
ORDER BY role;

-- 6. Verificar usuários criados
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

-- 7. Mostrar credenciais de login
SELECT 
  'CREDENCIAIS DE LOGIN' as status,
  u.email as login_email,
  'password123' as password,
  up.role as user_role
FROM user_profiles up
JOIN auth.users u ON up.user_id = u.id
WHERE up.role = 'admin_lify'
LIMIT 1; 