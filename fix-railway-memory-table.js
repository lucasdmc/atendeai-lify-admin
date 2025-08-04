// ========================================
// CORREÇÃO DA TABELA DE MEMÓRIA RAILWAY
// ========================================

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function fixRailwayMemoryTable() {
  console.log('🔧 CORREÇÃO DA TABELA DE MEMÓRIA RAILWAY');
  console.log('=========================================\n');

  try {
    // 1. Verificar estrutura atual da tabela
    console.log('📋 1. Verificando estrutura atual da tabela conversation_memory...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Erro ao verificar tabela:', tableError.message);
      
      // 2. Criar tabela se não existir
      console.log('\n📋 2. Criando tabela conversation_memory...');
      
      const createTableSQL = `
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
      `;

      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('❌ Erro ao criar tabela:', createError.message);
        return;
      } else {
        console.log('✅ Tabela conversation_memory criada com sucesso');
      }

      // 3. Criar índices
      console.log('\n📋 3. Criando índices...');
      
      const createIndexSQL = `
        CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);
        CREATE INDEX IF NOT EXISTS idx_conversation_memory_last_interaction ON conversation_memory(last_interaction);
      `;

      const { error: indexError } = await supabase.rpc('exec_sql', { sql: createIndexSQL });
      
      if (indexError) {
        console.error('❌ Erro ao criar índices:', indexError.message);
      } else {
        console.log('✅ Índices criados com sucesso');
      }

      // 4. Criar função de trigger
      console.log('\n📋 4. Criando função de trigger...');
      
      const createTriggerFunctionSQL = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `;

      const { error: functionError } = await supabase.rpc('exec_sql', { sql: createTriggerFunctionSQL });
      
      if (functionError) {
        console.error('❌ Erro ao criar função:', functionError.message);
      } else {
        console.log('✅ Função de trigger criada com sucesso');
      }

      // 5. Criar trigger
      console.log('\n📋 5. Criando trigger...');
      
      const createTriggerSQL = `
        DROP TRIGGER IF EXISTS trigger_update_conversation_memory_updated_at ON conversation_memory;
        CREATE TRIGGER trigger_update_conversation_memory_updated_at
            BEFORE UPDATE ON conversation_memory
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `;

      const { error: triggerError } = await supabase.rpc('exec_sql', { sql: createTriggerSQL });
      
      if (triggerError) {
        console.error('❌ Erro ao criar trigger:', triggerError.message);
      } else {
        console.log('✅ Trigger criado com sucesso');
      }

    } else {
      console.log('✅ Tabela conversation_memory já existe');
      
      // Verificar se tem a coluna agent_id (que não deveria existir)
      console.log('\n📋 2. Verificando se há coluna agent_id (que deve ser removida)...');
      
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_table_columns', { table_name: 'conversation_memory' });

      if (columnsError) {
        console.log('⚠️ Não foi possível verificar colunas, mas continuando...');
      } else {
        console.log('📋 Colunas da tabela:', columns);
      }
    }

    // 6. Testar inserção
    console.log('\n📋 6. Testando inserção na tabela...');
    
    const testData = {
      phone_number: '5511999999999',
      user_name: 'Teste Railway',
      last_intent: 'GREETING',
      interaction_count: 1
    };

    const { data: insertData, error: insertError } = await supabase
      .from('conversation_memory')
      .upsert(testData, { onConflict: 'phone_number' })
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir dados de teste:', insertError.message);
    } else {
      console.log('✅ Inserção de teste bem-sucedida');
      console.log('   - Dados inseridos:', insertData);
    }

    // 7. Testar consulta
    console.log('\n📋 7. Testando consulta...');
    
    const { data: queryData, error: queryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', '5511999999999')
      .single();

    if (queryError) {
      console.error('❌ Erro ao consultar dados:', queryError.message);
    } else {
      console.log('✅ Consulta bem-sucedida');
      console.log('   - Dados encontrados:', queryData);
    }

    console.log('\n🎯 CORREÇÃO CONCLUÍDA');
    console.log('======================');

  } catch (error) {
    console.error('💥 Erro crítico na correção:', error);
  }
}

// Executar correção
fixRailwayMemoryTable(); 