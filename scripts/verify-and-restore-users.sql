-- Script para verificar e restaurar usuários
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

-- 3. Verificar se o usuário específico existe
SELECT 
  'VERIFICANDO USUÁRIO ESPECÍFICO' as status,
  u.id,
  u.email,
  u.email_confirmed_at
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com';

-- 4. Se o usuário não existir, mostrar mensagem
DO $$
DECLARE
  user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM auth.users WHERE email = 'lucasdmc@lify.com'
  ) INTO user_exists;
  
  IF NOT user_exists THEN
    RAISE NOTICE '❌ USUÁRIO NÃO ENCONTRADO: lucasdmc@lify.com';
    RAISE NOTICE 'Por favor, crie o usuário manualmente no Supabase Dashboard:';
    RAISE NOTICE '1. Vá para Authentication > Users';
    RAISE NOTICE '2. Clique em "Add User"';
    RAISE NOTICE '3. Email: lucasdmc@lify.com';
    RAISE NOTICE '4. Password: password123';
    RAISE NOTICE '5. Marque "Email Confirmed"';
    RAISE NOTICE '6. Execute este script novamente após criar o usuário';
  ELSE
    RAISE NOTICE '✅ USUÁRIO ENCONTRADO: lucasdmc@lify.com';
  END IF;
END $$;

-- 5. Adicionar constraint única no user_id (se não existir)
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

-- 6. Criar tabela role_permissions se não existir
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

-- 7. Inserir usuário admin APENAS se existir no auth.users
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
WHERE u.email = 'lucasdmc@lify.com'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- 8. Verificar se o insert funcionou
SELECT 
  'VERIFICANDO INSERÇÃO' as status,
  COUNT(*) as profiles_created
FROM user_profiles
WHERE email = 'lucasdmc@lify.com';

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
) AS modules(module_name)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = true,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = true,
  updated_at = now();

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