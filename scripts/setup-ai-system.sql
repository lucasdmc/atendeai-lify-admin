-- Script para configurar o sistema de IA refatorado
-- Execute este script no Supabase SQL Editor

-- 1. Tabela para memória de conversas
CREATE TABLE IF NOT EXISTS whatsapp_conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela para base de conhecimento da clínica
CREATE TABLE IF NOT EXISTS clinic_knowledge_base (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  importance INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela para interações de IA
CREATE TABLE IF NOT EXISTS ai_interactions (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT,
  messages JSONB,
  response TEXT,
  model TEXT,
  tokens_used INTEGER,
  intent TEXT,
  confidence DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela para perfis de personalização
CREATE TABLE IF NOT EXISTS user_personalization_profiles (
  id BIGSERIAL PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  profile_data JSONB NOT NULL DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  behavior_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela para ferramentas disponíveis
CREATE TABLE IF NOT EXISTS ai_tools (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  parameters JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela para logs de escalação
CREATE TABLE IF NOT EXISTS escalation_logs (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  phone_number TEXT,
  reason TEXT,
  intent TEXT,
  frustration_level DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON whatsapp_conversation_memory(phone_number);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON clinic_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON clinic_knowledge_base USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_phone ON ai_interactions(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created ON ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_personalization_phone ON user_personalization_profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_escalation_conversation ON escalation_logs(conversation_id);

-- Inserir dados iniciais na base de conhecimento
INSERT INTO clinic_knowledge_base (title, content, category, tags, importance) VALUES
('Horário de Funcionamento', 'Nossa clínica funciona de segunda a sexta das 8h às 18h, e aos sábados das 8h às 12h.', 'horarios', ARRAY['horario', 'funcionamento', 'atendimento'], 5),
('Política de Cancelamento', 'Agendamentos podem ser cancelados até 24 horas antes da consulta sem custo adicional.', 'politicas', ARRAY['cancelamento', 'politica', 'agendamento'], 4),
('Formas de Pagamento', 'Aceitamos dinheiro, cartões de crédito e débito, PIX e principais convênios médicos.', 'pagamento', ARRAY['pagamento', 'convênio', 'cartão'], 3),
('Primeira Consulta', 'Na primeira consulta, traga documento de identidade e, se possível, exames anteriores.', 'atendimento', ARRAY['primeira', 'consulta', 'documentos'], 4),
('Reagendamento', 'Para reagendar uma consulta, entre em contato com pelo menos 24 horas de antecedência.', 'agendamento', ARRAY['reagendamento', 'alteração', 'horário'], 3);

-- Inserir ferramentas disponíveis
INSERT INTO ai_tools (name, description, parameters) VALUES
('create_appointment', 'Criar novo agendamento', '{"title": "string", "date": "string", "start_time": "string", "end_time": "string", "email": "string", "location": "string"}'),
('list_appointments', 'Listar agendamentos do paciente', '{"phone_number": "string", "date": "string"}'),
('cancel_appointment', 'Cancelar agendamento existente', '{"appointment_id": "string", "reason": "string"}'),
('check_availability', 'Verificar disponibilidade de horários', '{"date": "string", "specialty": "string"}'),
('escalate_to_human', 'Transferir para atendente humano', '{"reason": "string", "urgency": "string"}');

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar timestamps
CREATE TRIGGER update_conversation_memory_updated_at 
  BEFORE UPDATE ON whatsapp_conversation_memory 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at 
  BEFORE UPDATE ON clinic_knowledge_base 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personalization_updated_at 
  BEFORE UPDATE ON user_personalization_profiles 
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
  FROM clinic_knowledge_base kb
  WHERE to_tsvector('portuguese', kb.title || ' ' || kb.content) @@ plainto_tsquery('portuguese', query_text)
  ORDER BY relevance_score DESC, kb.importance DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON TABLE whatsapp_conversation_memory IS 'Armazena memória de conversas para contexto e personalização';
COMMENT ON TABLE clinic_knowledge_base IS 'Base de conhecimento da clínica para RAG';
COMMENT ON TABLE ai_interactions IS 'Log de todas as interações com IA para análise';
COMMENT ON TABLE user_personalization_profiles IS 'Perfis de personalização dos usuários';
COMMENT ON TABLE ai_tools IS 'Ferramentas disponíveis para o assistente virtual';
COMMENT ON TABLE escalation_logs IS 'Log de escalações para atendente humano';

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_name IN (
  'whatsapp_conversation_memory',
  'clinic_knowledge_base', 
  'ai_interactions',
  'user_personalization_profiles',
  'ai_tools',
  'escalation_logs'
)
AND table_schema = 'public'; 