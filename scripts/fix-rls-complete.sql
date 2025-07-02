-- Script completo para corrigir políticas RLS e garantir acesso
-- Execute este script no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente em todas as tabelas
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admin Lify can manage role permissions" ON public.role_permissions;

-- 3. Verificar dados atuais
SELECT 
  'DADOS ATUAIS' as status,
  (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.role_permissions) as total_permissions;

-- 4. Garantir que o perfil admin_lify existe
INSERT INTO public.user_profiles (user_id, email, name, role, status)
SELECT 
  u.id,
  u.email,
  'Lucas Admin Lify',
  'admin_lify',
  true
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = 'Lucas Admin Lify',
  role = 'admin_lify',
  status = true,
  updated_at = now();

-- 5. Garantir que as permissões existem
INSERT INTO public.role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete)
SELECT 'admin_lify', module_name, true, true, true, true, true
FROM (
  VALUES 
    ('conectar_whatsapp'),
    ('agendamentos'),
    ('conversas'),
    ('dashboard'),
    ('agentes'),
    ('contextualizar'),
    ('gestao_usuarios'),
    ('clinicas'),
    ('configuracoes')
) AS modules(module_name)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = true,
  can_create = true,
  can_read = true,
  can_update = true,
  can_delete = true,
  updated_at = now();

-- 6. Habilitar RLS novamente
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas SIMPLES e FUNCIONAIS
-- Política para user_profiles - permitir acesso total temporariamente
CREATE POLICY "Allow all access to user_profiles" ON public.user_profiles
  FOR ALL USING (true);

-- Política para role_permissions - permitir acesso total temporariamente  
CREATE POLICY "Allow all access to role_permissions" ON public.role_permissions
  FOR ALL USING (true);

-- 8. Verificar se as políticas foram criadas
SELECT 
  'POLÍTICAS CRIADAS' as status,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'role_permissions');

-- 9. Testar acesso direto
SELECT 
  'TESTE DE ACESSO' as status,
  (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.role_permissions) as total_permissions,
  (SELECT role FROM public.user_profiles WHERE user_id = u.id) as user_role
FROM auth.users u
WHERE u.email = 'lucasdmc@lify.com';

-- 10. Verificar perfil específico
SELECT 
  'PERFIL DO USUÁRIO' as status,
  up.*
FROM public.user_profiles up
JOIN auth.users u ON up.user_id = u.id
WHERE u.email = 'lucasdmc@lify.com';

-- 11. Verificar permissões do admin_lify
SELECT 
  'PERMISSÕES ADMIN_LIFY' as status,
  role,
  module_name,
  can_access,
  can_create,
  can_read,
  can_update,
  can_delete
FROM public.role_permissions 
WHERE role = 'admin_lify'
ORDER BY module_name; 