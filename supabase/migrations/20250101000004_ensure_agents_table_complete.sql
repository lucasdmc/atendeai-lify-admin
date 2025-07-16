-- Migration para garantir que a tabela agents tenha todas as colunas necessárias
-- Execute: supabase db push --linked --include-all

-- 1. Criar tabela agents se não existir
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT DEFAULT 'profissional e acolhedor',
  temperature DECIMAL(3,2) DEFAULT 0.70 CHECK (temperature >= 0.0 AND temperature <= 1.0),
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  context_json JSONB,
  whatsapp_number TEXT,
  is_whatsapp_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Adicionar colunas que podem estar faltando (se não existirem)
DO $$ 
BEGIN
  -- Adicionar coluna personality se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'personality') THEN
    ALTER TABLE public.agents ADD COLUMN personality TEXT DEFAULT 'profissional e acolhedor';
  END IF;

  -- Adicionar coluna temperature se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'temperature') THEN
    ALTER TABLE public.agents ADD COLUMN temperature DECIMAL(3,2) DEFAULT 0.70;
    ALTER TABLE public.agents ADD CONSTRAINT agents_temperature_check CHECK (temperature >= 0.0 AND temperature <= 1.0);
  END IF;

  -- Adicionar coluna clinic_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'clinic_id') THEN
    ALTER TABLE public.agents ADD COLUMN clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;
  END IF;

  -- Adicionar coluna is_active se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'is_active') THEN
    ALTER TABLE public.agents ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Adicionar coluna context_json se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'context_json') THEN
    ALTER TABLE public.agents ADD COLUMN context_json JSONB;
  END IF;

  -- Adicionar coluna whatsapp_number se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'whatsapp_number') THEN
    ALTER TABLE public.agents ADD COLUMN whatsapp_number TEXT;
  END IF;

  -- Adicionar coluna is_whatsapp_connected se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'is_whatsapp_connected') THEN
    ALTER TABLE public.agents ADD COLUMN is_whatsapp_connected BOOLEAN DEFAULT false;
  END IF;

  -- Adicionar coluna updated_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agents' AND column_name = 'updated_at') THEN
    ALTER TABLE public.agents ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agents_clinic_id ON public.agents(clinic_id);
CREATE INDEX IF NOT EXISTS idx_agents_is_active ON public.agents(is_active);
CREATE INDEX IF NOT EXISTS idx_agents_name ON public.agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_whatsapp_number ON public.agents(whatsapp_number);

-- 4. Habilitar Row Level Security
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
CREATE POLICY "Users can view agents" ON public.agents
  FOR SELECT USING (true);

CREATE POLICY "Users can insert agents" ON public.agents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update agents" ON public.agents
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete agents" ON public.agents
  FOR DELETE USING (true);

-- 6. Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Trigger para atualizar timestamp
DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at 
  BEFORE UPDATE ON public.agents 
  FOR EACH ROW EXECUTE FUNCTION update_agents_updated_at();

-- 8. Função para validar dados do agente
CREATE OR REPLACE FUNCTION validate_agent_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar nome não vazio
  IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
    RAISE EXCEPTION 'Nome do agente é obrigatório';
  END IF;

  -- Validar temperature entre 0 e 1
  IF NEW.temperature IS NOT NULL AND (NEW.temperature < 0.0 OR NEW.temperature > 1.0) THEN
    RAISE EXCEPTION 'Temperature deve estar entre 0.0 e 1.0';
  END IF;

  -- Validar personality não vazio se fornecido
  IF NEW.personality IS NOT NULL AND TRIM(NEW.personality) = '' THEN
    RAISE EXCEPTION 'Personality não pode estar vazio se fornecido';
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Trigger para validar dados
DROP TRIGGER IF EXISTS validate_agent_data ON public.agents;
CREATE TRIGGER validate_agent_data 
  BEFORE INSERT OR UPDATE ON public.agents 
  FOR EACH ROW EXECUTE FUNCTION validate_agent_data();

-- 10. Comentários para documentação
COMMENT ON TABLE public.agents IS 'Tabela de agentes de IA para atendimento';
COMMENT ON COLUMN public.agents.id IS 'ID único do agente';
COMMENT ON COLUMN public.agents.name IS 'Nome do agente';
COMMENT ON COLUMN public.agents.description IS 'Descrição do agente';
COMMENT ON COLUMN public.agents.personality IS 'Personalidade do agente (ex: profissional e acolhedor)';
COMMENT ON COLUMN public.agents.temperature IS 'Temperatura da IA (0.0 = determinístico, 1.0 = criativo)';
COMMENT ON COLUMN public.agents.clinic_id IS 'ID da clínica associada ao agente';
COMMENT ON COLUMN public.agents.is_active IS 'Se o agente está ativo';
COMMENT ON COLUMN public.agents.context_json IS 'Contexto JSON personalizado do agente';
COMMENT ON COLUMN public.agents.whatsapp_number IS 'Número do WhatsApp do agente';
COMMENT ON COLUMN public.agents.is_whatsapp_connected IS 'Se o WhatsApp está conectado';
COMMENT ON COLUMN public.agents.created_at IS 'Data de criação';
COMMENT ON COLUMN public.agents.updated_at IS 'Data de última atualização'; 