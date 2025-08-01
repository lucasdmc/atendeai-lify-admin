-- Corrigir tabela conversation_memory
-- Execute este script no Supabase Dashboard

-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'conversation_memory'
);

-- Recriar tabela com estrutura correta
DROP TABLE IF EXISTS conversation_memory CASCADE;

CREATE TABLE conversation_memory (
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

-- Recriar índices
CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);

-- Recriar trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conversation_memory_updated_at ON conversation_memory;
CREATE TRIGGER trigger_update_conversation_memory_updated_at
    BEFORE UPDATE ON conversation_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verificar se foi criada corretamente
SELECT 'Tabela conversation_memory criada com sucesso!' as status; 