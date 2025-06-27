-- Script para aplicar correções do Admin Lify
-- Execute este script no SQL Editor do Supabase

-- 1. Garantir que o usuário lucasdmc@lify.com seja admin_lify
UPDATE user_profiles 
SET role = 'admin_lify' 
WHERE email = 'lucasdmc@lify.com';

-- 2. Remover permissões antigas do usuário
DELETE FROM user_permissions 
WHERE user_id = (SELECT id FROM user_profiles WHERE email = 'lucasdmc@lify.com');

-- 3. Inserir todas as permissões para admin_lify no role_permissions
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
('admin_lify', 'dashboard', true, true, true, true, true),
('admin_lify', 'conversas', true, true, true, true, true),
('admin_lify', 'conectar_whatsapp', true, true, true, true, true),
('admin_lify', 'agentes', true, true, true, true, true),
('admin_lify', 'agendamentos', true, true, true, true, true),
('admin_lify', 'clinicas', true, true, true, true, true),
('admin_lify', 'criar_clinicas', true, true, true, true, true),
('admin_lify', 'deletar_clinicas', true, true, true, true, true),
('admin_lify', 'contextualizar', true, true, true, true, true),
('admin_lify', 'gestao_usuarios', true, true, true, true, true),
('admin_lify', 'configuracoes', true, true, true, true, true)
ON CONFLICT (role, module_name) DO UPDATE SET
    can_access = EXCLUDED.can_access,
    can_create = EXCLUDED.can_create,
    can_read = EXCLUDED.can_read,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete;

-- 4. Inserir permissões específicas para o usuário lucasdmc@lify.com
INSERT INTO user_permissions (user_id, module_name, can_access, can_create, can_read, can_update, can_delete)
SELECT 
    up.id,
    rp.module_name,
    rp.can_access,
    rp.can_create,
    rp.can_read,
    rp.can_update,
    rp.can_delete
FROM user_profiles up
CROSS JOIN role_permissions rp
WHERE up.email = 'lucasdmc@lify.com' 
AND rp.role = 'admin_lify';

-- 5. Verificar e criar políticas RLS para clínicas
-- Política de SELECT (visualização)
DROP POLICY IF EXISTS "Users can view clinics" ON public.clinics;
CREATE POLICY "Users can view clinics" ON public.clinics
    FOR SELECT USING (
        public.is_lify_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'suporte_lify'
        ) OR
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
        )
    );

-- Política de INSERT (criação)
DROP POLICY IF EXISTS "Admins can create clinics" ON public.clinics;
CREATE POLICY "Admin Lify can create clinics" ON public.clinics
    FOR INSERT WITH CHECK (
        public.is_admin_lify(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política de UPDATE (atualização)
DROP POLICY IF EXISTS "Admins can update clinics" ON public.clinics;
CREATE POLICY "Admin Lify can update clinics" ON public.clinics
    FOR UPDATE USING (
        public.is_admin_lify(auth.uid()) OR 
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Política de DELETE (exclusão)
DROP POLICY IF EXISTS "Admin Lify can delete clinics" ON public.clinics;
CREATE POLICY "Admin Lify can delete clinics" ON public.clinics
    FOR DELETE USING (
        public.is_admin_lify(auth.uid())
    );

-- 6. Garantir que todos os usuários tenham acesso à clínica padrão
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

-- 7. Verificar se a clínica padrão existe
INSERT INTO public.clinics (id, name, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Clínica Principal', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.clinics WHERE id = '00000000-0000-0000-0000-000000000001'
);

-- 8. Verificar resultados
SELECT '=== VERIFICAÇÃO FINAL ===' as info;

SELECT 'Usuário lucasdmc@lify.com:' as check_type, 
       up.role, 
       up.email 
FROM user_profiles up 
WHERE up.email = 'lucasdmc@lify.com';

SELECT 'Permissões do usuário:' as check_type, 
       module_name, 
       can_access, 
       can_create, 
       can_delete 
FROM user_permissions up
JOIN user_profiles u ON up.user_id = u.id
WHERE u.email = 'lucasdmc@lify.com'
ORDER BY module_name;

SELECT 'Políticas da tabela clinics:' as check_type, 
       policyname, 
       cmd 
FROM pg_policies 
WHERE tablename = 'clinics' 
ORDER BY cmd; 