-- Migration para adicionar campo clinic_id à tabela whatsapp_conversations
-- Execute: supabase db push --linked

-- 1. Adicionar campo clinic_id à tabela whatsapp_conversations
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL;

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_clinic_id 
ON public.whatsapp_conversations(clinic_id);

-- 3. Verificar se o campo foi adicionado
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'whatsapp_conversations' 
  AND column_name = 'clinic_id'; 