-- Script para corrigir a foreign key constraint
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar a estrutura da foreign key
SELECT 
  'VERIFICANDO FOREIGN KEY' as status,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_profiles';

-- 2. Verificar se a tabela 'users' existe
SELECT 
  'VERIFICANDO TABELA USERS' as status,
  COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'users' 
AND table_schema = 'public';

-- 3. Verificar se a tabela 'auth.users' existe
SELECT 
  'VERIFICANDO AUTH.USERS' as status,
  COUNT(*) as table_exists
FROM information_schema.tables 
WHERE table_name = 'users' 
AND table_schema = 'auth';

-- 4. Remover a foreign key constraint problemática
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;

-- 5. Criar nova foreign key constraint apontando para auth.users
ALTER TABLE user_profiles 
ADD CONSTRAINT user_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. Verificar se a constraint foi criada
SELECT 
  'VERIFICANDO NOVA FOREIGN KEY' as status,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'user_profiles'; 