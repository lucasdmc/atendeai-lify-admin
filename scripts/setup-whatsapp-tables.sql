-- Script para configurar as tabelas do WhatsApp
-- Execute este script no Supabase SQL Editor

-- 1. Tabela de conversas do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  formatted_phone_number TEXT,
  country_code TEXT,
  name TEXT,
  email TEXT,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela de mensagens do WhatsApp
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('received', 'sent')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  whatsapp_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela de memória de conversas (para IA)
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de base de conhecimento da clínica
CREATE TABLE IF NOT EXISTS public.clinic_knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  importance INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Tabela de interações de IA
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT,
  messages JSONB,
  response TEXT,
  model TEXT,
  tokens_used INTEGER,
  intent TEXT,
  confidence DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Tabela de perfis de personalização
CREATE TABLE IF NOT EXISTS public.user_personalization_profiles (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  behavior_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Tabela de ferramentas disponíveis
CREATE TABLE IF NOT EXISTS public.ai_tools (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  parameters JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Tabela de logs de escalação
CREATE TABLE IF NOT EXISTS public.escalation_logs (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  phone_number TEXT,
  reason TEXT,
  intent TEXT,
  frustration_level DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_updated ON public.whatsapp_conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON public.whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON public.whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON public.whatsapp_conversation_memory(phone_number);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.clinic_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON public.clinic_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_phone ON public.ai_interactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON public.ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_personalization_phone ON public.user_personalization_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_escalation_conversation ON public.escalation_logs(conversation_id);

-- Inserir dados iniciais na base de conhecimento
INSERT INTO public.clinic_knowledge_base (title, content, category, tags, importance) VALUES
('Horário de Funcionamento', 'Nossa clínica funciona de segunda a sexta das 8h às 18h, e aos sábados das 8h às 12h.', 'horarios', ARRAY['horario', 'funcionamento', 'atendimento'], 5),
('Política de Cancelamento', 'Agendamentos podem ser cancelados até 24 horas antes da consulta sem custo adicional.', 'politicas', ARRAY['cancelamento', 'politica', 'agendamento'], 4),
('Formas de Pagamento', 'Aceitamos dinheiro, cartões de crédito e débito, PIX e principais convênios médicos.', 'pagamento', ARRAY['pagamento', 'convênio', 'cartão'], 3),
('Primeira Consulta', 'Na primeira consulta, traga documento de identidade e, se possível, exames anteriores.', 'atendimento', ARRAY['primeira', 'consulta', 'documentos'], 4),
('Reagendamento', 'Para reagendar uma consulta, entre em contato com pelo menos 24 horas de antecedência.', 'agendamento', ARRAY['reagendamento', 'alteração', 'horário'], 3)
ON CONFLICT DO NOTHING;

-- Inserir ferramentas disponíveis
INSERT INTO public.ai_tools (name, description, parameters) VALUES
('create_appointment', 'Criar novo agendamento', '{"title": "string", "date": "string", "start_time": "string", "end_time": "string", "email": "string", "location": "string"}'),
('list_appointments', 'Listar agendamentos do paciente', '{"phone_number": "string", "date": "string"}'),
('cancel_appointment', 'Cancelar agendamento existente', '{"appointment_id": "string", "reason": "string"}'),
('check_availability', 'Verificar disponibilidade de horários', '{"date": "string", "specialty": "string"}'),
('escalate_to_human', 'Transferir para atendente humano', '{"reason": "string", "urgency": "string"}')
ON CONFLICT DO NOTHING;

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps
DROP TRIGGER IF EXISTS update_whatsapp_conversations_updated_at ON public.whatsapp_conversations;
CREATE TRIGGER update_whatsapp_conversations_updated_at 
  BEFORE UPDATE ON public.whatsapp_conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_memory_updated_at ON public.whatsapp_conversation_memory;
CREATE TRIGGER update_conversation_memory_updated_at 
  BEFORE UPDATE ON public.whatsapp_conversation_memory 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON public.clinic_knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at 
  BEFORE UPDATE ON public.clinic_knowledge_base 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_personalization_updated_at ON public.user_personalization_profiles;
CREATE TRIGGER update_personalization_updated_at 
  BEFORE UPDATE ON public.user_personalization_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para buscar contexto RAG
CREATE OR REPLACE FUNCTION search_clinic_knowledge(query_text TEXT, limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  content TEXT,
  category TEXT,
  relevance_score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kb.id,
    kb.title,
    kb.content,
    kb.category,
    ts_rank(to_tsvector('portuguese', kb.title || ' ' || kb.content), plainto_tsquery('portuguese', query_text)) as relevance_score
  FROM public.clinic_knowledge_base kb
  WHERE to_tsvector('portuguese', kb.title || ' ' || kb.content) @@ plainto_tsquery('portuguese', query_text)
  ORDER BY relevance_score DESC, kb.importance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Configurar RLS (Row Level Security)
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_personalization_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para WhatsApp
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

-- Comentários para documentação
COMMENT ON TABLE public.whatsapp_conversations IS 'Conversas do WhatsApp Business';
COMMENT ON TABLE public.whatsapp_messages IS 'Mensagens das conversas do WhatsApp';
COMMENT ON TABLE public.whatsapp_conversation_memory IS 'Memória de conversas para contexto e personalização';
COMMENT ON TABLE public.clinic_knowledge_base IS 'Base de conhecimento da clínica para RAG';
COMMENT ON TABLE public.ai_interactions IS 'Log de todas as interações com IA para análise';
COMMENT ON TABLE public.user_personalization_profiles IS 'Perfis de personalização dos usuários';
COMMENT ON TABLE public.ai_tools IS 'Ferramentas disponíveis para o assistente virtual';
COMMENT ON TABLE public.escalation_logs IS 'Log de escalações para atendente humano';

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_name IN (
  'whatsapp_conversations',
  'whatsapp_messages',
  'whatsapp_conversation_memory',
  'clinic_knowledge_base', 
  'ai_interactions',
  'user_personalization_profiles',
  'ai_tools',
  'escalation_logs'
)
AND table_schema = 'public'; 