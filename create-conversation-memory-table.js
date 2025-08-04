// Script para criar a tabela conversation_memory
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createConversationMemoryTable() {
  console.log('🏗️  Criando tabela conversation_memory...');
  
  try {
    // SQL para criar a tabela
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS conversation_memory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    `;

    // Criar índices
    const createIndexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_last_interaction ON conversation_memory(last_interaction);
    `;

    // Criar função para atualizar updated_at
    const createUpdateFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Criar trigger
    const createTriggerSQL = `
      DROP TRIGGER IF EXISTS trigger_update_conversation_memory_updated_at ON conversation_memory;
      CREATE TRIGGER trigger_update_conversation_memory_updated_at
          BEFORE UPDATE ON conversation_memory
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Executar criação da tabela
    console.log('📋 Criando tabela...');
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.log('⚠️  Tabela pode já existir ou erro na criação:', tableError.message);
    } else {
      console.log('✅ Tabela criada com sucesso!');
    }

    // Executar criação de índices
    console.log('🔍 Criando índices...');
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexesSQL });
    
    if (indexError) {
      console.log('⚠️  Erro ao criar índices:', indexError.message);
    } else {
      console.log('✅ Índices criados com sucesso!');
    }

    // Executar criação da função
    console.log('⚙️  Criando função de atualização...');
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: createUpdateFunctionSQL });
    
    if (functionError) {
      console.log('⚠️  Erro ao criar função:', functionError.message);
    } else {
      console.log('✅ Função criada com sucesso!');
    }

    // Executar criação do trigger
    console.log('🔧 Criando trigger...');
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL });
    
    if (triggerError) {
      console.log('⚠️  Erro ao criar trigger:', triggerError.message);
    } else {
      console.log('✅ Trigger criado com sucesso!');
    }

    // Verificar se a tabela foi criada
    console.log('🔍 Verificando se a tabela foi criada...');
    const { data: testData, error: testError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Erro ao acessar tabela:', testError.message);
    } else {
      console.log('✅ Tabela acessível e funcionando!');
    }

    // Inserir dados de teste
    console.log('🧪 Inserindo dados de teste...');
    const { data: insertData, error: insertError } = await supabase
      .from('conversation_memory')
      .insert({
        phone_number: 'test-user',
        user_name: JSON.stringify({
          name: 'Teste Estrutura',
          extracted_at: new Date().toISOString()
        }),
        memory_data: {
          history: [],
          userProfile: {
            name: 'Teste Estrutura'
          }
        }
      })
      .select();

    if (insertError) {
      console.log('❌ Erro ao inserir dados de teste:', insertError.message);
    } else {
      console.log('✅ Dados de teste inseridos com sucesso!');
      console.log('📝 Dados inseridos:', insertData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar criação
createConversationMemoryTable().then(() => {
  console.log('\n🏁 Criação da tabela concluída!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
 