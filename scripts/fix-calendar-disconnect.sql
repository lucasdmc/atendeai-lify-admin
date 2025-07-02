-- Script para corrigir a desconexão de calendários
-- Deleta primeiro os logs de sincronização antes de deletar os calendários

-- Função para desconectar calendários corretamente
CREATE OR REPLACE FUNCTION disconnect_user_calendars(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Primeiro, deleta os logs de sincronização relacionados aos calendários do usuário
  DELETE FROM calendar_sync_logs 
  WHERE user_calendar_id IN (
    SELECT id FROM user_calendars WHERE user_id = disconnect_user_calendars.user_id
  );
  
  -- Depois, deleta os calendários do usuário
  DELETE FROM user_calendars WHERE user_id = disconnect_user_calendars.user_id;
  
  -- Por fim, deleta os tokens do usuário
  DELETE FROM google_calendar_tokens WHERE user_id = disconnect_user_calendars.user_id;
END;
$$;

-- Política para permitir que usuários deletem seus próprios calendários
DROP POLICY IF EXISTS "Users can delete their own calendars" ON user_calendars;
CREATE POLICY "Users can delete their own calendars" ON user_calendars
  FOR DELETE USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem seus próprios tokens
DROP POLICY IF EXISTS "Users can delete their own tokens" ON google_calendar_tokens;
CREATE POLICY "Users can delete their own tokens" ON google_calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Política para permitir que usuários deletem seus próprios logs de sincronização
DROP POLICY IF EXISTS "Users can delete their own sync logs" ON calendar_sync_logs;
CREATE POLICY "Users can delete their own sync logs" ON calendar_sync_logs
  FOR DELETE USING (
    user_calendar_id IN (
      SELECT id FROM user_calendars WHERE user_id = auth.uid()
    )
  );

-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE user_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_calendar_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_sync_logs ENABLE ROW LEVEL SECURITY;

-- Verificar se a função foi criada
SELECT 
  'Function created successfully' as status,
  proname as function_name,
  prosrc as function_source
FROM pg_proc 
WHERE proname = 'disconnect_user_calendars';

-- Script para corrigir o problema de foreign key ao desconectar calendários
-- Deletar registros da tabela calendar_sync_logs que referenciam user_calendars

-- 1. Primeiro, vamos verificar quais registros existem
SELECT 
    'calendar_sync_logs' as table_name,
    COUNT(*) as record_count
FROM calendar_sync_logs csl
JOIN user_calendars uc ON csl.user_calendar_id = uc.id
WHERE uc.user_id = '5cd566ec-0064-4c9f-946b-182deaf204d4';

-- 2. Deletar registros da calendar_sync_logs que referenciam user_calendars do usuário
DELETE FROM calendar_sync_logs 
WHERE user_calendar_id IN (
    SELECT id FROM user_calendars 
    WHERE user_id = '5cd566ec-0064-4c9f-946b-182deaf204d4'
);

-- 3. Agora é seguro deletar os user_calendars
DELETE FROM user_calendars 
WHERE user_id = '5cd566ec-0064-4c9f-946b-182deaf204d4';

-- 4. Verificar se a limpeza foi bem-sucedida
SELECT 
    'user_calendars' as table_name,
    COUNT(*) as remaining_records
FROM user_calendars 
WHERE user_id = '5cd566ec-0064-4c9f-946b-182deaf204d4';

SELECT 
    'calendar_sync_logs' as table_name,
    COUNT(*) as remaining_records
FROM calendar_sync_logs csl
JOIN user_calendars uc ON csl.user_calendar_id = uc.id
WHERE uc.user_id = '5cd566ec-0064-4c9f-946b-182deaf204d4'; 