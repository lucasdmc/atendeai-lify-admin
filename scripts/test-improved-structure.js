import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testImprovedStructure() {
  console.log('🧪 TESTANDO ESTRUTURA MELHORADA');
  console.log('================================');

  try {
    // 1. Verificar se as tabelas existem
    console.log('\n1️⃣ Verificando tabelas...');
    
    const { data: clinicNumbers, error: clinicNumbersError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    if (clinicNumbersError) {
      console.error('❌ Erro ao verificar clinic_whatsapp_numbers:', clinicNumbersError);
    } else {
      console.log(`✅ Tabela clinic_whatsapp_numbers: ${clinicNumbers?.length || 0} registros`);
    }

    const { data: conversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*');

    if (conversationsError) {
      console.error('❌ Erro ao verificar whatsapp_conversations_improved:', conversationsError);
    } else {
      console.log(`✅ Tabela whatsapp_conversations_improved: ${conversations?.length || 0} registros`);
    }

    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*');

    if (messagesError) {
      console.error('❌ Erro ao verificar whatsapp_messages_improved:', messagesError);
    } else {
      console.log(`✅ Tabela whatsapp_messages_improved: ${messages?.length || 0} registros`);
    }

    // 2. Testar função de processamento de mensagem
    console.log('\n2️⃣ Testando função de processamento...');
    
    // Simular uma mensagem recebida
    const testMessage = {
      from_number: '5547999999999',
      to_number: '554730915628',
      content: 'Olá, gostaria de agendar uma consulta',
      whatsapp_message_id: 'test_message_001'
    };

    console.log(`📨 Simulando mensagem de ${testMessage.from_number} para ${testMessage.to_number}`);
    
    // Buscar clínica pelo número que recebeu
    const { data: clinic, error: clinicError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id')
      .eq('whatsapp_number', testMessage.to_number)
      .eq('is_active', true)
      .single();

    if (clinicError) {
      console.error('❌ Erro ao buscar clínica:', clinicError);
    } else if (clinic) {
      console.log(`✅ Clínica encontrada: ${clinic.clinic_id}`);
      
      // Criar ou atualizar conversa
      const { data: conversation, error: conversationError } = await supabase
        .from('whatsapp_conversations_improved')
        .upsert({
          clinic_id: clinic.clinic_id,
          patient_phone_number: testMessage.from_number,
          clinic_whatsapp_number: testMessage.to_number,
          last_message_preview: testMessage.content,
          unread_count: 1,
          last_message_at: new Date().toISOString()
        }, {
          onConflict: 'clinic_id,patient_phone_number,clinic_whatsapp_number'
        })
        .select()
        .single();

      if (conversationError) {
        console.error('❌ Erro ao criar conversa:', conversationError);
      } else {
        console.log(`✅ Conversa criada/atualizada: ${conversation.id}`);
        
        // Salvar mensagem
        const { data: message, error: messageError } = await supabase
          .from('whatsapp_messages_improved')
          .insert({
            conversation_id: conversation.id,
            sender_phone: testMessage.from_number,
            receiver_phone: testMessage.to_number,
            content: testMessage.content,
            message_type: 'received',
            whatsapp_message_id: testMessage.whatsapp_message_id
          })
          .select()
          .single();

        if (messageError) {
          console.error('❌ Erro ao salvar mensagem:', messageError);
        } else {
          console.log(`✅ Mensagem salva: ${message.id}`);
        }
      }
    } else {
      console.log('⚠️ Nenhuma clínica encontrada para o número de destino');
    }

    // 3. Testar busca de conversas
    console.log('\n3️⃣ Testando busca de conversas...');
    
    const { data: allConversations, error: fetchError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Erro ao buscar conversas:', fetchError);
    } else {
      console.log(`✅ Conversas encontradas: ${allConversations?.length || 0}`);
      
      allConversations?.forEach((conv, index) => {
        console.log(`   ${index + 1}. Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Última: ${conv.last_message_preview}`);
      });
    }

    // 4. Verificar dados finais
    console.log('\n4️⃣ Verificando dados finais...');
    
    const { data: finalClinicNumbers } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('*');

    const { data: finalConversations } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*');

    const { data: finalMessages } = await supabase
      .from('whatsapp_messages_improved')
      .select('*');

    console.log(`\n📊 RESUMO FINAL:`);
    console.log(`✅ Números de clínicas: ${finalClinicNumbers?.length || 0}`);
    console.log(`✅ Conversas: ${finalConversations?.length || 0}`);
    console.log(`✅ Mensagens: ${finalMessages?.length || 0}`);

    console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('==================================');
    console.log('📋 Próximos passos:');
    console.log('1. Executar SQL manualmente no Supabase Dashboard');
    console.log('2. Testar frontend com nova estrutura');
    console.log('3. Implementar webhook para processar mensagens reais');

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  }
}

testImprovedStructure(); 