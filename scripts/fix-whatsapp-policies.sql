-- Script para corrigir as políticas RLS do WhatsApp
-- Execute este script no Supabase SQL Editor

-- Remover políticas existentes do WhatsApp
DROP POLICY IF EXISTS "Users can view whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can insert whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can update whatsapp conversations" ON public.whatsapp_conversations;

DROP POLICY IF EXISTS "Users can view whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert whatsapp messages" ON public.whatsapp_messages;

DROP POLICY IF EXISTS "Users can view conversation memory" ON public.whatsapp_conversation_memory;
DROP POLICY IF EXISTS "Users can insert conversation memory" ON public.whatsapp_conversation_memory;
DROP POLICY IF EXISTS "Users can update conversation memory" ON public.whatsapp_conversation_memory;

DROP POLICY IF EXISTS "Users can view knowledge base" ON public.clinic_knowledge_base;

DROP POLICY IF EXISTS "Users can view ai interactions" ON public.ai_interactions;
DROP POLICY IF EXISTS "Users can insert ai interactions" ON public.ai_interactions;

DROP POLICY IF EXISTS "Users can view personalization profiles" ON public.user_personalization_profiles;
DROP POLICY IF EXISTS "Users can insert personalization profiles" ON public.user_personalization_profiles;
DROP POLICY IF EXISTS "Users can update personalization profiles" ON public.user_personalization_profiles;

DROP POLICY IF EXISTS "Users can view ai tools" ON public.ai_tools;

DROP POLICY IF EXISTS "Users can view escalation logs" ON public.escalation_logs;
DROP POLICY IF EXISTS "Users can insert escalation logs" ON public.escalation_logs;

-- Recriar políticas RLS para WhatsApp
CREATE POLICY "Users can view whatsapp conversations" ON public.whatsapp_conversations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert whatsapp conversations" ON public.whatsapp_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update whatsapp conversations" ON public.whatsapp_conversations
  FOR UPDATE USING (true);

CREATE POLICY "Users can view whatsapp messages" ON public.whatsapp_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert whatsapp messages" ON public.whatsapp_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view conversation memory" ON public.whatsapp_conversation_memory
  FOR SELECT USING (true);

CREATE POLICY "Users can insert conversation memory" ON public.whatsapp_conversation_memory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversation memory" ON public.whatsapp_conversation_memory
  FOR UPDATE USING (true);

CREATE POLICY "Users can view knowledge base" ON public.clinic_knowledge_base
  FOR SELECT USING (true);

CREATE POLICY "Users can view ai interactions" ON public.ai_interactions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert ai interactions" ON public.ai_interactions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view personalization profiles" ON public.user_personalization_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert personalization profiles" ON public.user_personalization_profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update personalization profiles" ON public.user_personalization_profiles
  FOR UPDATE USING (true);

CREATE POLICY "Users can view ai tools" ON public.ai_tools
  FOR SELECT USING (true);

CREATE POLICY "Users can view escalation logs" ON public.escalation_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert escalation logs" ON public.escalation_logs
  FOR INSERT WITH CHECK (true);

-- Verificar se as políticas foram criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename LIKE '%whatsapp%' 
   OR tablename LIKE '%ai_%' 
   OR tablename LIKE '%clinic_%' 
   OR tablename LIKE '%escalation%'
ORDER BY tablename, policyname; 