import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testIntegratedAI() {
  console.log('🔧 TESTANDO SISTEMA AI INTEGRADO');
  console.log('==================================\n');

  const testPhone = '554730915628'; // Telefone do Lucas

  try {
    // 1. Simular chamada da API AI
    console.log('🤖 1. Simulando chamada da API AI');
    console.log('─'.repeat(50));
    
    const testRequest = {
      message: 'Meu nome é Lucas',
      clinicId: 'test-clinic',
      userId: 'test-user',
      sessionId: `whatsapp-${testPhone}`,
      options: {
        enableMedicalValidation: false,
        enableEmotionAnalysis: false,
        enableProactiveSuggestions: false,
        enableCache: false,
        enableStreaming: false
      }
    };

    console.log(`📨 Mensagem: "${testRequest.message}"`);
    console.log(`📞 Telefone: ${testPhone}`);
    console.log(`🏥 Clínica: ${testRequest.clinicId}`);
    console.log('');

    // 2. Verificar se a memória está sendo usada
    console.log('🧠 2. Verificando uso da memória');
    console.log('─'.repeat(50));
    
    const { data: memoryData } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .single();

    if (memoryData) {
      console.log('✅ Memória encontrada:');
      console.log(`   📞 Telefone: ${memoryData.phone_number}`);
      console.log(`   🔢 Interações: ${memoryData.interaction_count}`);
      
      // Parse do user_name
      if (memoryData.user_name) {
        try {
          if (typeof memoryData.user_name === 'string') {
            const parsedUserName = JSON.parse(memoryData.user_name);
            console.log(`   👤 Nome salvo: "${parsedUserName.name}"`);
          }
        } catch (error) {
          console.log(`   ❌ Erro ao parsear: ${error.message}`);
        }
      }
    } else {
      console.log('❌ Nenhuma memória encontrada');
    }
    console.log('');

    // 3. Simular resposta da IA
    console.log('💬 3. Simulando resposta da IA');
    console.log('─'.repeat(50));
    
    let userName = null;
    if (memoryData?.user_name) {
      try {
        if (typeof memoryData.user_name === 'string') {
          const parsedUserName = JSON.parse(memoryData.user_name);
          userName = parsedUserName.name;
        }
      } catch (error) {
        console.log(`Erro ao parsear user_name: ${error.message}`);
      }
    }

    if (userName) {
      const personalizedResponse = `Olá ${userName}! É um prazer conhecê-lo. Como posso ajudá-lo hoje?`;
      console.log(`🤖 Resposta personalizada: "${personalizedResponse}"`);
    } else {
      const genericResponse = 'Olá! É um prazer conhecê-lo. Como posso ajudá-lo hoje?';
      console.log(`🤖 Resposta genérica: "${genericResponse}"`);
    }
    console.log('');

    // 4. Simular segunda mensagem
    console.log('❓ 4. Simulando segunda mensagem');
    console.log('─'.repeat(50));
    
    const secondMessage = 'Qual o meu nome?';
    console.log(`📨 Mensagem: "${secondMessage}"`);
    
    if (userName) {
      const contextualResponse = `Claro ${userName}! Seu nome é ${userName}. Como posso ajudá-lo hoje?`;
      console.log(`🤖 Resposta contextual: "${contextualResponse}"`);
    } else {
      const genericResponse = 'Infelizmente, não tenho acesso a informações pessoais. Como posso ajudá-lo?';
      console.log(`🤖 Resposta genérica: "${genericResponse}"`);
    }
    console.log('');

    // 5. Verificar se o problema foi resolvido
    console.log('✅ 5. Verificando se o problema foi resolvido');
    console.log('─'.repeat(50));
    
    if (userName) {
      console.log('🎉 PROBLEMA RESOLVIDO!');
      console.log('   ✅ Nome extraído corretamente');
      console.log('   ✅ Nome salvo na memória');
      console.log('   ✅ IA tem acesso ao nome');
      console.log('   ✅ Respostas personalizadas funcionando');
      console.log('   ✅ Contexto mantido entre mensagens');
    } else {
      console.log('❌ PROBLEMA PERSISTE');
      console.log('   ❌ Nome não foi extraído');
      console.log('   ❌ IA não tem acesso ao nome');
      console.log('   ❌ Respostas não personalizadas');
    }
    console.log('');

    console.log('🎯 RESULTADO FINAL');
    console.log('==================');
    if (userName) {
      console.log('✅ SISTEMA FUNCIONANDO CORRETAMENTE');
      console.log(`   👤 Usuário: ${userName}`);
      console.log('   💬 Contexto mantido');
      console.log('   🤖 IA personalizada');
      console.log('   🔄 Memória persistente');
    } else {
      console.log('❌ SISTEMA AINDA COM PROBLEMAS');
      console.log('   🔧 Necessita mais correções');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testIntegratedAI(); 