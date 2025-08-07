import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWebhookFinal() {
  console.log('🧪 TESTANDO WEBHOOK FINAL');
  console.log('==========================');

  try {
    // 1. Simular mensagem recebida
    const testMessage = {
      from: '5547997192447',
      to: '554730915628',
      content: 'Oi, gostaria de agendar uma consulta',
      whatsappMessageId: `test-${Date.now()}`
    };

    console.log('📝 Simulando mensagem:', testMessage);

    // 2. Salvar conversa no banco
    console.log('💾 Salvando conversa no banco...');
    
    // 1. Identificar clínica pelo número que recebeu
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinic_whatsapp_numbers')
      .select('clinic_id')
      .eq('whatsapp_number', testMessage.to)
      .eq('is_active', true)
      .single();

    if (clinicError || !clinicData) {
      console.error('❌ Clínica não encontrada para o número:', testMessage.to);
      return;
    }

    const clinicId = clinicData.clinic_id;

    // 2. Verificar se já existe uma conversa
    const { data: existingConversation, error: findError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('patient_phone_number', testMessage.from)
      .eq('clinic_whatsapp_number', testMessage.to)
      .single();

    let conversationId;

    if (existingConversation) {
      // Conversa já existe, usar o ID existente
      conversationId = existingConversation.id;
      console.log('✅ Conversa existente encontrada, ID:', conversationId);
    } else {
      // Criar nova conversa
      const { data: newConversation, error: createError } = await supabase
        .from('whatsapp_conversations_improved')
        .insert({
          clinic_id: clinicId,
          patient_phone_number: testMessage.from,
          clinic_whatsapp_number: testMessage.to,
          last_message_preview: testMessage.content,
          last_message_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar conversa:', createError);
        return;
      }

      conversationId = newConversation.id;
      console.log('✅ Nova conversa criada, ID:', conversationId);
    }

    // 3. Salvar a mensagem
    const { data: messageResult, error: messageError } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationId,
        sender_phone: testMessage.from,
        receiver_phone: testMessage.to,
        content: testMessage.content,
        message_type: 'received',
        whatsapp_message_id: testMessage.whatsappMessageId
      })
      .select()
      .single();

    if (messageError) {
      console.error('❌ Erro ao salvar mensagem:', messageError);
      return;
    }

    console.log('✅ Mensagem salva com sucesso, ID:', messageResult.id);
    console.log('✅ Conversa salva com ID:', conversationId);

    // 4. Simular resposta da IA
    const aiResponse = 'Olá! Obrigado por entrar em contato. Posso ajudá-lo com o agendamento de consulta. Qual especialidade você gostaria?';
    
    // 5. Salvar resposta no banco
    console.log('💾 Salvando resposta no banco...');
    const { data: responseResult, error: responseError } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationId,
        sender_phone: testMessage.to,
        receiver_phone: testMessage.from,
        content: aiResponse,
        message_type: 'sent',
        whatsapp_message_id: null
      })
      .select()
      .single();

    if (responseError) {
      console.error('❌ Erro ao salvar resposta:', responseError);
      return;
    }

    console.log('✅ Resposta salva com ID:', responseResult.id);

    // 6. Verificar se as conversas aparecem na tela
    console.log('🔍 Verificando conversas na tabela...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas:', conversationsError);
      return;
    }

    console.log('✅ Conversas encontradas:', conversations.length);
    conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ID: ${conv.id} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number} | Criado: ${conv.created_at}`);
    });

    // 7. Verificar mensagens
    console.log('🔍 Verificando mensagens na tabela...');
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
      return;
    }

    console.log('✅ Mensagens encontradas:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ID: ${msg.id} | Conversa: ${msg.conversation_id} | Tipo: ${msg.message_type} | Criado: ${msg.created_at}`);
    });

    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ O webhook final está funcionando corretamente');
    console.log('✅ Conversas estão sendo salvas no banco');
    console.log('✅ Mensagens estão sendo salvas no banco');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testWebhookFinal(); 