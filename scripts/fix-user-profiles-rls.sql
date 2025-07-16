-- Script para corrigir a recursão infinita na política RLS da tabela user_profiles
-- Problema: Política RLS causando recursão infinita

-- 1. Desabilitar RLS temporariamente
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover políticas existentes que podem estar causando recursão
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;

-- 3. Criar políticas simples e seguras
CREATE POLICY "Enable read access for authenticated users" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON user_profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON user_profiles
    FOR DELETE USING (auth.uid()::text = user_id);

-- 4. Reabilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se a tabela está acessível
-- SELECT COUNT(*) FROM user_profiles LIMIT 1; 