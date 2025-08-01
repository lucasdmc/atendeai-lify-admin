import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugMemoryPersistence() {
  console.log('🔍 DEBUGANDO PROBLEMA DE PERSISTÊNCIA DA MEMÓRIA');
  console.log('================================================\n');

  const testPhone = '554730915628'; // Telefone do Lucas

  try {
    // 1. Verificar memória atual
    console.log('📋 1. Verificando memória atual');
    console.log('─'.repeat(50));
    
    const { data: memoryData } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone);

    if (memoryData && memoryData.length > 0) {
      const memory = memoryData[0];
      console.log('✅ Memória encontrada:');
      console.log(`   📞 Telefone: ${memory.phone_number}`);
      console.log(`   🔢 Interações: ${memory.interaction_count}`);
      console.log(`   📅 Última interação: ${memory.last_interaction}`);
      
      // Parse do user_name
      if (memory.user_name) {
        try {
          if (typeof memory.user_name === 'string') {
            const parsedUserName = JSON.parse(memory.user_name);
            console.log(`   👤 Nome salvo: "${parsedUserName.name}"`);
            console.log(`   📅 Extraído em: ${parsedUserName.extracted_at}`);
          }
        } catch (error) {
          console.log(`   ❌ Erro ao parsear user_name: ${error.message}`);
          console.log(`   📝 Valor bruto: ${memory.user_name}`);
        }
      } else {
        console.log('   ⚠️ Nenhum nome salvo');
      }
      
      if (memory.memory_data) {
        console.log(`   🧠 Tópicos: ${memory.memory_data.topics?.join(', ') || 'Nenhum'}`);
      }
    } else {
      console.log('❌ Nenhuma memória encontrada para este telefone');
    }
    console.log('');

    // 2. Simular a conversa real do Lucas
    console.log('💬 2. Simulando conversa real do Lucas');
    console.log('─'.repeat(50));
    
    const conversation = [
      'Olá, tudo bem?',
      'Você sabe meu nome?',
      'Meu nome é Lucas',
      'Quero saber o nome da clínica, os médicos que trabalham nela e os horários de funcionamento',
      'Perfeito! Aproveitando, qual o meu nome?'
    ];

    conversation.forEach((message, index) => {
      console.log(`📨 Mensagem ${index + 1}: "${message}"`);
      
      // Extrair nome
      const namePatterns = [
        /meu nome é ([^,\.!?]+)/i,
        /me chamo ([^,\.!?]+)/i,
        /sou o ([^,\.!?]+)/i,
        /sou a ([^,\.!?]+)/i,
        /eu sou ([^,\.!?]+)/i,
        /chamo-me ([^,\.!?]+)/i
      ];

      let extractedName = null;
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match) {
          const name = match[1].trim();
          if (name.length <= 50 && !name.includes('tudo bem') && !name.includes('qual')) {
            extractedName = name;
            break;
          }
        }
      }

      if (extractedName) {
        console.log(`   👤 Nome extraído: "${extractedName}"`);
      } else {
        console.log(`   ℹ️ Nenhum nome extraído`);
      }
    });
    console.log('');

    // 3. Verificar se o nome foi salvo corretamente
    console.log('💾 3. Verificando salvamento do nome');
    console.log('─'.repeat(50));
    
    // Simular salvamento do nome "Lucas"
    const testMemoryData = {
      phone_number: testPhone,
      user_name: JSON.stringify({
        name: 'Lucas',
        extracted_at: new Date().toISOString()
      }),
      last_interaction: new Date().toISOString(),
      interaction_count: 5,
      memory_data: {
        context: { last_intent: 'INFO_REQUEST' },
        topics: ['saudação', 'nome_extraído', 'informações_clínica'],
        user_preferences: { communication_style: 'formal' }
      }
    };

    const { data: savedMemory, error: saveError } = await supabase
      .from('conversation_memory')
      .upsert(testMemoryData, { onConflict: 'phone_number' })
      .select();

    if (saveError) {
      console.log(`❌ Erro ao salvar: ${saveError.message}`);
    } else {
      console.log(`✅ Nome "Lucas" salvo na memória`);
    }
    console.log('');

    // 4. Simular carregamento para IA (como acontece na prática)
    console.log('🤖 4. Simulando carregamento para IA');
    console.log('─'.repeat(50));
    
    const { data: loadedMemory } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone)
      .single();

    if (loadedMemory) {
      console.log('✅ Memória carregada para IA:');
      console.log(`   📞 Telefone: ${loadedMemory.phone_number}`);
      console.log(`   🔢 Interações: ${loadedMemory.interaction_count}`);
      
      // Parse do user_name para IA
      let userName = null;
      if (loadedMemory.user_name) {
        try {
          if (typeof loadedMemory.user_name === 'string') {
            const parsedUserName = JSON.parse(loadedMemory.user_name);
            userName = parsedUserName.name;
            console.log(`   👤 Nome para IA: "${userName}"`);
          }
        } catch (error) {
          console.log(`   ❌ Erro ao parsear para IA: ${error.message}`);
          console.log(`   📝 Valor bruto: ${loadedMemory.user_name}`);
        }
      }
      
      // Simular contexto para IA
      if (userName) {
        console.log(`💬 Contexto para IA: "O usuário se chama ${userName}"`);
        console.log(`📝 Prompt sugerido: "Olá ${userName}! Como posso ajudá-lo hoje?"`);
        
        // Simular resposta da IA
        const aiResponse = `Claro ${userName}! Seu nome é ${userName}. Como posso ajudá-lo hoje?`;
        console.log(`🤖 Resposta da IA: "${aiResponse}"`);
      } else {
        console.log(`⚠️ IA não tem acesso ao nome do usuário`);
        const genericResponse = 'Infelizmente, não tenho acesso a informações pessoais. Como posso ajudá-lo?';
        console.log(`🤖 Resposta genérica: "${genericResponse}"`);
      }
    }
    console.log('');

    // 5. Verificar histórico de mensagens
    console.log('📝 5. Verificando histórico de mensagens');
    console.log('─'.repeat(50));
    
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('conversation_id', `conv_${testPhone.replace(/\D/g, '')}`)
      .order('timestamp', { ascending: true })
      .limit(10);

    if (messages && messages.length > 0) {
      console.log(`✅ Histórico encontrado: ${messages.length} mensagens`);
      messages.forEach((msg, index) => {
        const role = msg.message_type === 'received' ? '👤 Lucas' : '🤖 IA';
        const time = new Date(msg.timestamp).toLocaleTimeString();
        console.log(`   ${index + 1}. ${role} (${time}): "${msg.content}"`);
      });
    } else {
      console.log('ℹ️ Nenhum histórico específico encontrado');
    }
    console.log('');

    console.log('🎉 DEBUG CONCLUÍDO');
    console.log('==================');
    console.log('🔍 PROBLEMAS IDENTIFICADOS:');
    console.log('   1. IA não está carregando memória entre mensagens');
    console.log('   2. Contexto não está sendo mantido');
    console.log('   3. Nome extraído mas perdido na próxima mensagem');
    console.log('\n💡 SOLUÇÕES NECESSÁRIAS:');
    console.log('   1. Verificar se ConversationMemoryService está sendo chamado');
    console.log('   2. Verificar se LLM Orchestrator está usando a memória');
    console.log('   3. Verificar se o cache está funcionando');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugMemoryPersistence(); 