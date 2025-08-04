// Script para testar se o contexto está sendo salvo corretamente
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente diretamente
process.env.OPENAI_API_KEY = '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';
process.env.SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testContextSave() {
  console.log('🧪 Testando salvamento de contexto...');
  
  try {
    // Simular processamento de mensagem com nome
    const testPhoneNumber = '5547999999998'; // Novo número de teste
    const testMessage = 'Olá, meu nome é João Silva, tudo bem?';
    
    console.log(`📱 Testando com número: ${testPhoneNumber}`);
    console.log(`💬 Mensagem: "${testMessage}"`);
    
    // Importar e usar LLMOrchestratorService
    const { LLMOrchestratorService } = await import('./services/llmOrchestratorService.js');
    
    const request = {
      phoneNumber: testPhoneNumber,
      message: testMessage,
      conversationId: `test-${testPhoneNumber}-${Date.now()}`,
      userId: testPhoneNumber
    };
    
    console.log('🤖 Processando mensagem...');
    const response = await LLMOrchestratorService.processMessage(request);
    
    console.log('✅ Resposta gerada:', response.response);
    console.log('🎯 Intent:', response.intent?.name);
    console.log('📊 Confidence:', response.intent?.confidence);
    
    // Verificar se o nome foi salvo
    console.log('\n🔍 Verificando se o nome foi salvo...');
    const { data: savedData, error } = await supabase
      .from('conversation_memory')
      .select('phone_number, user_name, memory_data')
      .eq('phone_number', testPhoneNumber)
      .single();
    
    if (error) {
      console.error('❌ Erro ao buscar dados salvos:', error);
      return;
    }
    
    if (savedData) {
      console.log('✅ Dados encontrados na tabela:');
      console.log(`  - Phone: ${savedData.phone_number}`);
      console.log(`  - User Name: ${savedData.user_name || 'NULL'}`);
      
      if (savedData.user_name) {
        try {
          // Tentar fazer parse se for JSON
          if (savedData.user_name.startsWith('{')) {
            const parsed = JSON.parse(savedData.user_name);
            console.log(`  - Nome extraído: ${parsed.name}`);
            console.log(`  - Extraído em: ${parsed.extracted_at}`);
          } else {
            console.log(`  - Nome direto: ${savedData.user_name}`);
          }
        } catch (e) {
          console.log(`  - Nome (string): ${savedData.user_name}`);
        }
      }
      
      if (savedData.memory_data?.userProfile) {
        console.log(`  - UserProfile: ${savedData.memory_data.userProfile.name || 'sem nome'}`);
      }
    } else {
      console.log('❌ Nenhum dado encontrado na tabela');
    }
    
    // Testar com outro número sem nome
    console.log('\n🧪 Testando com número sem nome...');
    const testPhoneNumber2 = '5547999999997';
    const testMessage2 = 'Oi, tudo bem?';
    
    console.log(`📱 Testando com número: ${testPhoneNumber2}`);
    console.log(`💬 Mensagem: "${testMessage2}"`);
    
    const request2 = {
      phoneNumber: testPhoneNumber2,
      message: testMessage2,
      conversationId: `test-${testPhoneNumber2}-${Date.now()}`,
      userId: testPhoneNumber2
    };
    
    const response2 = await LLMOrchestratorService.processMessage(request2);
    console.log('✅ Resposta gerada:', response2.response);
    
    // Verificar se não salvou nome
    const { data: savedData2 } = await supabase
      .from('conversation_memory')
      .select('phone_number, user_name')
      .eq('phone_number', testPhoneNumber2)
      .single();
    
    if (savedData2) {
      console.log('✅ Dados do segundo teste:');
      console.log(`  - Phone: ${savedData2.phone_number}`);
      console.log(`  - User Name: ${savedData2.user_name || 'NULL'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

// Executar teste
testContextSave().then(() => {
  console.log('\n🏁 Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
}); 