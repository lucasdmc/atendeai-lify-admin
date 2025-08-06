-- Script para corrigir registros duplicados na tabela google_calendar_tokens
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar registros duplicados
SELECT 
  user_id,
  COUNT(*) as total_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM google_calendar_tokens
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY total_records DESC;

-- 2. Criar tabela temporária com os registros mais recentes
CREATE TEMP TABLE temp_latest_tokens AS
SELECT DISTINCT ON (user_id)
  id,
  user_id,
  access_token,
  refresh_token,
  expires_at,
  scope,
  created_at,
  updated_at
FROM google_calendar_tokens
ORDER BY user_id, updated_at DESC NULLS LAST, created_at DESC;

-- 3. Deletar todos os registros da tabela original
DELETE FROM google_calendar_tokens;

-- 4. Reinserir apenas os registros mais recentes
INSERT INTO google_calendar_tokens (
  id,
  user_id,
  access_token,
  refresh_token,
  expires_at,
  scope,
  created_at,
  updated_at
)
SELECT 
  id,
  user_id,
  access_token,
  refresh_token,
  expires_at,
  scope,
  created_at,
  updated_at
FROM temp_latest_tokens;

-- 5. Adicionar constraint único se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'google_calendar_tokens_user_id_unique'
  ) THEN
    ALTER TABLE google_calendar_tokens 
    ADD CONSTRAINT google_calendar_tokens_user_id_unique 
    UNIQUE (user_id);
  END IF;
END $$;

-- 6. Verificar resultado
SELECT 
  user_id,
  COUNT(*) as total_records
FROM google_calendar_tokens
GROUP BY user_id
ORDER BY total_records DESC;

-- 7. Limpar tabela temporária
DROP TABLE temp_latest_tokens;

-- 8. Verificar se a constraint foi aplicada
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'google_calendar_tokens' 
AND constraint_name = 'google_calendar_tokens_user_id_unique'; 