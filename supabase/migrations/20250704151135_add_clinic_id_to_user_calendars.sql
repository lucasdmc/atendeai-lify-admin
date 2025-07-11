-- Adicionar campo clinic_id à tabela user_calendars
ALTER TABLE user_calendars 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id);

-- Criar índice para melhorar performance de consultas por clínica
CREATE INDEX IF NOT EXISTS idx_user_calendars_clinic_id 
ON user_calendars(clinic_id);

-- Atualizar calendários existentes para associar à primeira clínica se clinic_id for NULL
UPDATE user_calendars 
SET clinic_id = (
    SELECT id 
    FROM clinics 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE clinic_id IS NULL;
