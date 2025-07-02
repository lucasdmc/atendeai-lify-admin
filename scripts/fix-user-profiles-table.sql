-- Script para corrigir a estrutura da tabela user_profiles
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar estrutura atual da tabela
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Adicionar coluna name se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'name'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN name TEXT;
  END IF;
END $$;

-- 3. Adicionar coluna status se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'status'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN status BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 4. Verificar se a coluna user_id existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'user_id'
    AND table_schema = 'public'
  ) THEN
    -- Se não existir user_id, criar a coluna
    ALTER TABLE public.user_profiles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    -- Criar índice
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
    
    -- Adicionar constraint unique
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_unique UNIQUE(user_id);
  END IF;
END $$;

-- 5. Verificar se a coluna email existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'email'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN email TEXT;
    
    -- Criar índice
    CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
  END IF;
END $$;

-- 6. Verificar estrutura final
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 7. Verificar se há dados na tabela
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 8. Mostrar estrutura esperada vs atual
SELECT 
  'ESTRUTURA ESPERADA' as tipo,
  'id (UUID, PK)' as coluna,
  'user_id (UUID, FK)' as coluna2,
  'email (TEXT)' as coluna3,
  'name (TEXT)' as coluna4,
  'role (TEXT)' as coluna5,
  'status (BOOLEAN)' as coluna6,
  'created_at (TIMESTAMP)' as coluna7,
  'updated_at (TIMESTAMP)' as coluna8
UNION ALL
SELECT 
  'ESTRUTURA ATUAL' as tipo,
  string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as coluna,
  '' as coluna2,
  '' as coluna3,
  '' as coluna4,
  '' as coluna5,
  '' as coluna6,
  '' as coluna7,
  '' as coluna8
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND table_schema = 'public'; 