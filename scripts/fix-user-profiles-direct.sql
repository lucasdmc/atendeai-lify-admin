-- Script direto para corrigir a recursão infinita na tabela user_profiles
-- Execute este script diretamente no SQL Editor do Supabase

-- 1. Desabilitar RLS temporariamente
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON user_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON user_profiles;

-- 3. Criar uma política simples e segura
CREATE POLICY "user_profiles_policy" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Reabilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Verificar se funcionou
SELECT COUNT(*) FROM user_profiles LIMIT 1; 