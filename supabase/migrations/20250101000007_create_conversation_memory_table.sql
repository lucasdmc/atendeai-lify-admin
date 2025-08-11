-- Migration para criar a tabela conversation_memory com estrutura correta
-- Execute: supabase db push --linked --include-all

-- Tabela para memória de conversas do WhatsApp
CREATE TABLE IF NOT EXISTS public.conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  user_name TEXT, -- Nome do usuário (pode ser JSON string ou texto direto)
  memory_data JSONB NOT NULL DEFAULT '{}', -- Histórico e dados da conversa
  last_interaction TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON public.conversation_memory(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_last_interaction ON public.conversation_memory(last_interaction);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_updated_at ON public.conversation_memory(updated_at);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_conversation_memory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar timestamp
CREATE TRIGGER update_conversation_memory_updated_at 
  BEFORE UPDATE ON public.conversation_memory 
  FOR EACH ROW EXECUTE FUNCTION update_conversation_memory_updated_at();

-- Habilitar Row Level Security
ALTER TABLE public.conversation_memory ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view conversation memory" ON public.conversation_memory
  FOR SELECT USING (true);

CREATE POLICY "Users can insert conversation memory" ON public.conversation_memory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update conversation memory" ON public.conversation_memory
  FOR UPDATE USING (true);

-- Comentários para documentação
COMMENT ON TABLE public.conversation_memory IS 'Tabela para armazenar memória de conversas do WhatsApp';
COMMENT ON COLUMN public.conversation_memory.phone_number IS 'Número de telefone do usuário (único)';
COMMENT ON COLUMN public.conversation_memory.user_name IS 'Nome do usuário (pode ser JSON string ou texto direto)';
COMMENT ON COLUMN public.conversation_memory.memory_data IS 'Dados da memória incluindo histórico de conversas e perfil do usuário';
COMMENT ON COLUMN public.conversation_memory.last_interaction IS 'Timestamp da última interação';
