-- Script simples para criar clínica padrão
-- Execute via Supabase Dashboard SQL Editor

-- 1. Criar clínica padrão (versão simplificada)
INSERT INTO public.clinics (
  name,
  created_by,
  timezone,
  language
) VALUES (
  'Clínica Padrão',
  '00000000-0000-0000-0000-000000000000',
  'America/Sao_Paulo',
  'pt-BR'
) ON CONFLICT DO NOTHING;

-- 2. Verificar se foi criada
SELECT id, name, created_at FROM public.clinics WHERE name = 'Clínica Padrão';

-- 3. Associar agente "Lukita 2" à clínica padrão
UPDATE public.agents 
SET clinic_id = (
  SELECT id FROM public.clinics WHERE name = 'Clínica Padrão' LIMIT 1
)
WHERE name = 'Lukita 2' AND clinic_id IS NULL;

-- 4. Verificar resultado final
SELECT 
  a.id,
  a.name as agent_name,
  c.name as clinic_name,
  a.is_active
FROM public.agents a
LEFT JOIN public.clinics c ON a.clinic_id = c.id
ORDER BY a.name; 