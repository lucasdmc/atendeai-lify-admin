-- Desabilitar RLS para a tabela user_profiles
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Remover todas as políticas existentes (se houver)
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Enable all operations for admin_lify" ON user_profiles;
DROP POLICY IF EXISTS "Enable read for all authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for admin_lify" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for admin_lify" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for admin_lify" ON user_profiles;

-- Verificar se RLS está desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- Verificar se não há políticas restantes
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'user_profiles'; 