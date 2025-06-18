
-- Inserir usuário admin diretamente
-- Nota: Em produção, isso seria feito através do painel do Supabase Auth
-- Este é um exemplo para desenvolvimento/teste

-- Inserir perfil de admin (assumindo que o usuário será criado via Auth UI)
-- Email: admin@lify.com
-- Senha: Admin123!

-- Este script deve ser executado após criar o usuário via Supabase Auth UI
-- ou você pode usar este INSERT para simular um usuário admin

INSERT INTO public.user_profiles (id, name, role, status) 
VALUES (
    gen_random_uuid(), 
    'Administrador', 
    'admin', 
    true
) ON CONFLICT (id) DO NOTHING;

-- Inserir permissões completas para admin
-- Primeiro, vamos garantir que temos um ID de usuário válido para trabalhar
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Pegar o primeiro usuário admin criado
    SELECT id INTO admin_user_id FROM public.user_profiles WHERE role = 'admin' LIMIT 1;
    
    IF admin_user_id IS NOT NULL THEN
        -- Inserir todas as permissões para o admin
        INSERT INTO public.user_permissions (user_id, module_name, can_access) VALUES
        (admin_user_id, 'dashboard', true),
        (admin_user_id, 'conversas', true),
        (admin_user_id, 'conectar_whatsapp', true),
        (admin_user_id, 'contextualizar', true),
        (admin_user_id, 'gestao_usuarios', true),
        (admin_user_id, 'configuracoes', true)
        ON CONFLICT (user_id, module_name) DO UPDATE SET can_access = true;
    END IF;
END $$;

-- Inserir dados de exemplo para tornar a aplicação mais realista
INSERT INTO public.contextualization_data (question, answer, order_number) VALUES
('Nome da clínica', 'Clínica Exemplo Lify', 1),
('CNPJ da clínica', '12.345.678/0001-90', 2),
('Endereço da clínica', 'Rua das Flores, 123, Centro', 3),
('Cidade da clínica', 'São Paulo - SP', 4),
('Telefone da clínica', '(11) 99999-9999', 5),
('Email da clínica', 'contato@clinicaexemplo.com.br', 6),
('Horário de funcionamento', 'Segunda a Sexta: 8h às 18h', 7),
('Especialidades', 'Clínica Geral, Pediatria, Ginecologia', 8)
ON CONFLICT (order_number) DO UPDATE SET 
    answer = EXCLUDED.answer,
    updated_at = now();

-- Atualizar configurações com dados da clínica
UPDATE public.settings SET 
    setting_value = CASE 
        WHEN setting_name = 'clinic_name' THEN 'Clínica Exemplo Lify'
        WHEN setting_name = 'clinic_cnpj' THEN '12.345.678/0001-90'
        WHEN setting_name = 'clinic_address' THEN 'Rua das Flores, 123, Centro, São Paulo - SP'
        WHEN setting_name = 'clinic_phone' THEN '(11) 99999-9999'
        WHEN setting_name = 'clinic_email' THEN 'contato@clinicaexemplo.com.br'
        WHEN setting_name = 'bot_name' THEN 'Assistente Virtual Lify'
        WHEN setting_name = 'welcome_message' THEN 'Olá! Sou o assistente virtual da Clínica Exemplo. Como posso ajudá-lo hoje?'
        ELSE setting_value
    END,
    updated_at = now()
WHERE setting_name IN ('clinic_name', 'clinic_cnpj', 'clinic_address', 'clinic_phone', 'clinic_email', 'bot_name', 'welcome_message');
