
-- 1. Criar tabela de clínicas
CREATE TABLE IF NOT EXISTS public.clinics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    cnpj text,
    email text,
    phone text,
    address text,
    city text,
    state text,
    website text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Criar tabela de agentes
CREATE TABLE IF NOT EXISTS public.agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    personality text DEFAULT 'profissional e acolhedor',
    temperature numeric(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 1),
    clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Criar enum para categorias de contexto
CREATE TYPE context_category AS ENUM (
    'informacoes_basicas',
    'profissionais', 
    'procedimentos_especialidades',
    'regras_politicas_clinica',
    'regras_politicas_procedimentos'
);

-- 4. Criar tabela de contextos categorizados
CREATE TABLE IF NOT EXISTS public.agent_contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    category context_category NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(agent_id, category, title)
);

-- 5. Criar tabela de associações agente-telefone
CREATE TABLE IF NOT EXISTS public.agent_phone_associations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    phone_number text NOT NULL,
    clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(phone_number)
);

-- 6. Criar tabela de relacionamento usuário-clínica
CREATE TABLE IF NOT EXISTS public.clinic_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'atendente',
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, clinic_id)
);

-- 7. Criar tabela de uploads de arquivos
CREATE TABLE IF NOT EXISTS public.file_uploads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    filename text NOT NULL,
    file_type text NOT NULL,
    file_size integer,
    processed_at timestamp with time zone,
    processing_status text DEFAULT 'pending',
    extracted_content text,
    created_at timestamp with time zone DEFAULT now()
);

-- 8. Adicionar colunas às tabelas existentes
ALTER TABLE public.contextualization_data 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS category context_category;

ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.agents(id),
ADD COLUMN IF NOT EXISTS clinic_id uuid REFERENCES public.clinics(id);

-- 9. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_agents_clinic_id ON public.agents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_agent_contexts_agent_id ON public.agent_contexts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_contexts_category ON public.agent_contexts(category);
CREATE INDEX IF NOT EXISTS idx_agent_phone_associations_phone ON public.agent_phone_associations(phone_number);
CREATE INDEX IF NOT EXISTS idx_clinic_users_user_id ON public.clinic_users(user_id);
CREATE INDEX IF NOT EXISTS idx_clinic_users_clinic_id ON public.clinic_users(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_agent ON public.whatsapp_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic ON public.whatsapp_conversations(clinic_id);

-- 10. Habilitar RLS em todas as novas tabelas
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_phone_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

-- 11. Criar função auxiliar para verificar se usuário é admin Lify
CREATE OR REPLACE FUNCTION public.is_lify_admin(user_id uuid)
RETURNS boolean
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.clinic_users 
        WHERE user_id = $1 AND role IN ('admin', 'suporte_lify')
    );
$$;

-- 12. Criar políticas RLS básicas
-- Clínicas - admins Lify veem todas, outros veem apenas suas clínicas
CREATE POLICY "Users can view their clinics" ON public.clinics
    FOR SELECT USING (
        public.is_lify_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = clinics.id AND is_active = true
        )
    );

-- Agentes - usuários veem agentes de suas clínicas
CREATE POLICY "Users can view clinic agents" ON public.agents
    FOR SELECT USING (
        public.is_lify_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.clinic_users 
            WHERE user_id = auth.uid() AND clinic_id = agents.clinic_id AND is_active = true
        )
    );

-- Contextos - usuários veem contextos de agentes de suas clínicas
CREATE POLICY "Users can view agent contexts" ON public.agent_contexts
    FOR SELECT USING (
        public.is_lify_admin(auth.uid()) OR
        EXISTS (
            SELECT 1 FROM public.agents a
            JOIN public.clinic_users cu ON cu.clinic_id = a.clinic_id
            WHERE a.id = agent_contexts.agent_id 
            AND cu.user_id = auth.uid() AND cu.is_active = true
        )
    );

-- 13. Inserir dados iniciais
-- Clínica padrão
INSERT INTO public.clinics (id, name, is_active) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Clínica Principal', true)
ON CONFLICT (id) DO NOTHING;

-- Agente padrão
INSERT INTO public.agents (id, name, description, clinic_id) 
VALUES (
    '00000000-0000-0000-0000-000000000001', 
    'Assistente Principal', 
    'Agente de atendimento principal da clínica',
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- Associar usuários existentes à clínica padrão
INSERT INTO public.clinic_users (user_id, clinic_id, role)
SELECT id, '00000000-0000-0000-0000-000000000001', 'atendente'::user_role
FROM public.user_profiles
ON CONFLICT (user_id, clinic_id) DO NOTHING;

-- Migrar dados de contextualização existentes
UPDATE public.contextualization_data 
SET agent_id = '00000000-0000-0000-0000-000000000001'
WHERE agent_id IS NULL;

-- 14. Criar função para obter clínicas do usuário
CREATE OR REPLACE FUNCTION public.get_user_clinics(user_id uuid)
RETURNS TABLE(clinic_id uuid, clinic_name text, user_role user_role)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT cu.clinic_id, c.name, cu.role
    FROM public.clinic_users cu
    JOIN public.clinics c ON c.id = cu.clinic_id
    WHERE cu.user_id = $1 AND cu.is_active = true AND c.is_active = true;
$$;
