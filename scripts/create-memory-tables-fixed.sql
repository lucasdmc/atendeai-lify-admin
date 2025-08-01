-- Tabela para memória de conversas
CREATE TABLE IF NOT EXISTS conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(100),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 0,
    last_intent VARCHAR(100),
    conversation_flow JSONB DEFAULT '[]',
    topics TEXT[] DEFAULT '{}',
    appointment_data JSONB DEFAULT '{}',
    frustration_level INTEGER DEFAULT 0,
    loop_count INTEGER DEFAULT 0,
    memory_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para mensagens individuais (NOME ÚNICO)
CREATE TABLE IF NOT EXISTS ai_whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_messages_phone ON ai_whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_messages_created ON ai_whatsapp_messages(created_at);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para conversation_memory
DROP TRIGGER IF EXISTS trigger_update_conversation_memory_updated_at ON conversation_memory;
CREATE TRIGGER trigger_update_conversation_memory_updated_at
    BEFORE UPDATE ON conversation_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 