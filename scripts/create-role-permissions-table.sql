-- Script para criar a tabela role_permissions se ela não existir
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se a tabela role_permissions existe
SELECT 
  'VERIFICANDO TABELA ROLE_PERMISSIONS' as status,
  COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_name = 'role_permissions' 
AND table_schema = 'public';

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

-- 3. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module ON public.role_permissions(module_name);

-- 4. Habilitar RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. Criar política RLS simples
DROP POLICY IF EXISTS "role_permissions_simple_policy" ON public.role_permissions;
CREATE POLICY "role_permissions_simple_policy" ON public.role_permissions
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Verificar estrutura criada
SELECT 
  'ESTRUTURA CRIADA' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'role_permissions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar se funcionou
SELECT 
  'VERIFICAÇÃO FINAL' as status,
  COUNT(*) as total_permissions
FROM public.role_permissions; 