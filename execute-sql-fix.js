const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurar Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

async function fixConversationMemoryTable() {
  try {
    console.log('🔧 Corrigindo tabela conversation_memory...');

    // SQL para corrigir a tabela
    const sql = `
      -- Verificar se a tabela existe e removê-la
      DROP TABLE IF EXISTS conversation_memory CASCADE;
      
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
    `;

    // Executar SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
      
      // Tentar executar via função SQL direta
      console.log('🔄 Tentando método alternativo...');
      
      // Executar comandos separadamente
      const commands = [
        'DROP TABLE IF EXISTS conversation_memory CASCADE;',
        `CREATE TABLE conversation_memory (
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
        );`,
        'CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);',
        'ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;',
        'DROP POLICY IF EXISTS "Users can view conversation memory" ON conversation_memory;',
        'CREATE POLICY "Users can view conversation memory" ON conversation_memory FOR SELECT USING (true);',
        'DROP POLICY IF EXISTS "Users can insert conversation memory" ON conversation_memory;',
        'CREATE POLICY "Users can insert conversation memory" ON conversation_memory FOR INSERT WITH CHECK (true);',
        'DROP POLICY IF EXISTS "Users can update conversation memory" ON conversation_memory;',
        'CREATE POLICY "Users can update conversation memory" ON conversation_memory FOR UPDATE USING (true);',
        `CREATE TABLE IF NOT EXISTS ai_whatsapp_messages (
          id SERIAL PRIMARY KEY,
          phone_number VARCHAR(20) NOT NULL,
          sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'assistant')),
          content TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        'CREATE INDEX IF NOT EXISTS idx_ai_whatsapp_messages_phone ON ai_whatsapp_messages(phone_number);',
        'ALTER TABLE ai_whatsapp_messages ENABLE ROW LEVEL SECURITY;',
        'DROP POLICY IF EXISTS "Users can view ai whatsapp messages" ON ai_whatsapp_messages;',
        'CREATE POLICY "Users can view ai whatsapp messages" ON ai_whatsapp_messages FOR SELECT USING (true);',
        'DROP POLICY IF EXISTS "Users can insert ai whatsapp messages" ON ai_whatsapp_messages;',
        'CREATE POLICY "Users can insert ai whatsapp messages" ON ai_whatsapp_messages FOR INSERT WITH CHECK (true);'
      ];

      for (const command of commands) {
        try {
          const { error: cmdError } = await supabase.rpc('exec_sql', { sql_query: command });
          if (cmdError) {
            console.log(`⚠️ Comando ignorado (pode já existir): ${command.substring(0, 50)}...`);
          }
        } catch (e) {
          console.log(`⚠️ Comando ignorado: ${command.substring(0, 50)}...`);
        }
      }
    } else {
      console.log('✅ SQL executado com sucesso!');
    }

    // Verificar se a tabela foi criada
    const { data: checkData, error: checkError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar tabela:', checkError);
    } else {
      console.log('✅ Tabela conversation_memory verificada com sucesso!');
    }

    console.log('🎯 Correção da tabela conversation_memory concluída!');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
  }
}

fixConversationMemoryTable(); 