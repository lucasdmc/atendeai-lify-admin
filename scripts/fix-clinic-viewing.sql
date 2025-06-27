-- Script para corrigir problema de visualização de clínicas
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar políticas atuais
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- 2. Remover política antiga de visualização
DROP POLICY IF EXISTS "Users can view their clinics" ON public.clinics;

-- 3. Criar nova política mais permissiva
CREATE POLICY "Users can view clinics" ON public.clinics
    FOR SELECT USING (
        -- Admins lify podem ver todas as clínicas
        public.is_lify_admin(auth.uid()) OR
        -- Admins podem ver todas as clínicas
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        -- Suporte lify pode ver todas as clínicas
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'suporte_lify'
        ) OR
        -- Usuários podem ver clínicas associadas a eles
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
        )
    );

-- 4. Garantir que todos os usuários tenham acesso à clínica padrão
INSERT INTO public.clinic_users (user_id, clinic_id, role, is_active)
SELECT 
    up.id, 
    '00000000-0000-0000-0000-000000000001' as clinic_id,
    up.role::user_role,
    true as is_active
FROM public.user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM public.clinic_users 
    WHERE user_id = up.id AND clinic_id = '00000000-0000-0000-0000-000000000001'
);

-- 5. Adicionar permissão 'clinicas' para todos os usuários que não têm
INSERT INTO public.user_permissions (user_id, module_name, can_access)
SELECT 
    up.id, 
    'clinicas' as module_name, 
    true as can_access
FROM public.user_profiles up
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = up.id AND module_name = 'clinicas'
);

-- 6. Verificar se a clínica padrão existe
SELECT * FROM public.clinics WHERE id = '00000000-0000-0000-0000-000000000001';

-- 7. Se não existir, criar a clínica padrão
INSERT INTO public.clinics (id, name, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Clínica Principal', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.clinics WHERE id = '00000000-0000-0000-0000-000000000001'
);

-- 8. Verificar políticas após a correção
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clinics';

-- 9. Testar visualização (substitua pelo ID do usuário atual)
-- SELECT * FROM public.clinics; 