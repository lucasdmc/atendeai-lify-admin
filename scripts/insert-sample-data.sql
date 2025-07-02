-- Script para inserir dados de exemplo no sistema
-- Execute este script no SQL Editor do Supabase

-- 1. Confirmar email do usuário
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'lucasdmc@lify.com';

-- 2. Criar perfil do usuário
INSERT INTO public.user_profiles (user_id, email, role)
SELECT 
  id as user_id,
  email,
  'admin_lify' as role
FROM auth.users 
WHERE email = 'lucasdmc@lify.com'
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  updated_at = now();

-- 3. Obter ID do usuário
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = 'lucasdmc@lify.com';
    
    -- 4. Criar clínicas de exemplo
    INSERT INTO public.clinics (name, address, phone, email, created_by) VALUES
    ('Clínica Exemplo 1', 'Rua das Flores, 123 - São Paulo, SP', '(11) 99999-9999', 'contato@clinicaexemplo1.com', user_id),
    ('Clínica Exemplo 2', 'Av. Paulista, 456 - São Paulo, SP', '(11) 88888-8888', 'contato@clinicaexemplo2.com', user_id)
    ON CONFLICT DO NOTHING;
    
    -- 5. Criar usuários de exemplo
    INSERT INTO public.users (email, name, role, clinic_id, created_by) 
    SELECT 
        'medico1@exemplo.com',
        'Dr. João Silva',
        'doctor',
        c.id,
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.users (email, name, role, clinic_id, created_by) 
    SELECT 
        'medico2@exemplo.com',
        'Dra. Maria Santos',
        'doctor',
        c.id,
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.users (email, name, role, clinic_id, created_by) 
    SELECT 
        'admin@exemplo.com',
        'Administrador',
        'admin',
        c.id,
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
    -- 6. Criar conversas de exemplo
    INSERT INTO public.conversations (patient_name, patient_phone, clinic_id, status, created_by) 
    SELECT 
        'João da Silva',
        '+5511999999999',
        c.id,
        'active',
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.conversations (patient_name, patient_phone, clinic_id, status, created_by) 
    SELECT 
        'Maria Santos',
        '+5511888888888',
        c.id,
        'active',
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
    -- 7. Criar mensagens de exemplo
    INSERT INTO public.messages (conversation_id, content, sender_type, created_by) 
    SELECT 
        conv.id,
        'Olá, gostaria de agendar uma consulta.',
        'patient',
        user_id
    FROM public.conversations conv
    WHERE conv.patient_name = 'João da Silva'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.messages (conversation_id, content, sender_type, created_by) 
    SELECT 
        conv.id,
        'Claro! Qual especialidade você precisa?',
        'system',
        user_id
    FROM public.conversations conv
    WHERE conv.patient_name = 'João da Silva'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.messages (conversation_id, content, sender_type, created_by) 
    SELECT 
        conv.id,
        'Bom dia, preciso de informações sobre horários.',
        'patient',
        user_id
    FROM public.conversations conv
    WHERE conv.patient_name = 'Maria Santos'
    ON CONFLICT DO NOTHING;
    
    -- 8. Criar agendamentos de exemplo
    INSERT INTO public.appointments (patient_name, patient_phone, doctor_name, clinic_id, appointment_date, appointment_time, status, created_by) 
    SELECT 
        'João da Silva',
        '+5511999999999',
        'Dr. João Silva',
        c.id,
        (CURRENT_DATE + INTERVAL '1 day')::date,
        '14:00',
        'scheduled',
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO public.appointments (patient_name, patient_phone, doctor_name, clinic_id, appointment_date, appointment_time, status, created_by) 
    SELECT 
        'Maria Santos',
        '+5511888888888',
        'Dra. Maria Santos',
        c.id,
        (CURRENT_DATE + INTERVAL '2 days')::date,
        '10:00',
        'scheduled',
        user_id
    FROM public.clinics c 
    WHERE c.name = 'Clínica Exemplo 1'
    ON CONFLICT DO NOTHING;
    
END $$;

-- 9. Verificar dados criados
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as count
FROM public.user_profiles
UNION ALL
SELECT 
    'clinics' as table_name,
    COUNT(*) as count
FROM public.clinics
UNION ALL
SELECT 
    'users' as table_name,
    COUNT(*) as count
FROM public.users
UNION ALL
SELECT 
    'conversations' as table_name,
    COUNT(*) as count
FROM public.conversations
UNION ALL
SELECT 
    'messages' as table_name,
    COUNT(*) as count
FROM public.messages
UNION ALL
SELECT 
    'appointments' as table_name,
    COUNT(*) as count
FROM public.appointments
ORDER BY table_name; 