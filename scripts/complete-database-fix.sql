-- Script completo para corrigir estrutura do banco de dados
-- Execute este script no SQL Editor do Supabase

-- 1. Corrigir estrutura da tabela user_profiles
DO $$ 
BEGIN
  -- Adicionar coluna name se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN name TEXT;
  END IF;

  -- Adicionar coluna status se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'status'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN status BOOLEAN DEFAULT true;
  END IF;

  -- Adicionar coluna user_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'user_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE(user_id);
  END IF;

  -- Adicionar coluna email se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'email'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
  END IF;
END $$;

-- 2. Criar tabela role_permissions se não existir
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  module_name TEXT NOT NULL,
  can_access BOOLEAN DEFAULT true,
  can_create BOOLEAN DEFAULT false,
  can_read BOOLEAN DEFAULT true,
  can_update BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role, module_name)
);

-- 3. Criar índices para role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON public.role_permissions(module_name);

-- 4. Habilitar RLS nas tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Corrigir políticas RLS para user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Adicionar política para admin_lify poder inserir/atualizar qualquer perfil
DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;
CREATE POLICY "Admin Lify can manage all profiles" ON public.user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin_lify'
    )
  );

-- 7. Políticas para role_permissions
DROP POLICY IF EXISTS "Users can view role permissions" ON public.role_permissions;
CREATE POLICY "Users can view role permissions" ON public.role_permissions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin Lify can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admin Lify can manage role permissions" ON public.role_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin_lify'
    )
  );

-- 8. Inserir perfil admin_lify
INSERT INTO public.user_profiles (user_id, email, name, role, status)
VALUES (
  'a6a63be9-6c87-49bf-80dd-0767afe84f6f',
  'lucasdmc@lify.com',
  'Lucas Admin',
  'admin_lify',
  true
)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status,
  updated_at = now();

-- 9. Inserir permissões para todos os perfis
INSERT INTO public.role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
-- Atendente
('atendente', 'conectar_whatsapp', true, true, true, true, false),
('atendente', 'agendamentos', true, true, true, true, true),
('atendente', 'conversas', true, true, true, true, true),
('atendente', 'dashboard', true, false, true, false, false),

-- Gestor
('gestor', 'conectar_whatsapp', true, true, true, true, false),
('gestor', 'agendamentos', true, true, true, true, true),
('gestor', 'conversas', true, true, true, true, true),
('gestor', 'dashboard', true, false, true, false, false),
('gestor', 'agentes', true, true, true, true, true),
('gestor', 'contextualizar', true, true, true, true, true),

-- Admin
('admin', 'conectar_whatsapp', true, true, true, true, false),
('admin', 'agendamentos', true, true, true, true, true),
('admin', 'conversas', true, true, true, true, true),
('admin', 'dashboard', true, false, true, false, false),
('admin', 'agentes', true, true, true, true, true),
('admin', 'contextualizar', true, true, true, true, true),
('admin', 'gestao_usuarios', true, true, true, true, true),
('admin', 'configuracoes', true, true, true, true, true),

-- Suporte Lify
('suporte_lify', 'conectar_whatsapp', true, true, true, true, false),
('suporte_lify', 'agendamentos', true, true, true, true, true),
('suporte_lify', 'conversas', true, true, true, true, true),
('suporte_lify', 'dashboard', true, false, true, false, false),
('suporte_lify', 'agentes', true, true, true, true, true),
('suporte_lify', 'contextualizar', true, true, true, true, true),
('suporte_lify', 'gestao_usuarios', true, true, true, true, true),
('suporte_lify', 'configuracoes', true, true, true, true, true),

-- Admin Lify
('admin_lify', 'conectar_whatsapp', true, true, true, true, false),
('admin_lify', 'agendamentos', true, true, true, true, true),
('admin_lify', 'conversas', true, true, true, true, true),
('admin_lify', 'dashboard', true, false, true, false, false),
('admin_lify', 'agentes', true, true, true, true, true),
('admin_lify', 'contextualizar', true, true, true, true, true),
('admin_lify', 'gestao_usuarios', true, true, true, true, true),
('admin_lify', 'clinicas', true, true, true, true, true),
('admin_lify', 'configuracoes', true, true, true, true, true)
ON CONFLICT (role, module_name) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_create = EXCLUDED.can_create,
  can_read = EXCLUDED.can_read,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  updated_at = now();

-- 10. Verificar resultado
SELECT 
  'ESTRUTURA CORRIGIDA' as status,
  (SELECT COUNT(*) FROM public.user_profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.role_permissions) as total_permissions,
  (SELECT role FROM public.user_profiles WHERE user_id = 'a6a63be9-6c87-49bf-80dd-0767afe84f6f') as admin_role; 