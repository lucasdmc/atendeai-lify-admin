// ========================================
// CORREÇÃO DA ESTRUTURA DA TABELA DE MEMÓRIA
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

async function fixMemoryTableStructure() {
  console.log('🔧 CORREÇÃO DA ESTRUTURA DA TABELA DE MEMÓRIA');
  console.log('==============================================\n');

  try {
    // 1. Recriar tabela com estrutura correta
    console.log('📋 1. Recriando tabela conversation_memory com estrutura correta...');
    
    const recreateTableSQL = `
      -- Remover tabela existente
      DROP TABLE IF EXISTS conversation_memory CASCADE;
      
      -- Criar tabela com estrutura correta
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
      
      -- Criar índices
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_phone ON conversation_memory(phone_number);
      CREATE INDEX IF NOT EXISTS idx_conversation_memory_last_interaction ON conversation_memory(last_interaction);
      
      -- Criar função de trigger
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Criar trigger
      DROP TRIGGER IF EXISTS trigger_update_conversation_memory_updated_at ON conversation_memory;
      CREATE TRIGGER trigger_update_conversation_memory_updated_at
          BEFORE UPDATE ON conversation_memory
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    // Como não podemos executar SQL diretamente via RPC, vamos usar uma abordagem diferente
    console.log('⚠️ Não é possível executar DDL via RPC. Vamos usar a interface do Supabase.');
    console.log('📋 Por favor, execute o seguinte SQL no Supabase Dashboard:');
    console.log('\n' + recreateTableSQL + '\n');

    // 2. Testar inserção com estrutura atual
    console.log('\n📋 2. Testando inserção com estrutura atual...');
    
    const testData = {
      phone_number: '5511999999999',
      user_name: 'Teste Estrutura',
      last_intent: 'GREETING',
      interaction_count: 1,
      memory_data: {
        topics: ['teste'],
        context: { last_intent: 'GREETING' },
        user_preferences: { communication_style: 'formal' }
      }
    };

    const { data: insertData, error: insertError } = await supabase
      .from('conversation_memory')
      .upsert(testData, { onConflict: 'phone_number' })
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir dados de teste:', insertError.message);
      console.log('\n📋 Estrutura atual da tabela não suporta os campos necessários.');
      console.log('📋 Execute o SQL acima no Supabase Dashboard para corrigir.');
    } else {
      console.log('✅ Inserção de teste bem-sucedida');
      console.log('   - Dados inseridos:', insertData);
    }

    // 3. Verificar estrutura atual
    console.log('\n📋 3. Verificando estrutura atual...');
    
    const { data: structureData, error: structureError } = await supabase
      .from('conversation_memory')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Erro ao verificar estrutura:', structureError.message);
    } else {
      console.log('✅ Estrutura atual da tabela:');
      if (structureData && structureData.length > 0) {
        const columns = Object.keys(structureData[0]);
        console.log('   - Colunas encontradas:', columns);
      }
    }

    console.log('\n🎯 CORREÇÃO CONCLUÍDA');
    console.log('======================');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('1. Execute o SQL fornecido no Supabase Dashboard');
    console.log('2. Execute este script novamente para verificar');
    console.log('3. Teste o webhook no Railway');

  } catch (error) {
    console.error('💥 Erro crítico na correção:', error);
  }
}

// Executar correção
fixMemoryTableStructure(); 