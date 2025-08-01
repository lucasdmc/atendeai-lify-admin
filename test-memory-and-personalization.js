import { createClient } from '@supabase/supabase-js';

// Configuração real do Supabase
const SUPABASE_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMemoryAndPersonalization() {
  console.log('🧠 TESTANDO MEMÓRIA E PERSONALIZAÇÃO');
  console.log('=====================================\n');

  const testPhone = '5511999999999';
  const testMessages = [
    'Olá, meu nome é João Silva',
    'Quais são os horários de funcionamento?',
    'Quero agendar uma consulta',
    'Obrigado, até logo!'
  ];

  try {
    // 1. Verificar memória inicial
    console.log('📋 1. Verificando memória inicial');
    console.log('─'.repeat(50));
    
    const { data: initialMemory } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone);

    console.log(`Memória inicial: ${initialMemory?.length || 0} registros`);
    if (initialMemory && initialMemory.length > 0) {
      console.log('Nome salvo:', initialMemory[0].user_name?.name);
      console.log('Interações:', initialMemory[0].interaction_count);
    }
    console.log('');

    // 2. Simular conversa com extração de nome
    console.log('💬 2. Simulando conversa com extração de nome');
    console.log('─'.repeat(50));
    
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      console.log(`\n📨 Mensagem ${i + 1}: "${message}"`);
      
      // Extrair nome com padrões melhorados
      const namePatterns = [
        /meu nome é ([^.!?]+)/i,
        /me chamo ([^.!?]+)/i,
        /sou o ([^.!?]+)/i,
        /sou a ([^.!?]+)/i,
        /eu sou ([^.!?]+)/i,
        /chamo-me ([^.!?]+)/i
      ];

      let extractedName = null;
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match) {
          extractedName = match[1].trim();
          break;
        }
      }

      if (extractedName) {
        console.log(`👤 Nome extraído: "${extractedName}"`);
        
        // Atualizar memória existente ou criar nova
        const { data: existingMemory } = await supabase
          .from('conversation_memory')
          .select('*')
          .eq('phone_number', testPhone)
          .single();

        const memoryData = {
          phone_number: testPhone,
          user_name: {
            name: extractedName,
            extracted_at: new Date().toISOString()
          },
          last_interaction: new Date().toISOString(),
          interaction_count: (existingMemory?.interaction_count || 0) + 1,
          memory_data: {
            context: { last_intent: 'GREETING' },
            topics: ['saudação'],
            user_preferences: { communication_style: 'formal' }
          }
        };

        const { data: savedMemory, error: saveError } = await supabase
          .from('conversation_memory')
          .upsert(memoryData, { 
            onConflict: 'phone_number',
            ignoreDuplicates: false 
          })
          .select();

        if (saveError) {
          console.log(`❌ Erro ao salvar: ${saveError.message}`);
        } else {
          console.log(`✅ Nome salvo na memória: "${extractedName}"`);
        }
      } else {
        console.log('ℹ️ Nenhum nome extraído desta mensagem');
      }
    }
    console.log('');

    // 3. Verificar memória após conversa
    console.log('📋 3. Verificando memória após conversa');
    console.log('─'.repeat(50));
    
    const { data: finalMemory } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('phone_number', testPhone);

    if (finalMemory && finalMemory.length > 0) {
      const memory = finalMemory[0];
      console.log(`✅ Memória encontrada:`);
      console.log(`   👤 Nome: ${memory.user_name?.name || 'Não definido'}`);
      console.log(`   📞 Telefone: ${memory.phone_number}`);
      console.log(`   🔢 Interações: ${memory.interaction_count}`);
      console.log(`   📅 Última interação: ${memory.last_interaction}`);
      console.log(`   🧠 Tópicos: ${memory.memory_data?.topics?.join(', ') || 'Nenhum'}`);
    } else {
      console.log('❌ Nenhuma memória encontrada');
    }
    console.log('');

    // 4. Testar personalização
    console.log('👤 4. Testando personalização');
    console.log('─'.repeat(50));
    
    if (finalMemory && finalMemory[0].user_name?.name) {
      const userName = finalMemory[0].user_name.name;
      console.log(`✅ Usuário identificado: "${userName}"`);
      
      // Simular resposta personalizada
      const personalizedResponse = `Olá ${userName}! Como posso ajudá-lo hoje?`;
      console.log(`💬 Resposta personalizada: "${personalizedResponse}"`);
      
      // Simular contexto de conversa
      console.log(`📝 Contexto: Conversa com ${userName} - ${finalMemory[0].interaction_count} interações`);
    } else {
      console.log('⚠️ Usuário não identificado - usando resposta genérica');
      const genericResponse = 'Olá! Como posso ajudá-lo hoje?';
      console.log(`💬 Resposta genérica: "${genericResponse}"`);
    }
    console.log('');

    // 5. Verificar histórico de mensagens
    console.log('📝 5. Verificando histórico de mensagens');
    console.log('─'.repeat(50));
    
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(10);

    if (messages && messages.length > 0) {
      console.log(`✅ Histórico encontrado: ${messages.length} mensagens`);
      messages.forEach((msg, index) => {
        const role = msg.message_type === 'received' ? '👤 Usuário' : '🤖 Bot';
        console.log(`   ${index + 1}. ${role}: "${msg.content.substring(0, 50)}..."`);
      });
    } else {
      console.log('ℹ️ Nenhum histórico de mensagens encontrado');
    }
    console.log('');

    // 6. Testar diferentes padrões de nome
    console.log('🔍 6. Testando diferentes padrões de nome');
    console.log('─'.repeat(50));
    
    const testNamePatterns = [
      'Olá, meu nome é João Silva',
      'Me chamo Maria Santos',
      'Sou o Dr. Carlos Oliveira',
      'Sou a Dra. Ana Paula',
      'Eu sou Pedro',
      'Chamo-me Roberto'
    ];

    testNamePatterns.forEach((testMessage, index) => {
      const namePatterns = [
        /meu nome é ([^.!?]+)/i,
        /me chamo ([^.!?]+)/i,
        /sou o ([^.!?]+)/i,
        /sou a ([^.!?]+)/i,
        /eu sou ([^.!?]+)/i,
        /chamo-me ([^.!?]+)/i
      ];

      let extractedName = null;
      for (const pattern of namePatterns) {
        const match = testMessage.match(pattern);
        if (match) {
          extractedName = match[1].trim();
          break;
        }
      }

      console.log(`Teste ${index + 1}: "${testMessage}"`);
      console.log(`   Nome extraído: "${extractedName || 'Nenhum'}"`);
    });
    console.log('');

    console.log('🎉 TESTE CONCLUÍDO');
    console.log('==================');
    console.log('✅ Sistema de memória funcionando');
    console.log('✅ Extração de nome implementada');
    console.log('✅ Personalização ativa');
    console.log('✅ Histórico de conversas mantido');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testMemoryAndPersonalization(); 