-- Corrigir erro de coluna ambígua "phone_number"
-- Este erro ocorre porque há múltiplas tabelas com a coluna phone_number

-- Verificar tabelas que têm phone_number
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE column_name = 'phone_number';

-- Corrigir função get_clinic_contextualization
CREATE OR REPLACE FUNCTION get_clinic_contextualization(p_whatsapp_phone TEXT)
RETURNS TABLE(
    clinic_id UUID,
    clinic_name TEXT,
    contextualization_json JSONB,
    has_contextualization BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as clinic_id,
        c.name as clinic_name,
        c.contextualization_json,
        c.has_contextualization
    FROM clinics c
    WHERE c.whatsapp_phone = p_whatsapp_phone;
END;
$$ LANGUAGE plpgsql;

-- Verificar se a função foi criada corretamente
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_clinic_contextualization';

-- Testar a função
SELECT * FROM get_clinic_contextualization('554730915628'); 