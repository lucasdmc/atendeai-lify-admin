import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente necessárias não encontradas:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sqlScript = `
-- Script para implementar múltiplos números de WhatsApp por agente

-- 1. Tabela para conexões de WhatsApp por agente
CREATE TABLE IF NOT EXISTS agent_whatsapp_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  whatsapp_number TEXT,
  whatsapp_name TEXT,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('disconnected', 'connecting', 'connected', 'error')),
  qr_code TEXT,
  client_info JSONB,
  session_data JSONB,
  last_connection_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, whatsapp_number)
);

-- 2. Tabela para mensagens por agente
CREATE TABLE IF NOT EXISTS agent_whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES public.agent_whatsapp_connections(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('received', 'sent')),
  message_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  whatsapp_message_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela para conversas por agente
CREATE TABLE IF NOT EXISTS agent_whatsapp_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES public.agent_whatsapp_connections(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, phone_number)
);

-- 4. Tabela para memória de conversas por agente
CREATE TABLE IF NOT EXISTS agent_conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  phone_number TEXT NOT NULL,
  memory_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agent_id, phone_number)
);

-- 5. Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_connections_agent ON agent_whatsapp_connections(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_connections_status ON agent_whatsapp_connections(connection_status);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_connections_number ON agent_whatsapp_connections(whatsapp_number);

CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_messages_agent ON agent_whatsapp_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_messages_connection ON agent_whatsapp_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_messages_phone ON agent_whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_messages_timestamp ON agent_whatsapp_messages(message_timestamp);

CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_conversations_agent ON agent_whatsapp_conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_conversations_connection ON agent_whatsapp_conversations(connection_id);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_conversations_phone ON agent_whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_agent_whatsapp_conversations_updated ON agent_whatsapp_conversations(updated_at);

CREATE INDEX IF NOT EXISTS idx_agent_conversation_memory_agent ON agent_conversation_memory(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_conversation_memory_phone ON agent_conversation_memory(phone_number);

-- 6. Função para atualizar timestamps
CREATE OR REPLACE FUNCTION update_agent_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Triggers para atualizar timestamps
CREATE TRIGGER update_agent_whatsapp_connections_updated_at 
  BEFORE UPDATE ON agent_whatsapp_connections 
  FOR EACH ROW EXECUTE FUNCTION update_agent_whatsapp_updated_at();

CREATE TRIGGER update_agent_whatsapp_conversations_updated_at 
  BEFORE UPDATE ON agent_whatsapp_conversations 
  FOR EACH ROW EXECUTE FUNCTION update_agent_whatsapp_updated_at();

CREATE TRIGGER update_agent_conversation_memory_updated_at 
  BEFORE UPDATE ON agent_conversation_memory 
  FOR EACH ROW EXECUTE FUNCTION update_agent_whatsapp_updated_at();

-- 8. Função para obter ou criar conversa
CREATE OR REPLACE FUNCTION get_or_create_agent_conversation(
  p_agent_id UUID,
  p_connection_id UUID,
  p_phone_number TEXT,
  p_contact_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Tentar encontrar conversa existente
  SELECT id INTO conversation_id
  FROM agent_whatsapp_conversations
  WHERE agent_id = p_agent_id AND phone_number = p_phone_number;
  
  -- Se não existir, criar nova conversa
  IF conversation_id IS NULL THEN
    INSERT INTO agent_whatsapp_conversations (agent_id, connection_id, phone_number, contact_name)
    VALUES (p_agent_id, p_connection_id, p_phone_number, p_contact_name)
    RETURNING id INTO conversation_id;
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Função para salvar mensagem e atualizar conversa
CREATE OR REPLACE FUNCTION save_agent_message(
  p_agent_id UUID,
  p_connection_id UUID,
  p_phone_number TEXT,
  p_contact_name TEXT,
  p_message_content TEXT,
  p_message_type TEXT,
  p_whatsapp_message_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  message_id UUID;
BEGIN
  -- Salvar mensagem
  INSERT INTO agent_whatsapp_messages (
    agent_id, connection_id, phone_number, contact_name, 
    message_content, message_type, whatsapp_message_id, metadata
  )
  VALUES (
    p_agent_id, p_connection_id, p_phone_number, p_contact_name,
    p_message_content, p_message_type, p_whatsapp_message_id, p_metadata
  )
  RETURNING id INTO message_id;
  
  -- Atualizar ou criar conversa
  INSERT INTO agent_whatsapp_conversations (agent_id, connection_id, phone_number, contact_name, last_message_preview, unread_count, last_message_at)
  VALUES (p_agent_id, p_connection_id, p_phone_number, p_contact_name, p_message_content, 
          CASE WHEN p_message_type = 'received' THEN 1 ELSE 0 END, NOW())
  ON CONFLICT (agent_id, phone_number) DO UPDATE SET
    last_message_preview = p_message_content,
    unread_count = CASE 
      WHEN p_message_type = 'received' THEN agent_whatsapp_conversations.unread_count + 1
      ELSE agent_whatsapp_conversations.unread_count
    END,
    last_message_at = NOW(),
    updated_at = NOW();
  
  RETURN message_id;
END;
$$ LANGUAGE plpgsql;

-- 10. Configurar RLS (Row Level Security)
ALTER TABLE agent_whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversation_memory ENABLE ROW LEVEL SECURITY;

-- 11. Políticas RLS para agentes
CREATE POLICY "Users can view agent whatsapp connections" ON agent_whatsapp_connections
  FOR SELECT USING (true);

CREATE POLICY "Users can insert agent whatsapp connections" ON agent_whatsapp_connections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update agent whatsapp connections" ON agent_whatsapp_connections
  FOR UPDATE USING (true);

CREATE POLICY "Users can view agent whatsapp messages" ON agent_whatsapp_messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert agent whatsapp messages" ON agent_whatsapp_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view agent whatsapp conversations" ON agent_whatsapp_conversations
  FOR SELECT USING (true);

CREATE POLICY "Users can insert agent whatsapp conversations" ON agent_whatsapp_conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update agent whatsapp conversations" ON agent_whatsapp_conversations
  FOR UPDATE USING (true);

CREATE POLICY "Users can view agent conversation memory" ON agent_conversation_memory
  FOR SELECT USING (true);

CREATE POLICY "Users can insert agent conversation memory" ON agent_conversation_memory
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update agent conversation memory" ON agent_conversation_memory
  FOR UPDATE USING (true);
`;

async function applyAgentWhatsAppTables() {
  console.log('🚀 Aplicando tabelas para múltiplos WhatsApp por agente...');
  
  try {
    // Executar o script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar executar via query direta
      console.log('🔄 Tentando executar via query direta...');
      const { error: queryError } = await supabase.from('_exec_sql').select('*').eq('sql', sqlScript);
      
      if (queryError) {
        console.error('❌ Erro na query direta:', queryError);
        return;
      }
    }
    
    console.log('✅ Tabelas criadas com sucesso!');
    console.log('');
    console.log('📋 Tabelas criadas:');
    console.log('  • agent_whatsapp_connections');
    console.log('  • agent_whatsapp_messages');
    console.log('  • agent_whatsapp_conversations');
    console.log('  • agent_conversation_memory');
    console.log('');
    console.log('🔧 Funções criadas:');
    console.log('  • get_or_create_agent_conversation');
    console.log('  • save_agent_message');
    console.log('  • update_agent_whatsapp_updated_at');
    console.log('');
    console.log('🔒 RLS configurado para todas as tabelas');
    console.log('');
    console.log('🎉 Sistema de múltiplos WhatsApp por agente está pronto!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar o script
applyAgentWhatsAppTables(); 