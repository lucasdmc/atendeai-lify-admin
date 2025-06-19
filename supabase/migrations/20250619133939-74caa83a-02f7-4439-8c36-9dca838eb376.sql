
-- Atualizar a tabela de contextualização para suportar JSON estruturado
ALTER TABLE public.contextualization_data 
ADD COLUMN IF NOT EXISTS knowledge_base JSONB;

-- Criar uma tabela para armazenar o contexto final consolidado
CREATE TABLE IF NOT EXISTS public.clinic_knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID,
  knowledge_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Atualizar tabela de conversas para melhor formatação
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS formatted_phone_number TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS last_message_preview TEXT,
ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0;

-- Função para extrair código do país do número de telefone
CREATE OR REPLACE FUNCTION extract_country_code(phone_number TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove caracteres especiais e @s.whatsapp.net
  phone_number := regexp_replace(phone_number, '[^0-9]', '', 'g');
  
  -- Detectar códigos de países comuns
  IF phone_number LIKE '55%' THEN RETURN 'BR'; -- Brasil
  ELSIF phone_number LIKE '1%' THEN RETURN 'US'; -- EUA/Canadá
  ELSIF phone_number LIKE '44%' THEN RETURN 'GB'; -- Reino Unido
  ELSIF phone_number LIKE '49%' THEN RETURN 'DE'; -- Alemanha
  ELSIF phone_number LIKE '33%' THEN RETURN 'FR'; -- França
  ELSIF phone_number LIKE '39%' THEN RETURN 'IT'; -- Itália
  ELSIF phone_number LIKE '34%' THEN RETURN 'ES'; -- Espanha
  ELSIF phone_number LIKE '351%' THEN RETURN 'PT'; -- Portugal
  ELSIF phone_number LIKE '54%' THEN RETURN 'AR'; -- Argentina
  ELSE RETURN 'XX'; -- Desconhecido
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para formatar número de telefone brasileiro
CREATE OR REPLACE FUNCTION format_phone_number(phone_number TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned_number TEXT;
  country_code TEXT;
BEGIN
  -- Remove @s.whatsapp.net e outros caracteres
  cleaned_number := regexp_replace(phone_number, '@s\.whatsapp\.net|[^0-9]', '', 'g');
  
  -- Se for número brasileiro (55)
  IF cleaned_number LIKE '55%' THEN
    IF length(cleaned_number) = 13 THEN -- 55 + 2 dígitos DDD + 9 dígitos
      RETURN '+' || substring(cleaned_number, 1, 2) || ' (' || 
             substring(cleaned_number, 3, 2) || ') ' ||
             substring(cleaned_number, 5, 5) || '-' ||
             substring(cleaned_number, 10, 4);
    ELSIF length(cleaned_number) = 12 THEN -- 55 + 2 dígitos DDD + 8 dígitos
      RETURN '+' || substring(cleaned_number, 1, 2) || ' (' || 
             substring(cleaned_number, 3, 2) || ') ' ||
             substring(cleaned_number, 5, 4) || '-' ||
             substring(cleaned_number, 9, 4);
    END IF;
  END IF;
  
  -- Para outros países, retorna com código do país
  RETURN '+' || cleaned_number;
END;
$$ LANGUAGE plpgsql;

-- Atualizar conversas existentes com números formatados
UPDATE public.whatsapp_conversations 
SET 
  formatted_phone_number = format_phone_number(phone_number),
  country_code = extract_country_code(phone_number)
WHERE formatted_phone_number IS NULL;
