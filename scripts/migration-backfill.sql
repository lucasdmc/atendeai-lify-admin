-- Scripts de Backfill para Migration Schema Unificação
-- Executar APÓS aplicar a migration principal

-- 1. Backfill clinic_whatsapp_numbers com dados existentes
-- Assumindo que existe uma tabela ou campo com números de WhatsApp
INSERT INTO public.clinic_whatsapp_numbers (clinic_id, whatsapp_number, is_active, created_at)
SELECT 
  id as clinic_id,
  whatsapp_phone as whatsapp_number,
  true as is_active,
  COALESCE(created_at, now()) as created_at
FROM public.clinics 
WHERE whatsapp_phone IS NOT NULL 
  AND whatsapp_phone != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.clinic_whatsapp_numbers 
    WHERE clinic_id = clinics.id
  )
ON CONFLICT (clinic_id) DO NOTHING;

-- 2. Backfill google_calendar_tokens_by_clinic com tokens existentes
-- Assumindo que existe uma tabela user_calendars ou similar
INSERT INTO public.google_calendar_tokens_by_clinic (
  clinic_id, 
  access_token, 
  refresh_token, 
  expires_at, 
  scope,
  provider_user_id,
  provider_email,
  created_at
)
SELECT DISTINCT
  c.id as clinic_id,
  uc.access_token,
  uc.refresh_token,
  uc.expires_at,
  uc.scope,
  uc.user_id as provider_user_id,
  u.email as provider_email,
  COALESCE(uc.created_at, now()) as created_at
FROM public.clinics c
JOIN public.users u ON u.clinic_id = c.id
LEFT JOIN public.user_calendars uc ON uc.user_id = u.id
WHERE uc.access_token IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.google_calendar_tokens_by_clinic 
    WHERE clinic_id = c.id
  )
ON CONFLICT (clinic_id) DO UPDATE SET
  access_token = EXCLUDED.access_token,
  refresh_token = EXCLUDED.refresh_token,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

-- 3. Backfill clinic_calendars com calendários existentes  
-- Assumindo dados existentes em user_calendars
INSERT INTO public.clinic_calendars (
  clinic_id,
  calendar_id,
  calendar_summary,
  is_primary,
  is_active,
  created_at
)
SELECT DISTINCT
  c.id as clinic_id,
  uc.calendar_id,
  uc.calendar_summary,
  COALESCE(uc.is_primary, false) as is_primary,
  true as is_active,
  COALESCE(uc.created_at, now()) as created_at
FROM public.clinics c
JOIN public.users u ON u.clinic_id = c.id
LEFT JOIN public.user_calendars uc ON uc.user_id = u.id
WHERE uc.calendar_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clinic_calendars 
    WHERE clinic_id = c.id AND calendar_id = uc.calendar_id
  )
ON CONFLICT (clinic_id, calendar_id) DO NOTHING;

-- 4. Verificações pós-migração
DO $$
DECLARE
  clinic_count INTEGER;
  whatsapp_count INTEGER;
  token_count INTEGER;
  calendar_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO clinic_count FROM public.clinics;
  SELECT COUNT(*) INTO whatsapp_count FROM public.clinic_whatsapp_numbers;
  SELECT COUNT(*) INTO token_count FROM public.google_calendar_tokens_by_clinic;
  SELECT COUNT(*) INTO calendar_count FROM public.clinic_calendars;
  
  RAISE NOTICE 'Migration Backfill Summary:';
  RAISE NOTICE 'Total Clinics: %', clinic_count;
  RAISE NOTICE 'WhatsApp Numbers Mapped: %', whatsapp_count;
  RAISE NOTICE 'Google Tokens Migrated: %', token_count;
  RAISE NOTICE 'Calendars Associated: %', calendar_count;
  
  -- Validações críticas
  IF whatsapp_count = 0 AND clinic_count > 0 THEN
    RAISE WARNING 'ATTENTION: No WhatsApp numbers were migrated. Check source data.';
  END IF;
  
  IF token_count = 0 AND clinic_count > 0 THEN
    RAISE WARNING 'ATTENTION: No Google tokens were migrated. Check user_calendars table.';
  END IF;
END $$;

-- 5. Clean up: Comentar/remover estas linhas após validação
-- DROP TABLE IF EXISTS public.whatsapp_connections; -- Se não for mais usado
-- ALTER TABLE public.clinics DROP COLUMN IF EXISTS whatsapp_phone; -- Após confirmar migração

COMMENT ON TABLE public.clinic_whatsapp_numbers IS 'Migrated from clinics.whatsapp_phone - 1:1 mapping enforced';
COMMENT ON TABLE public.google_calendar_tokens_by_clinic IS 'Migrated from user_calendars - OAuth per clinic enforced';
COMMENT ON TABLE public.clinic_calendars IS 'Migrated from user_calendars - Multiple calendars per clinic supported';
