-- Script para corrigir o sistema WhatsApp
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

-- 2. Marcar todas as conexões como desconectadas (já que o backend está desconectado)
UPDATE agent_whatsapp_connections 
SET 
  connection_status = 'disconnected',
  updated_at = NOW()
WHERE connection_status = 'connected';

-- 3. Deletar conexões antigas (mais de 24h) que estão desconectadas
DELETE FROM agent_whatsapp_connections 
WHERE 
  connection_status = 'disconnected' 
  AND created_at < NOW() - INTERVAL '24 hours';

-- 4. Verificar resultado final
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

-- 5. Contar conexões por status
SELECT 
  connection_status,
  COUNT(*) as total
FROM agent_whatsapp_connections 
GROUP BY connection_status;

-- 6. Verificar se há agentes sem conexões
SELECT 
  a.id,
  a.name,
  COUNT(awc.id) as connection_count
FROM agents a
LEFT JOIN agent_whatsapp_connections awc ON a.id = awc.agent_id
GROUP BY a.id, a.name
ORDER BY connection_count DESC; 