-- Script para criar mapeamento entre Phone Number ID e número de telefone real
-- Execute este script no Supabase SQL Editor

-- 1. Tabela de mapeamento Phone Number ID -> Número de Telefone
CREATE TABLE IF NOT EXISTS whatsapp_phone_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number_id VARCHAR(50) NOT NULL UNIQUE, -- Phone Number ID da Meta (ex: 698766983327246)
  whatsapp_number VARCHAR(20) NOT NULL, -- Número de telefone real (ex: 554730915628)
  display_phone_number VARCHAR(20), -- Número de exibição (ex: 554730915628)
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_mappings_phone_id ON whatsapp_phone_mappings(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_mappings_whatsapp_number ON whatsapp_phone_mappings(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_mappings_clinic_id ON whatsapp_phone_mappings(clinic_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_mappings_active ON whatsapp_phone_mappings(is_active);

-- 3. Inserir mapeamento para a CardioPrime
INSERT INTO whatsapp_phone_mappings (
  phone_number_id,
  whatsapp_number,
  display_phone_number,
  clinic_id
) VALUES (
  '698766983327246', -- Phone Number ID da Meta
  '554730915628',    -- Número de telefone real
  '554730915628',    -- Número de exibição
  (SELECT id FROM clinics WHERE name LIKE '%CardioPrime%' LIMIT 1)
) ON CONFLICT (phone_number_id) DO UPDATE SET
  whatsapp_number = EXCLUDED.whatsapp_number,
  display_phone_number = EXCLUDED.display_phone_number,
  updated_at = now();

-- 4. Função para buscar clínica por Phone Number ID
CREATE OR REPLACE FUNCTION get_clinic_by_phone_number_id(p_phone_number_id VARCHAR)
RETURNS TABLE(
  clinic_id UUID,
  clinic_name VARCHAR,
  whatsapp_number VARCHAR,
  display_phone_number VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    wpm.whatsapp_number,
    wpm.display_phone_number
  FROM whatsapp_phone_mappings wpm
  JOIN clinics c ON c.id = wpm.clinic_id
  WHERE wpm.phone_number_id = p_phone_number_id
    AND wpm.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 5. Verificar se tudo foi criado corretamente
SELECT 'Mapeamento Phone Number ID criado com sucesso!' as status;

-- 6. Testar a função
SELECT * FROM get_clinic_by_phone_number_id('698766983327246'); 