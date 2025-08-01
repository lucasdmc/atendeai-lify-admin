import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMemorySystem() {
  console.log('🔍 DEBUGANDO SISTEMA DE MEMÓRIA');
  console.log('=================================\n');

  const testPhone = '5511999999999';

  try {
    // 1. Verificar tabela conversation_memory
    console.log('📋 1. Verificando conversation_memory');
    console.log('─'.repeat(50));
    
    const { data: memoryData, error: memoryError } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone);

    if (memoryError) {
      console.log(`❌ Erro: ${memoryError.message}`);
    } else {
      console.log(`✅ Dados encontrados: ${memoryData?.length || 0} registros`);
      if (memoryData && memoryData.length > 0) {
        console.log('📊 Estrutura do primeiro registro:');
        Object.keys(memoryData[0]).forEach(key => {
          console.log(`   ${key}: ${typeof memoryData[0][key]} = ${JSON.stringify(memoryData[0][key]).substring(0, 100)}...`);
        });
      }
    }
    console.log('');

    // 2. Verificar tabela whatsapp_messages
    console.log('📋 2. Verificando whatsapp_messages');
    console.log('─'.repeat(50));
    
    const { data: messagesData, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(5);

    if (messagesError) {
      console.log(`❌ Erro: ${messagesError.message}`);
    } else {
      console.log(`✅ Dados encontrados: ${messagesData?.length || 0} registros`);
      if (messagesData && messagesData.length > 0) {
        console.log('📊 Estrutura do primeiro registro:');
        Object.keys(messagesData[0]).forEach(key => {
          console.log(`   ${key}: ${typeof messagesData[0][key]} = ${JSON.stringify(messagesData[0][key]).substring(0, 100)}...`);
        });
      }
    }
    console.log('');

    // 3. Verificar tabela whatsapp_conversations
    console.log('📋 3. Verificando whatsapp_conversations');
    console.log('─'.repeat(50));
    
    const { data: convData, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('phone_number', testPhone);

    if (convError) {
      console.log(`❌ Erro: ${convError.message}`);
    } else {
      console.log(`✅ Dados encontrados: ${convData?.length || 0} registros`);
      if (convData && convData.length > 0) {
        console.log('📊 Estrutura do primeiro registro:');
        Object.keys(convData[0]).forEach(key => {
          console.log(`   ${key}: ${typeof convData[0][key]} = ${JSON.stringify(convData[0][key]).substring(0, 100)}...`);
        });
      }
    }
    console.log('');

    // 4. Simular extração de nome
    console.log('👤 4. Testando extração de nome');
    console.log('─'.repeat(50));
    
    const testMessages = [
      'Olá, meu nome é João Silva',
      'Me chamo Maria Santos',
      'Sou o Dr. Carlos',
      'Oi, sou a Ana'
    ];

    testMessages.forEach((message, index) => {
      const namePatterns = [
        /meu nome é (\w+)/i,
        /me chamo (\w+)/i,
        /sou o (\w+)/i,
        /sou a (\w+)/i,
        /eu sou (\w+)/i
      ];

      let extractedName = null;
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match) {
          extractedName = match[1];
          break;
        }
      }

      console.log(`Mensagem ${index + 1}: "${message}"`);
      console.log(`Nome extraído: ${extractedName || 'Nenhum'}`);
    });
    console.log('');

    // 5. Testar salvamento de memória
    console.log('💾 5. Testando salvamento de memória');
    console.log('─'.repeat(50));
    
    try {
      const testMemoryData = {
        phone_number: testPhone,
        user_name: { name: 'João Silva', extracted_at: new Date().toISOString() },
        last_interaction: new Date().toISOString(),
        interaction_count: 1,
        memory_data: {
          context: { last_intent: 'GREETING' },
          topics: ['saudação'],
          user_preferences: { communication_style: 'formal' }
        }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('conversation_memory')
        .upsert(testMemoryData)
        .select();

      if (insertError) {
        console.log(`❌ Erro ao salvar: ${insertError.message}`);
      } else {
        console.log(`✅ Memória salva com sucesso: ${insertData?.length || 0} registros`);
      }
    } catch (err) {
      console.log(`❌ Erro geral: ${err.message}`);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugMemorySystem(); 