-- Tabela para memória persistente de conversas
CREATE TABLE IF NOT EXISTS conversation_memory (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  user_name VARCHAR(100),
  first_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_interaction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_interactions INTEGER DEFAULT 0,
  conversation_context JSONB DEFAULT '{}',
  user_profile JSONB DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por número
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);

-- Função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_conversation_memory_updated_at ON conversation_memory;
CREATE TRIGGER update_conversation_memory_updated_at 
    BEFORE UPDATE ON conversation_memory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para buscar ou criar memória
CREATE OR REPLACE FUNCTION get_or_create_memory(p_phone_number VARCHAR)
RETURNS TABLE(
  id INTEGER,
  phone_number VARCHAR,
  user_name VARCHAR,
  first_interaction TIMESTAMP,
  last_interaction TIMESTAMP,
  total_interactions INTEGER,
  conversation_context JSONB,
  user_profile JSONB,
  conversation_history JSONB,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  INSERT INTO conversation_memory (phone_number, user_profile, conversation_context)
  VALUES (p_phone_number, '{"name": null, "preferences": {}}', '{"last_intent": null, "appointment_data": {}, "frustration_level": 0}')
  ON CONFLICT (phone_number) DO UPDATE SET
    last_interaction = CURRENT_TIMESTAMP,
    total_interactions = conversation_memory.total_interactions + 1
  RETURNING 
    conversation_memory.id,
    conversation_memory.phone_number,
    conversation_memory.user_name,
    conversation_memory.first_interaction,
    conversation_memory.last_interaction,
    conversation_memory.total_interactions,
    conversation_memory.conversation_context,
    conversation_memory.user_profile,
    conversation_memory.conversation_history,
    conversation_memory.is_active;
END;
$$ LANGUAGE plpgsql;

-- Função para salvar interação
CREATE OR REPLACE FUNCTION save_interaction(
  p_phone_number VARCHAR,
  p_user_message TEXT,
  p_bot_response TEXT,
  p_intent VARCHAR,
  p_entities JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_memory 
  SET 
    conversation_history = conversation_history || jsonb_build_object(
      'timestamp', CURRENT_TIMESTAMP,
      'user_message', p_user_message,
      'bot_response', p_bot_response,
      'intent', p_intent,
      'entities', p_entities
    ),
    conversation_context = conversation_context || jsonb_build_object('last_intent', p_intent),
    last_interaction = CURRENT_TIMESTAMP,
    total_interactions = total_interactions + 1
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar perfil do usuário
CREATE OR REPLACE FUNCTION update_user_profile(
  p_phone_number VARCHAR,
  p_user_name VARCHAR DEFAULT NULL,
  p_preferences JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_memory 
  SET 
    user_name = COALESCE(p_user_name, user_name),
    user_profile = user_profile || jsonb_build_object(
      'name', COALESCE(p_user_name, user_name),
      'preferences', COALESCE(p_preferences, user_profile->'preferences')
    )
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;

-- Função para buscar contexto de conversa
CREATE OR REPLACE FUNCTION get_conversation_context(p_phone_number VARCHAR)
RETURNS TABLE(
  is_first_conversation BOOLEAN,
  days_since_last_interaction INTEGER,
  total_interactions INTEGER,
  user_name VARCHAR,
  last_intent VARCHAR,
  recent_interactions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (total_interactions <= 1) as is_first_conversation,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_interaction))::INTEGER as days_since_last_interaction,
    total_interactions,
    user_name,
    conversation_context->>'last_intent' as last_intent,
    conversation_history as recent_interactions
  FROM conversation_memory 
  WHERE phone_number = p_phone_number;
END;
$$ LANGUAGE plpgsql;

-- Verificar se tudo foi criado
SELECT 'Tabela conversation_memory criada com sucesso!' as status;
SELECT 'Funções criadas com sucesso!' as status; 