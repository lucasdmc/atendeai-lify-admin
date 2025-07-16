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
  updated_at,
  timezone,
  language,
  working_hours,
  specialties,
  payment_methods,
  insurance_accepted,
  emergency_contact
) VALUES (
  gen_random_uuid(),
  'Clínica Padrão',
  '{"street": "Endereço padrão", "city": "São Paulo", "state": "SP", "country": "Brasil", "zipCode": "00000-000"}',
  '{"value": "(00) 0000-0000", "type": "principal"}',
  '{"value": "contato@clinica.com", "type": "principal"}',
  '00000000-0000-0000-0000-000000000000',
  now(),
  now(),
  'America/Sao_Paulo',
  'pt-BR',
  '{"monday": {"open": "08:00", "close": "18:00"}, "tuesday": {"open": "08:00", "close": "18:00"}, "wednesday": {"open": "08:00", "close": "18:00"}, "thursday": {"open": "08:00", "close": "18:00"}, "friday": {"open": "08:00", "close": "18:00"}, "saturday": {"open": "08:00", "close": "12:00"}, "sunday": {"open": null, "close": null}}',
  '["Clínica Geral"]',
  '["dinheiro", "cartao_credito", "cartao_debito", "pix"]',
  '[]',
  '{"phone": "(00) 0000-0000", "available": true}'
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

-- 5. Verificar clínicas criadas
SELECT 
  id,
  name,
  created_at,
  timezone,
  language
FROM public.clinics
ORDER BY created_at; 