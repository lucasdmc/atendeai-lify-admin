import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertTestConversations() {
  console.log('🚀 Inserindo conversas de teste...\n');

  try {
    // 1. Inserir conversas de teste
    const testConversations = [
      {
        phone_number: '5547999999999',
        formatted_phone_number: '(47) 99999-9999',
        country_code: 'BR',
        name: 'João Silva',
        last_message_preview: 'Olá, gostaria de agendar uma consulta',
        unread_count: 2
      },
      {
        phone_number: '5547888888888',
        formatted_phone_number: '(47) 88888-8888',
        country_code: 'BR',
        name: 'Maria Santos',
        last_message_preview: 'Obrigada pela informação!',
        unread_count: 0
      },
      {
        phone_number: '5547777777777',
        formatted_phone_number: '(47) 77777-7777',
        country_code: 'BR',
        name: 'Pedro Costa',
        last_message_preview: 'Qual o horário de funcionamento?',
        unread_count: 1
      }
    ];

    for (const conv of testConversations) {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .upsert({
          ...conv,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'phone_number'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao inserir conversa ${conv.phone_number}:`, error);
      } else {
        console.log(`✅ Conversa inserida: ${conv.name} (${conv.phone_number})`);
        
        // 2. Inserir mensagens de teste para cada conversa
        const testMessages = [
          {
            content: 'Olá, gostaria de agendar uma consulta',
            message_type: 'received',
            timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hora atrás
          },
          {
            content: 'Claro! Qual especialidade você precisa?',
            message_type: 'sent',
            timestamp: new Date(Date.now() - 3500000).toISOString()
          },
          {
            content: 'Cardiologia, por favor',
            message_type: 'received',
            timestamp: new Date(Date.now() - 3400000).toISOString()
          }
        ];

        for (const msg of testMessages) {
          const { error: msgError } = await supabase
            .from('whatsapp_messages')
            .insert({
              conversation_id: data.id,
              content: msg.content,
              message_type: msg.message_type,
              timestamp: msg.timestamp,
              whatsapp_message_id: `test_${Date.now()}_${Math.random()}`,
              metadata: {}
            });

          if (msgError) {
            console.error(`❌ Erro ao inserir mensagem:`, msgError);
          }
        }

        // 3. Atualizar a última mensagem da conversa
        await supabase
          .from('whatsapp_conversations')
          .update({
            last_message_preview: testMessages[testMessages.length - 1].content,
            updated_at: testMessages[testMessages.length - 1].timestamp
          })
          .eq('id', data.id);
      }
    }

    console.log('\n✅ Dados de teste inseridos com sucesso!');
    console.log('📱 Agora você pode testar a tela de conversas com dados reais.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

insertTestConversations(); 