-- Script para verificar e configurar a Admin Lify
-- Execute este script diretamente no editor SQL do Supabase

-- 1. Verificar se a Admin Lify existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM clinics WHERE id = '00000000-0000-0000-0000-000000000001') 
    THEN '✅ Admin Lify existe' 
    ELSE '❌ Admin Lify não existe' 
  END as status;

-- 2. Verificar dados da Admin Lify
SELECT 
  id,
  name,
  email,
  phone,
  address,
  city,
  state,
  is_active,
  created_at
FROM clinics 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Se não existir, criar a Admin Lify
INSERT INTO clinics (
  id, 
  name, 
  email, 
  phone, 
  address, 
  city, 
  state, 
  is_active, 
  created_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin Lify',
  'admin@lify.com',
  '+55 (11) 99999-9999',
  'Sede Administrativa Lify',
  'São Paulo',
  'SP',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  is_active = EXCLUDED.is_active;

-- 4. Verificar resultado final
SELECT 
  id,
  name,
  email,
  phone,
  address,
  city,
  state,
  is_active,
  created_at
FROM clinics 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5. Listar todas as clínicas (Admin Lify deve estar oculta na interface)
SELECT 
  id,
  name,
  email,
  city,
  state,
  is_active,
  CASE 
    WHEN id = '00000000-0000-0000-0000-000000000001' 
    THEN 'Admin Lify (oculta)' 
    ELSE 'Clínica normal' 
  END as tipo
FROM clinics 
ORDER BY created_at; 