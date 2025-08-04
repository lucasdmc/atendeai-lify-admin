-- Script para remover a tabela whatsapp_conversation_memory
-- Execute este script no Supabase SQL Editor

-- Verificar se a tabela existe antes de remover
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'whatsapp_conversation_memory'
  ) THEN
    -- Remover a tabela
    DROP TABLE IF EXISTS public.whatsapp_conversation_memory;
    RAISE NOTICE 'Tabela whatsapp_conversation_memory removida com sucesso!';
  ELSE
    RAISE NOTICE 'Tabela whatsapp_conversation_memory não existe.';
  END IF;
END $$;

-- Verificar se foi removida
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'whatsapp_conversation_memory'
    ) THEN 'Tabela ainda existe'
    ELSE 'Tabela removida com sucesso'
  END as status; 