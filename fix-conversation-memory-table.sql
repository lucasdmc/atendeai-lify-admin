-- Corrigir tabela conversation_memory
-- Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_memory'
    ) THEN
        DROP TABLE IF EXISTS conversation_memory CASCADE;
    END IF;
END $$;

-- Recriar tabela conversation_memory com estrutura correta
CREATE TABLE conversation_memory (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    last_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    first_interaction TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    interaction_count INTEGER DEFAULT 0,
    last_intent VARCHAR(255),
    conversation_flow JSONB DEFAULT '[]'::jsonb,
    topics JSONB DEFAULT '[]'::jsonb,
    appointment_data JSONB DEFAULT '{}'::jsonb,
    frustration_level INTEGER DEFAULT 0,
    loop_count INTEGER DEFAULT 0,
    memory_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_last_interaction ON conversation_memory(last_interaction);

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_conversation_memory_updated_at ON conversation_memory;
CREATE TRIGGER trigger_update_conversation_memory_updated_at
    BEFORE UPDATE ON conversation_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
DROP POLICY IF EXISTS "Users can view conversation memory" ON conversation_memory;
CREATE POLICY "Users can view conversation memory" ON conversation_memory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert conversation memory" ON conversation_memory;
CREATE POLICY "Users can insert conversation memory" ON conversation_memory FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update conversation memory" ON conversation_memory;
CREATE POLICY "Users can update conversation memory" ON conversation_memory FOR UPDATE USING (true);

-- Criar tabela ai_whatsapp_messages se não existir
CREATE TABLE IF NOT EXISTS ai_whatsapp_messages (
    id SERIAL PRIMARY KEY,
    phone_number VARCHAR(20) NOT NULL,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para ai_whatsapp_messages
CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_messages_phone ON ai_whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_messages_created_at ON ai_whatsapp_messages(created_at);

-- Habilitar RLS para ai_whatsapp_messages
ALTER TABLE ai_whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para ai_whatsapp_messages
DROP POLICY IF EXISTS "Users can view ai whatsapp messages" ON ai_whatsapp_messages;
CREATE POLICY "Users can view ai whatsapp messages" ON ai_whatsapp_messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert ai whatsapp messages" ON ai_whatsapp_messages;
CREATE POLICY "Users can insert ai whatsapp messages" ON ai_whatsapp_messages FOR INSERT WITH CHECK (true);

SELECT 'Tabela conversation_memory criada com sucesso!' as status; 