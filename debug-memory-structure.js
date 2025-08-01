import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMemoryStructure() {
  console.log('🔍 DEBUGANDO ESTRUTURA DA MEMÓRIA');
  console.log('===================================\n');

  const testPhone = '5511999999999';

  try {
    // 1. Verificar estrutura da tabela
    console.log('📋 1. Verificando estrutura da tabela conversation_memory');
    console.log('─'.repeat(50));
    
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .limit(1);

    if (memoryError) {
      console.log(`❌ Erro: ${memoryError.message}`);
    } else if (memoryData && memoryData.length > 0) {
      const record = memoryData[0];
      console.log('📊 Estrutura do registro:');
      Object.keys(record).forEach(key => {
        const value = record[key];
        const type = typeof value;
        const jsonValue = JSON.stringify(value);
        console.log(`   ${key}: ${type} = ${jsonValue.substring(0, 100)}${jsonValue.length > 100 ? '...' : ''}`);
      });
    } else {
      console.log('ℹ️ Nenhum registro encontrado');
    }
    console.log('');

    // 2. Testar inserção com estrutura correta
    console.log('🧪 2. Testando inserção com estrutura correta');
    console.log('─'.repeat(50));
    
    const testMemoryData = {
      phone_number: testPhone,
      user_name: {
        name: 'João Silva',
        extracted_at: new Date().toISOString()
      },
      last_interaction: new Date().toISOString(),
      interaction_count: 1,
      memory_data: {
        context: { last_intent: 'GREETING' },
        topics: ['saudação'],
        user_preferences: { communication_style: 'formal' }
      }
    };

    console.log('📝 Dados para inserção:');
    console.log(JSON.stringify(testMemoryData, null, 2));
    console.log('');

    const { data: insertData, error: insertError } = await supabase
      .from('conversation_memory')
      .upsert(testMemoryData, { 
        onConflict: 'phone_number'
      })
      .select();

    if (insertError) {
      console.log(`❌ Erro na inserção: ${insertError.message}`);
      console.log('🔍 Detalhes do erro:', insertError);
    } else {
      console.log(`✅ Inserção bem-sucedida`);
      if (insertData && insertData.length > 0) {
        console.log('📊 Registro inserido:');
        Object.keys(insertData[0]).forEach(key => {
          const value = insertData[0][key];
          const type = typeof value;
          const jsonValue = JSON.stringify(value);
          console.log(`   ${key}: ${type} = ${jsonValue.substring(0, 100)}${jsonValue.length > 100 ? '...' : ''}`);
        });
      }
    }
    console.log('');

    // 3. Verificar se o nome foi salvo corretamente
    console.log('📋 3. Verificando se o nome foi salvo');
    console.log('─'.repeat(50));
    
    const { data: finalCheck } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone);

    if (finalCheck && finalCheck.length > 0) {
      const record = finalCheck[0];
      console.log(`✅ Registro encontrado:`);
      console.log(`   📞 Telefone: ${record.phone_number}`);
      console.log(`   👤 Nome: "${record.user_name?.name || 'Não definido'}"`);
      console.log(`   🔢 Interações: ${record.interaction_count}`);
      console.log(`   📅 Última interação: ${record.last_interaction}`);
      
      if (record.user_name) {
        console.log(`   📝 Estrutura user_name:`, JSON.stringify(record.user_name, null, 2));
      }
    } else {
      console.log('❌ Nenhum registro encontrado');
    }
    console.log('');

    console.log('🎉 DEBUG CONCLUÍDO');
    console.log('==================');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugMemoryStructure(); 