-- Script para criar clínica padrão e associar agentes
-- Execute via Supabase Dashboard SQL Editor

-- 1. Criar clínica padrão
INSERT INTO public.clinics (
  id,
  name,
  address,
  phone,
  email,
  created_by,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Clínica Padrão',
  'Endereço padrão da clínica',
  '(00) 0000-0000',
  'contato@clinica.com',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now()
) ON CONFLICT DO NOTHING;

-- 2. Buscar a clínica criada
SELECT id, name FROM public.clinics WHERE name = 'Clínica Padrão' LIMIT 1;

-- 3. Associar agente "Lukita 2" à clínica padrão
UPDATE public.agents 
SET clinic_id = (
  SELECT id FROM public.clinics WHERE name = 'Clínica Padrão' LIMIT 1
)
WHERE name = 'Lukita 2' AND clinic_id IS NULL;

-- 4. Verificar resultado
SELECT 
  a.id,
  a.name as agent_name,
  c.name as clinic_name,
  a.is_active,
  a.created_at
FROM public.agents a
LEFT JOIN public.clinics c ON a.clinic_id = c.id
ORDER BY a.name; 