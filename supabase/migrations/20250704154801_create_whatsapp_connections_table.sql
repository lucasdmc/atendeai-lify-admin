-- Criar tabela whatsapp_connections para números ativos
CREATE TABLE IF NOT EXISTS whatsapp_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  qr_code_scanned_at TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(clinic_id, phone_number)
);

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_clinic_id 
ON whatsapp_connections(clinic_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_phone_number 
ON whatsapp_connections(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_connections_is_active 
ON whatsapp_connections(is_active);

-- Adicionar comentários para documentação
COMMENT ON TABLE whatsapp_connections IS 'Tabela de conexões WhatsApp ativas por clínica';
COMMENT ON COLUMN whatsapp_connections.phone_number IS 'Número do WhatsApp conectado';
COMMENT ON COLUMN whatsapp_connections.qr_code_scanned_at IS 'Data/hora em que o QR Code foi escaneado';
COMMENT ON COLUMN whatsapp_connections.last_activity IS 'Última atividade da conexão';
