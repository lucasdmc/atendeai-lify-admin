-- Migração para corrigir permissões do Admin Lify
-- Garante que admin_lify tenha acesso total e novos usuários admin_lify sejam configurados corretamente

-- 1. Garantir que o usuário lucasdmc@lify.com seja admin_lify
UPDATE user_profiles 
SET role = 'admin_lify' 
WHERE email = 'lucasdmc@lify.com';

-- 2. Adicionar todas as permissões necessárias para admin_lify
INSERT INTO role_permissions (role, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
-- Permissões básicas
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

-- 3. Garantir que o usuário lucasdmc@lify.com tenha todas as permissões
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
AND rp.role = 'admin_lify'
ON CONFLICT (user_id, module_name) DO UPDATE SET
    can_access = EXCLUDED.can_access,
    can_create = EXCLUDED.can_create,
    can_read = EXCLUDED.can_read,
    can_update = EXCLUDED.can_update,
    can_delete = EXCLUDED.can_delete;

-- 4. Verificar e criar políticas RLS para clínicas
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

-- 5. Atualizar função handle_new_user para garantir que novos admin_lify tenham acesso total
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'atendente'
    );
    
    -- Inserir permissões padrão para atendente
    INSERT INTO public.user_permissions (user_id, module_name, can_access) VALUES
    (NEW.id, 'dashboard', true),
    (NEW.id, 'conversas', true),
    (NEW.id, 'conectar_whatsapp', true),
    (NEW.id, 'agentes', false),
    (NEW.id, 'agendamentos', true),
    (NEW.id, 'clinicas', false),
    (NEW.id, 'criar_clinicas', false),
    (NEW.id, 'deletar_clinicas', false),
    (NEW.id, 'contextualizar', false),
    (NEW.id, 'gestao_usuarios', false),
    (NEW.id, 'configuracoes', false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Criar função para atualizar permissões quando role mudar
CREATE OR REPLACE FUNCTION public.update_user_permissions_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o role mudou, atualizar as permissões
    IF OLD.role != NEW.role THEN
        -- Deletar permissões antigas
        DELETE FROM public.user_permissions WHERE user_id = NEW.id;
        
        -- Se for admin_lify, dar todas as permissões
        IF NEW.role = 'admin_lify' THEN
            INSERT INTO public.user_permissions (user_id, module_name, can_access, can_create, can_read, can_update, can_delete) VALUES
            (NEW.id, 'dashboard', true, true, true, true, true),
            (NEW.id, 'conversas', true, true, true, true, true),
            (NEW.id, 'conectar_whatsapp', true, true, true, true, true),
            (NEW.id, 'agentes', true, true, true, true, true),
            (NEW.id, 'agendamentos', true, true, true, true, true),
            (NEW.id, 'clinicas', true, true, true, true, true),
            (NEW.id, 'criar_clinicas', true, true, true, true, true),
            (NEW.id, 'deletar_clinicas', true, true, true, true, true),
            (NEW.id, 'contextualizar', true, true, true, true, true),
            (NEW.id, 'gestao_usuarios', true, true, true, true, true),
            (NEW.id, 'configuracoes', true, true, true, true, true);
        ELSE
            -- Para outros roles, inserir permissões baseadas no role
            INSERT INTO public.user_permissions (user_id, module_name, can_access)
            SELECT 
                NEW.id,
                rp.module_name,
                rp.can_access
            FROM public.role_permissions rp
            WHERE rp.role = NEW.role;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Criar trigger para atualizar permissões automaticamente
DROP TRIGGER IF EXISTS update_permissions_on_role_change ON public.user_profiles;
CREATE TRIGGER update_permissions_on_role_change
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_permissions_on_role_change();

-- 8. Garantir que todos os usuários tenham acesso à clínica padrão
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

-- 9. Verificar se a clínica padrão existe
INSERT INTO public.clinics (id, name, is_active)
SELECT '00000000-0000-0000-0000-000000000001', 'Clínica Principal', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.clinics WHERE id = '00000000-0000-0000-0000-000000000001'
); 