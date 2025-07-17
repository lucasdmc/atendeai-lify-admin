-- Script para limpar TODAS as sessões antigas do WhatsApp
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Verificar todas as conexões atuais
SELECT 
  awc.id,
  awc.agent_id,
  a.name as agent_name,
  awc.whatsapp_number,
  awc.whatsapp_name,
  awc.connection_status,
  awc.created_at,
  awc.updated_at
FROM agent_whatsapp_connections awc
LEFT JOIN agents a ON awc.agent_id = a.id
ORDER BY awc.created_at DESC;

-- 2. DELETAR TODAS as conexões (limpeza completa)
DELETE FROM agent_whatsapp_connections;

-- 3. Verificar se foi limpo
SELECT COUNT(*) as total_connections FROM agent_whatsapp_connections;

-- 4. Verificar agentes disponíveis
SELECT 
  a.id,
  a.name,
  a.clinic_id
FROM agents a
ORDER BY a.name; 