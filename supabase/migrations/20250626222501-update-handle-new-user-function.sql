
-- Atualizar a função handle_new_user para incluir a permissão 'agentes'
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
    (NEW.id, 'contextualizar', false),
    (NEW.id, 'gestao_usuarios', false),
    (NEW.id, 'configuracoes', false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
