
-- Criar tabela para memória conversacional do WhatsApp
CREATE TABLE public.whatsapp_conversation_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índice para busca eficiente por número de telefone
CREATE INDEX idx_whatsapp_memory_phone ON public.whatsapp_conversation_memory(phone_number);

-- Criar índice para busca por dados específicos na memória
CREATE INDEX idx_whatsapp_memory_data ON public.whatsapp_conversation_memory USING GIN(memory_data);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_whatsapp_memory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_whatsapp_memory_timestamp_trigger
  BEFORE UPDATE ON public.whatsapp_conversation_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_memory_timestamp();

-- Política RLS (opcional - permite acesso geral para o sistema)
ALTER TABLE public.whatsapp_conversation_memory ENABLE ROW LEVEL SECURITY;

-- Política que permite acesso completo ao sistema (service role)
CREATE POLICY "Allow full access to whatsapp memory" 
ON public.whatsapp_conversation_memory 
FOR ALL 
USING (true) 
WITH CHECK (true);
