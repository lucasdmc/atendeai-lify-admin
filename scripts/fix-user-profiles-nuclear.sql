-- Script NUCLEAR para corrigir definitivamente a tabela user_profiles
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

-- 4. Criar tabela nova se necessário (backup dos dados)
CREATE TABLE IF NOT EXISTS public.user_profiles_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'atendente',
  status BOOLEAN DEFAULT true,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  language TEXT DEFAULT 'pt-BR',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. Copiar dados existentes
INSERT INTO public.user_profiles_new (user_id, email, name, role, status, clinic_id, timezone, language, created_at, updated_at)
SELECT user_id, email, name, role, status, clinic_id, timezone, language, created_at, updated_at
FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

-- 6. Dropar tabela antiga
DROP TABLE IF EXISTS public.user_profiles;

-- 7. Renomear nova tabela
ALTER TABLE public.user_profiles_new RENAME TO user_profiles;

-- 8. Criar índices
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);

-- 9. Criar UMA ÚNICA política simples
CREATE POLICY "user_profiles_simple_policy" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 10. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 11. Verificar se funcionou
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 12. Verificar políticas criadas
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';

-- 13. Teste final
SELECT 'TESTE FINAL' as status, COUNT(*) as total FROM public.user_profiles; 