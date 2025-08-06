-- Script para corrigir a estrutura da tabela user_profiles
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Desabilitar RLS temporariamente
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Adicionar colunas que estão faltando
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'atendente';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT true;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Sao_Paulo';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 3. Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);

-- 4. Remover políticas existentes
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

-- 5. Criar política simples
CREATE POLICY "user_profiles_simple_policy" ON public.user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- 6. Reabilitar RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 7. Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- 8. Verificar se funcionou
SELECT COUNT(*) as total_profiles FROM public.user_profiles; 