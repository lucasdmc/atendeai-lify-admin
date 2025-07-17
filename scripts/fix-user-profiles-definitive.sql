-- Script DEFINITIVO para corrigir a recursão infinita na tabela user_profiles
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi/sql

-- 1. Desabilitar RLS COMPLETAMENTE
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (sem exceção)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Admin Lify can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_simple_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_read_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_policy" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete_policy" ON public.user_profiles;

-- 3. Verificar se não há mais políticas
SELECT 'Políticas restantes:' as status, COUNT(*) as total 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Criar UMA ÚNICA política simples e segura
CREATE POLICY "user_profiles_single_policy" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 6. Verificar se funcionou
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 7. Verificar políticas criadas
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';

-- 8. Teste final
SELECT 'TESTE FINAL' as status, COUNT(*) as total FROM public.user_profiles; 