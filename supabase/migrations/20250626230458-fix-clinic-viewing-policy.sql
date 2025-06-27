-- Corrigir política de visualização de clínicas para permitir que admins vejam todas as clínicas
-- e usuários vejam clínicas associadas a eles

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view their clinics" ON public.clinics;

-- Criar nova política mais permissiva para visualização
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

-- Garantir que todos os usuários tenham acesso à clínica padrão
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

-- Adicionar permissão 'clinicas' para todos os usuários que não têm
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