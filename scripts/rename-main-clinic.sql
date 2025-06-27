-- Script para renomear a Clínica Principal para "Admin Lify"
-- Execute este script diretamente no editor SQL do Supabase

-- 1. Verificar a clínica atual
SELECT id, name, email, phone, address, city, state, is_active, created_at
FROM clinics 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 2. Atualizar o nome da clínica para "Admin Lify"
UPDATE clinics 
SET 
  name = 'Admin Lify',
  email = 'admin@lify.com',
  phone = '+55 (11) 99999-9999',
  address = 'Sede Administrativa Lify',
  city = 'São Paulo',
  state = 'SP',
  is_active = true
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. Verificar a atualização
SELECT id, name, email, phone, address, city, state, is_active, created_at
FROM clinics 
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 4. Verificar todas as clínicas
SELECT id, name, email, city, state, is_active, created_at
FROM clinics 
ORDER BY created_at; 