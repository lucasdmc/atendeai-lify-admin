-- Script para DESABILITAR PERMANENTEMENTE o RLS da tabela user_profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Desabilitar RLS COMPLETAMENTE
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes (força bruta)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.user_profiles', policy_record.policyname);
    END LOOP;
END $$;

-- 3. Verificar se não há mais políticas
SELECT 'Políticas restantes:' as status, COUNT(*) as total 
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 4. Verificar se RLS está desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 5. Teste final
SELECT 'TESTE FINAL' as status, COUNT(*) as total FROM public.user_profiles; 