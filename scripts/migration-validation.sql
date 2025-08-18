-- Script de Validação da Migration Schema Unificação
-- Executar para verificar se todas as tabelas e constraints foram criadas

-- 1. Verificar se todas as tabelas foram criadas
DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'Validating Schema Migration...';
  
  -- clinic_whatsapp_numbers
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clinic_whatsapp_numbers'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ Table clinic_whatsapp_numbers exists';
  ELSE
    RAISE EXCEPTION '❌ Table clinic_whatsapp_numbers missing';
  END IF;
  
  -- google_calendar_tokens_by_clinic
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'google_calendar_tokens_by_clinic'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ Table google_calendar_tokens_by_clinic exists';
  ELSE
    RAISE EXCEPTION '❌ Table google_calendar_tokens_by_clinic missing';
  END IF;
  
  -- clinic_calendars
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'clinic_calendars'
  ) INTO table_exists;
  
  IF table_exists THEN
    RAISE NOTICE '✅ Table clinic_calendars exists';
  ELSE
    RAISE EXCEPTION '❌ Table clinic_calendars missing';
  END IF;
END $$;

-- 2. Verificar constraints críticas
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'Validating Critical Constraints...';
  
  -- Unique constraint em whatsapp_number
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'clinic_whatsapp_numbers'
      AND tc.constraint_type = 'UNIQUE'
      AND kcu.column_name = 'whatsapp_number'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ Unique constraint on whatsapp_number exists';
  ELSE
    RAISE WARNING '⚠️ Unique constraint on whatsapp_number missing';
  END IF;
  
  -- Unique constraint em clinic_id (1:1 mapping)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'clinic_whatsapp_numbers'
      AND tc.constraint_type = 'UNIQUE'
      AND kcu.column_name = 'clinic_id'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ Unique constraint on clinic_id (1:1 mapping) exists';
  ELSE
    RAISE WARNING '⚠️ Unique constraint on clinic_id missing - 1:1 mapping not enforced';
  END IF;
  
  -- Primary key em google_calendar_tokens_by_clinic (clinic_id)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'google_calendar_tokens_by_clinic'
      AND constraint_type = 'PRIMARY KEY'
  ) INTO constraint_exists;
  
  IF constraint_exists THEN
    RAISE NOTICE '✅ Primary key on google_calendar_tokens_by_clinic exists';
  ELSE
    RAISE WARNING '⚠️ Primary key on google_calendar_tokens_by_clinic missing';
  END IF;
END $$;

-- 3. Verificar índices importantes
DO $$
DECLARE
  index_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'Validating Important Indexes...';
  
  -- clinic_whatsapp_numbers indexes
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'clinic_whatsapp_numbers' 
    AND indexname = 'clinic_whatsapp_numbers_is_active_idx'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '✅ Index on is_active exists';
  ELSE
    RAISE WARNING '⚠️ Index on is_active missing';
  END IF;
  
  -- clinic_calendars indexes
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'clinic_calendars' 
    AND indexname LIKE '%clinic_calendars_unique%'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '✅ Unique index on clinic_calendars exists';
  ELSE
    RAISE WARNING '⚠️ Unique index on clinic_calendars missing';
  END IF;
  
  -- whatsapp_conversations_improved indexes
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'whatsapp_conversations_improved' 
    AND indexname = 'whatsapp_conversations_clinic_idx'
  ) INTO index_exists;
  
  IF index_exists THEN
    RAISE NOTICE '✅ Index on conversations clinic_id exists';
  ELSE
    RAISE WARNING '⚠️ Index on conversations clinic_id missing';
  END IF;
END $$;

-- 4. Verificar foreign keys
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN (
    'clinic_whatsapp_numbers', 
    'google_calendar_tokens_by_clinic', 
    'clinic_calendars'
  )
ORDER BY tc.table_name, kcu.column_name;

-- 5. Verificar estrutura das colunas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name IN (
  'clinic_whatsapp_numbers',
  'google_calendar_tokens_by_clinic', 
  'clinic_calendars'
)
ORDER BY table_name, ordinal_position;

-- 6. Verificar dados básicos (se existem)
SELECT 
  'clinic_whatsapp_numbers' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT clinic_id) as unique_clinics,
  COUNT(DISTINCT whatsapp_number) as unique_numbers
FROM public.clinic_whatsapp_numbers

UNION ALL

SELECT 
  'google_calendar_tokens_by_clinic' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT clinic_id) as unique_clinics,
  COUNT(CASE WHEN expires_at > now() THEN 1 END) as valid_tokens
FROM public.google_calendar_tokens_by_clinic

UNION ALL

SELECT 
  'clinic_calendars' as table_name,
  COUNT(*) as record_count,
  COUNT(DISTINCT clinic_id) as unique_clinics,
  COUNT(CASE WHEN is_active THEN 1 END) as active_calendars
FROM public.clinic_calendars;

-- 7. Verificação final
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Migration Validation Complete!';
  RAISE NOTICE 'Review the output above for any warnings or errors.';
  RAISE NOTICE 'All ✅ marks indicate successful validation.';
  RAISE NOTICE 'Any ⚠️ or ❌ marks require attention.';
END $$;
