-- Script para verificar e ajustar clínicas existentes
-- Execute via Supabase Dashboard SQL Editor

-- 1. Verificar clínicas existentes
SELECT 
  id,
  name,
  created_by,
  timezone,
  language,
  created_at
FROM public.clinics
ORDER BY created_at;

-- 2. Verificar agentes e suas clínicas
SELECT 
  a.id,
  a.name as agent_name,
  a.clinic_id,
  c.name as clinic_name,
  a.is_active
FROM public.agents a
LEFT JOIN public.clinics c ON a.clinic_id = c.id
ORDER BY a.name;

-- 3. Verificar agentes sem clínica
SELECT 
  id,
  name,
  clinic_id,
  is_active
FROM public.agents 
WHERE clinic_id IS NULL;

-- 4. Se houver agentes sem clínica, associar à primeira clínica disponível
UPDATE public.agents 
SET clinic_id = (
  SELECT id FROM public.clinics LIMIT 1
)
WHERE clinic_id IS NULL;

-- 5. Verificar resultado final
SELECT 
  a.id,
  a.name as agent_name,
  c.name as clinic_name,
  a.is_active
FROM public.agents a
LEFT JOIN public.clinics c ON a.clinic_id = c.id
ORDER BY a.name; 