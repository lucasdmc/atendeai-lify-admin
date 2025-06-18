
-- Criar enum para tipos de usuário
CREATE TYPE user_role AS ENUM ('admin', 'suporte_lify', 'atendente');

-- Tabela de perfis de usuário
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'atendente',
    status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de permissões por módulo
CREATE TABLE public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_name TEXT NOT NULL,
    can_access BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, module_name)
);

-- Tabela de dados de contextualização
CREATE TABLE public.contextualization_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT,
    order_number INTEGER NOT NULL,
    clinic_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações do sistema
CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_name TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de métricas do dashboard
CREATE TABLE public.dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contextualization_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Função para verificar o papel do usuário
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.user_profiles WHERE id = user_id;
$$;

-- Políticas RLS para user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins and suporte can view all profiles" ON public.user_profiles
    FOR SELECT USING (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

CREATE POLICY "Admins and suporte can update profiles" ON public.user_profiles
    FOR UPDATE USING (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

CREATE POLICY "Admins and suporte can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

-- Políticas RLS para user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and suporte can manage all permissions" ON public.user_permissions
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

-- Políticas RLS para conversas (todos os usuários autenticados podem ver)
CREATE POLICY "Authenticated users can view conversations" ON public.whatsapp_conversations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage conversations" ON public.whatsapp_conversations
    FOR ALL TO authenticated USING (true);

-- Políticas RLS para mensagens
CREATE POLICY "Authenticated users can view messages" ON public.whatsapp_messages
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage messages" ON public.whatsapp_messages
    FOR ALL TO authenticated USING (true);

-- Políticas RLS para contextualização (apenas admin e suporte)
CREATE POLICY "Admins and suporte can manage contextualization" ON public.contextualization_data
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

-- Políticas RLS para configurações (apenas admin e suporte)
CREATE POLICY "Admins and suporte can manage settings" ON public.settings
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

-- Políticas RLS para métricas (todos podem ver)
CREATE POLICY "Authenticated users can view metrics" ON public.dashboard_metrics
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and suporte can manage metrics" ON public.dashboard_metrics
    FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'suporte_lify'));

-- Trigger para criar perfil automaticamente
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
    (NEW.id, 'contextualizar', false),
    (NEW.id, 'gestao_usuarios', false),
    (NEW.id, 'configuracoes', false);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Inserir configurações padrão
INSERT INTO public.settings (setting_name, setting_value, setting_type, description) VALUES
('bot_name', 'Assistente Virtual', 'text', 'Nome do chatbot'),
('welcome_message', 'Olá! Como posso ajudá-lo hoje?', 'text', 'Mensagem de boas-vindas'),
('language', 'pt-BR', 'select', 'Idioma do sistema'),
('security_level', 'medium', 'select', 'Nível de segurança'),
('clinic_name', '', 'text', 'Nome da clínica'),
('clinic_cnpj', '', 'text', 'CNPJ da clínica'),
('clinic_address', '', 'text', 'Endereço da clínica'),
('clinic_phone', '', 'text', 'Telefone da clínica'),
('clinic_email', '', 'email', 'E-mail da clínica');

-- Inserir perguntas de contextualização padrão
INSERT INTO public.contextualization_data (question, answer, order_number) VALUES
('Qual o nome da clínica?', null, 1),
('Qual o CNPJ da clínica?', null, 2),
('Qual o endereço completo da clínica?', null, 3),
('Qual o bairro e cidade da clínica?', null, 4),
('Qual o estado da clínica?', null, 5),
('Qual o telefone principal de contato?', null, 6),
('Qual o e-mail institucional da clínica?', null, 7),
('Qual o site da clínica (se houver)?', null, 8),
('Qual o nome do responsável técnico?', null, 9),
('Qual o telefone do responsável técnico?', null, 10),
('Qual o nome do agente virtual (assistente)?', null, 11),
('Qual o tom de comunicação desejado para o agente?', null, 12),
('Quais especialidades médicas a clínica oferece?', null, 13),
('Quais são os horários de funcionamento da clínica?', null, 14),
('A clínica atende em finais de semana ou feriados?', null, 15),
('Quais são os principais serviços oferecidos?', null, 16),
('A clínica possui estacionamento próprio?', null, 17),
('A clínica é acessível para pessoas com deficiência?', null, 18),
('Quais documentos o paciente deve levar para o atendimento?', null, 19),
('Como é feito o agendamento de consultas?', null, 20);

-- Inserir métricas iniciais mockadas
INSERT INTO public.dashboard_metrics (metric_name, metric_value, metric_date) VALUES
('novas_conversas', 25, CURRENT_DATE),
('aguardando_resposta', 8, CURRENT_DATE),
('tempo_medio_chatbot', 2.5, CURRENT_DATE),
('tempo_medio_atendente', 8.3, CURRENT_DATE),
('taxa_resolucao', 78.5, CURRENT_DATE),
('taxa_transferencia', 21.5, CURRENT_DATE),
('satisfacao_usuario', 4.2, CURRENT_DATE),
('custo_por_interacao', 0.15, CURRENT_DATE);
