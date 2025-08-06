-- Script para adicionar campo clinic_id à tabela whatsapp_conversations
-- Execute via Supabase Dashboard SQL Editor

-- 1. Adicionar campo clinic_id à tabela whatsapp_conversations
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- 2. Verificar se o campo foi adicionado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_conversations' 
  AND column_name = 'clinic_id';

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id 
ON public.whatsapp_conversations(clinic_id);

-- 4. Verificar conversas existentes
SELECT 
  id,
  phone_number,
  name,
  clinic_id,
  created_at
FROM public.whatsapp_conversations 
ORDER BY created_at DESC 
LIMIT 10; 