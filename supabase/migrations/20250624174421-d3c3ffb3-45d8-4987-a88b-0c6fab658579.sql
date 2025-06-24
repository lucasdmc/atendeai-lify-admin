
-- Adicionar colunas na tabela whatsapp_conversations para controlar loops
ALTER TABLE whatsapp_conversations 
ADD COLUMN IF NOT EXISTS escalated_to_human BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS escalation_reason TEXT,
ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS loop_counter INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_ai_response TEXT,
ADD COLUMN IF NOT EXISTS consecutive_same_responses INTEGER DEFAULT 0;

-- Criar tabela para logs de eventos de loop
CREATE TABLE IF NOT EXISTS whatsapp_loop_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES whatsapp_conversations(id) NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('loop_detected', 'escalated_to_human', 'response_varied')),
  message_content TEXT,
  ai_response TEXT,
  loop_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_loop_events_conversation_id ON whatsapp_loop_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_loop_events_event_type ON whatsapp_loop_events(event_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_escalated ON whatsapp_conversations(escalated_to_human);

-- Habilitar RLS na nova tabela
ALTER TABLE whatsapp_loop_events ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de eventos de loop (para o sistema)
CREATE POLICY "Allow system to insert loop events" 
  ON whatsapp_loop_events 
  FOR INSERT 
  WITH CHECK (true);

-- Política para permitir leitura de eventos de loop para usuários autenticados
CREATE POLICY "Allow authenticated users to read loop events" 
  ON whatsapp_loop_events 
  FOR SELECT 
  USING (auth.role() = 'authenticated');
