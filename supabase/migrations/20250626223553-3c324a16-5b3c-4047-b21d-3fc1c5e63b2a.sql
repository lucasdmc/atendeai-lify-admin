
-- Inserir as permissões por role conforme definido
INSERT INTO public.role_permissions (role, module_name, can_access) VALUES
-- Administrador Lify - acesso total incluindo criação de clínicas
('admin_lify', 'dashboard', true),
('admin_lify', 'conversas', true),
('admin_lify', 'conectar_whatsapp', true),
('admin_lify', 'agentes', true),
('admin_lify', 'agendamentos', true),
('admin_lify', 'clinicas', true),
('admin_lify', 'criar_clinicas', true),
('admin_lify', 'contextualizar', true),
('admin_lify', 'gestao_usuarios', true),
('admin_lify', 'configuracoes', true),

-- Suporte Lify - acesso total exceto criação de clínicas
('suporte_lify', 'dashboard', true),
('suporte_lify', 'conversas', true),
('suporte_lify', 'conectar_whatsapp', true),
('suporte_lify', 'agentes', true),
('suporte_lify', 'agendamentos', true),
('suporte_lify', 'clinicas', true),
('suporte_lify', 'criar_clinicas', false),
('suporte_lify', 'contextualizar', true),
('suporte_lify', 'gestao_usuarios', true),
('suporte_lify', 'configuracoes', true),

-- Administrador - acesso total a uma clínica específica
('admin', 'dashboard', true),
('admin', 'conversas', true),
('admin', 'conectar_whatsapp', true),
('admin', 'agentes', true),
('admin', 'agendamentos', true),
('admin', 'clinicas', false),
('admin', 'criar_clinicas', false),
('admin', 'contextualizar', true),
('admin', 'gestao_usuarios', true),
('admin', 'configuracoes', true),

-- Gestor - responsável pelas configurações do atendimento
('gestor', 'dashboard', true),
('gestor', 'conversas', true),
('gestor', 'conectar_whatsapp', true),
('gestor', 'agentes', true),
('gestor', 'agendamentos', true),
('gestor', 'clinicas', false),
('gestor', 'criar_clinicas', false),
('gestor', 'contextualizar', true),
('gestor', 'gestao_usuarios', false),
('gestor', 'configuracoes', true),

-- Atendente - acesso básico
('atendente', 'dashboard', true),
('atendente', 'conversas', true),
('atendente', 'conectar_whatsapp', false),
('atendente', 'agentes', false),
('atendente', 'agendamentos', true),
('atendente', 'clinicas', false),
('atendente', 'criar_clinicas', false),
('atendente', 'contextualizar', false),
('atendente', 'gestao_usuarios', false),
('atendente', 'configuracoes', false)
ON CONFLICT (role, module_name) DO UPDATE SET can_access = EXCLUDED.can_access;

-- Atualizar função is_lify_admin para incluir admin_lify
CREATE OR REPLACE FUNCTION public.is_lify_admin(user_id uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = $1 AND role IN ('admin_lify', 'suporte_lify')
    );
$$;

-- Criar função para verificar se é admin lify (com permissão de criar clínicas)
CREATE OR REPLACE FUNCTION public.is_admin_lify(user_id uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE id = $1 AND role = 'admin_lify'
    );
$$;

-- Atualizar função handle_new_user para usar a nova estrutura
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, name, role)
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'atendente'
    );
    
    -- Inserir permissões baseadas no role padrão (atendente)
    INSERT INTO public.user_permissions (user_id, module_name, can_access)
    SELECT 
        NEW.id,
        rp.module_name,
        rp.can_access
    FROM public.role_permissions rp
    WHERE rp.role = 'atendente';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para atualizar permissões quando o role do usuário mudar
CREATE OR REPLACE FUNCTION public.update_user_permissions_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Se o role mudou, atualizar as permissões
    IF OLD.role != NEW.role THEN
        -- Deletar permissões antigas
        DELETE FROM public.user_permissions WHERE user_id = NEW.id;
        
        -- Inserir novas permissões baseadas no novo role
        INSERT INTO public.user_permissions (user_id, module_name, can_access)
        SELECT 
            NEW.id,
            rp.module_name,
            rp.can_access
        FROM public.role_permissions rp
        WHERE rp.role = NEW.role;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para atualizar permissões automaticamente
DROP TRIGGER IF EXISTS update_permissions_on_role_change ON public.user_profiles;
CREATE TRIGGER update_permissions_on_role_change
    AFTER UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_permissions_on_role_change();

-- Atualizar políticas RLS para clinics
DROP POLICY IF EXISTS "Admins can create clinics" ON public.clinics;
CREATE POLICY "Admin Lify can create clinics" ON public.clinics
    FOR INSERT WITH CHECK (public.is_admin_lify(auth.uid()));

DROP POLICY IF EXISTS "Admins can update clinics" ON public.clinics;
CREATE POLICY "Admin Lify can update clinics" ON public.clinics
    FOR UPDATE USING (public.is_admin_lify(auth.uid()));
