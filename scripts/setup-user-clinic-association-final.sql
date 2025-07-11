-- Script final para implementar associação de usuários a clínicas
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela clinic_users se não existir
CREATE TABLE IF NOT EXISTS public.clinic_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_clinic_users_user_id ON public.clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic_id ON public.clinic_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_active ON public.clinic_users(user_id, is_active) WHERE is_active = true;

-- 3. Habilitar Row Level Security
ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas de segurança para clinic_users
DROP POLICY IF EXISTS "Users can view their clinic associations" ON public.clinic_users;
CREATE POLICY "Users can view their clinic associations" ON public.clinic_users
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin_lify', 'suporte_lify')
    )
  );

DROP POLICY IF EXISTS "Admins can manage clinic associations" ON public.clinic_users;
CREATE POLICY "Admins can manage clinic associations" ON public.clinic_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() AND role IN ('admin_lify', 'suporte_lify')
    )
  );

-- 5. Adicionar coluna clinic_id na tabela user_profiles se não existir
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'clinic_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_profiles ADD COLUMN clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_user_profiles_clinic_id ON public.user_profiles(clinic_id);
  END IF;
END $$;

-- 6. Verificar se existe pelo menos uma clínica, se não, criar uma padrão
INSERT INTO public.clinics (id, name, address, phone, email, created_by)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  'Clínica Principal',
  'Endereço da Clínica Principal',
  '(11) 99999-9999',
  'contato@clinicaprincipal.com',
  (SELECT id FROM auth.users WHERE email = 'lucasdmc@lify.com' LIMIT 1)
WHERE NOT EXISTS (
  SELECT 1 FROM public.clinics WHERE id = '00000000-0000-0000-0000-000000000001'
);

-- 7. Limpar registros órfãos na user_profiles
DELETE FROM public.user_profiles 
WHERE user_id NOT IN (SELECT id FROM auth.users);

-- 8. IMPORTANTE: Garantir que Admin Lify e Suporte Lify NÃO tenham clinic_id
UPDATE public.user_profiles 
SET clinic_id = NULL
WHERE role IN ('admin_lify', 'suporte_lify')
AND user_id IN (SELECT id FROM auth.users);

-- 9. Associar usuários normais à clínica principal (apenas se não são admin_lify ou suporte_lify)
UPDATE public.user_profiles 
SET clinic_id = '00000000-0000-0000-0000-000000000001'
WHERE clinic_id IS NULL 
AND role NOT IN ('admin_lify', 'suporte_lify')
AND user_id IN (SELECT id FROM auth.users);

-- 10. Inserir associações na tabela clinic_users (apenas para usuários normais)
INSERT INTO public.clinic_users (user_id, clinic_id, role, is_active)
SELECT 
  up.user_id,
  up.clinic_id,
  up.role,
  true as is_active
FROM public.user_profiles up
WHERE up.user_id IN (SELECT id FROM auth.users)
AND up.clinic_id IS NOT NULL  -- Apenas usuários com clínica específica
AND NOT EXISTS (
  SELECT 1 FROM public.clinic_users cu 
  WHERE cu.user_id = up.user_id 
  AND cu.clinic_id = up.clinic_id
);

-- 11. Atualizar políticas RLS da tabela clinics
DROP POLICY IF EXISTS "Users can view clinics" ON public.clinics;
CREATE POLICY "Users can view clinics" ON public.clinics
    FOR SELECT USING (
        -- Admins lify e suporte lify podem ver todas as clínicas
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin_lify', 'suporte_lify')
        ) OR
        -- Usuários podem ver clínicas associadas a eles
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
        )
    );

-- 12. Criar função para verificar se usuário é admin lify
CREATE OR REPLACE FUNCTION public.is_admin_lify(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role = 'admin_lify'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Criar função para verificar se usuário tem acesso global
CREATE OR REPLACE FUNCTION public.has_global_clinic_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role IN ('admin_lify', 'suporte_lify')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Criar função para verificar se usuário precisa de clínica
CREATE OR REPLACE FUNCTION public.requires_clinic_association(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.user_profiles 
    WHERE user_id = user_uuid AND role IN ('admin_lify', 'suporte_lify')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Verificar resultados
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 'Usuários mestres (sem clínica):' as check_type, 
       up.email,
       up.role,
       'Sem clínica específica' as clinic_name
FROM public.user_profiles up
WHERE up.role IN ('admin_lify', 'suporte_lify')
AND up.user_id IN (SELECT id FROM auth.users)
ORDER BY up.role, up.email;

SELECT 'Usuários com clínica específica:' as check_type, 
       up.email,
       up.role,
       c.name as clinic_name,
       cu.is_active
FROM public.user_profiles up
LEFT JOIN public.clinics c ON up.clinic_id = c.id
LEFT JOIN public.clinic_users cu ON up.user_id = cu.user_id AND up.clinic_id = cu.clinic_id
WHERE up.role NOT IN ('admin_lify', 'suporte_lify')
AND up.user_id IN (SELECT id FROM auth.users)
ORDER BY up.role, up.email;

SELECT 'Total de associações clinic_users:' as check_type, 
       COUNT(*) as total
FROM public.clinic_users;

SELECT 'Clínicas disponíveis:' as check_type,
       id,
       name,
       email
FROM public.clinics
ORDER BY name; 