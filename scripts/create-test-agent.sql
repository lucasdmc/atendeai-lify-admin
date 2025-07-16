-- Script para criar um agente de teste
-- Execute este script no Supabase SQL Editor

-- Inserir um agente de teste
INSERT INTO agents (
  id,
  name,
  description,
  personality,
  temperature,
  clinic_id,
  is_active,
  created_at,
  updated_at
) VALUES (
  'test-agent-001',
  'Agente de Teste',
  'Agente criado para testes do sistema WhatsApp',
  'profissional e acolhedor',
  0.7,
  NULL, -- clinic_id (pode ser NULL para teste)
  true,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  personality = EXCLUDED.personality,
  temperature = EXCLUDED.temperature,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Verificar se foi criado
SELECT * FROM agents WHERE id = 'test-agent-001'; 