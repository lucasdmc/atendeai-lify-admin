-- Criar tabela agents se não existir
CREATE TABLE IF NOT EXISTS agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  personality VARCHAR(100) DEFAULT 'profissional e acolhedor',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  clinic_id UUID REFERENCES clinics(id),
  is_active BOOLEAN DEFAULT TRUE,
  context_json TEXT,
  whatsapp_number VARCHAR(20),
  is_whatsapp_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_agents_clinic_id 
ON agents(clinic_id);

CREATE INDEX IF NOT EXISTS idx_agents_whatsapp_number 
ON agents(whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_agents_whatsapp_connected 
ON agents(is_whatsapp_connected);

CREATE INDEX IF NOT EXISTS idx_agents_is_active 
ON agents(is_active);

-- Adicionar comentários para documentação
COMMENT ON TABLE agents IS 'Tabela de agentes de IA para atendimento';
COMMENT ON COLUMN agents.context_json IS 'JSON com informações de contextualização da clínica';
COMMENT ON COLUMN agents.whatsapp_number IS 'Número do WhatsApp associado ao agente';
COMMENT ON COLUMN agents.is_whatsapp_connected IS 'Status de conexão com WhatsApp';
