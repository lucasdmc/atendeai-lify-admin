-- Adicionar campos de contextualização na tabela clinics
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS contextualization_json JSONB DEFAULT '{}';
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS has_contextualization BOOLEAN DEFAULT false;

-- Criar índice para busca por telefone
CREATE INDEX IF NOT EXISTS idx_clinics_whatsapp_phone ON clinics(whatsapp_phone);

-- Função para atualizar flag de contextualização
CREATE OR REPLACE FUNCTION update_contextualization_flag()
RETURNS TRIGGER AS $$
BEGIN
    NEW.has_contextualization = (NEW.contextualization_json IS NOT NULL AND NEW.contextualization_json != '{}');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar flag automaticamente
DROP TRIGGER IF EXISTS trigger_update_contextualization_flag ON clinics;
CREATE TRIGGER trigger_update_contextualization_flag
    BEFORE INSERT OR UPDATE ON clinics
    FOR EACH ROW EXECUTE FUNCTION update_contextualization_flag();

-- Função para buscar contextualização de uma clínica
CREATE OR REPLACE FUNCTION get_clinic_contextualization(p_whatsapp_phone VARCHAR)
RETURNS TABLE(
  clinic_id UUID,
  clinic_name VARCHAR,
  contextualization_json JSONB,
  has_contextualization BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.contextualization_json,
    c.has_contextualization
  FROM clinics c
  WHERE c.whatsapp_phone = p_whatsapp_phone;
END;
$$ LANGUAGE plpgsql;

-- Inserir dados de exemplo
INSERT INTO clinics (id, name, whatsapp_phone, contextualization_json, has_contextualization) 
VALUES (
  gen_random_uuid(),
  'Clínica AtendeAí',
  '554730915628',
  '{}',
  false
) ON CONFLICT DO NOTHING;

-- Verificar se tudo foi criado
SELECT 'Campos de contextualização adicionados com sucesso!' as status; 