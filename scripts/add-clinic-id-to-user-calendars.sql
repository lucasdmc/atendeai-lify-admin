-- Adicionar campo clinic_id à tabela user_calendars se não existir
DO $$
BEGIN
    -- Verificar se a coluna clinic_id já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_calendars' 
        AND column_name = 'clinic_id'
    ) THEN
        -- Adicionar a coluna clinic_id
        ALTER TABLE user_calendars 
        ADD COLUMN clinic_id UUID REFERENCES clinics(id);
        
        RAISE NOTICE 'Coluna clinic_id adicionada à tabela user_calendars';
    ELSE
        RAISE NOTICE 'Coluna clinic_id já existe na tabela user_calendars';
    END IF;
END $$;

-- Criar índice para melhorar performance de consultas por clínica
CREATE INDEX IF NOT EXISTS idx_user_calendars_clinic_id 
ON user_calendars(clinic_id);

-- Atualizar calendários existentes para associar à clínica principal se clinic_id for NULL
UPDATE user_calendars 
SET clinic_id = (
    SELECT id 
    FROM clinics 
    WHERE is_active = true 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE clinic_id IS NULL;

-- Verificar resultado
SELECT 
    COUNT(*) as total_calendars,
    COUNT(clinic_id) as calendarios_com_clinica,
    COUNT(*) - COUNT(clinic_id) as calendarios_sem_clinica
FROM user_calendars; 