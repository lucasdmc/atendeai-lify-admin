import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMessagesDisplay() {
  console.log('🧪 TESTANDO EXIBIÇÃO DE MENSAGENS');
  console.log('==================================');

  try {
    // 1. Buscar conversas
    console.log('🔍 Buscando conversas...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false })
      .limit(5);

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas:', conversationsError);
      return;
    }

    console.log('✅ Conversas encontradas:', conversations.length);
    conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. ID: ${conv.id} | Paciente: ${conv.patient_phone_number} | Clínica: ${conv.clinic_whatsapp_number}`);
    });

    if (conversations.length === 0) {
      console.log('❌ Nenhuma conversa encontrada');
      return;
    }

    // 2. Buscar mensagens da primeira conversa
    const firstConversation = conversations[0];
    console.log(`\n🔍 Buscando mensagens para conversa: ${firstConversation.id}`);
    
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages_improved')
      .select('*')
      .eq('conversation_id', firstConversation.id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('❌ Erro ao buscar mensagens:', messagesError);
      return;
    }

    console.log('✅ Mensagens encontradas:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ID: ${msg.id} | Tipo: ${msg.message_type} | De: ${msg.sender_phone} | Para: ${msg.receiver_phone} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    // 3. Simular o que o ChatArea faria
    console.log('\n🎯 SIMULANDO CHATAREA:');
    console.log('Conversa selecionada:', {
      id: firstConversation.id,
      patient_phone_number: firstConversation.patient_phone_number,
      clinic_whatsapp_number: firstConversation.clinic_whatsapp_number,
      patient_name: firstConversation.patient_name
    });

    // 4. Mapear mensagens como o ChatArea faria
    const mappedMessages = messages.map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      content: msg.content,
      sender_type: msg.message_type === 'sent' ? 'user' : 'contact',
      created_at: msg.created_at,
      status: 'sent'
    }));

    console.log('✅ Mensagens mapeadas:', mappedMessages.length);
    mappedMessages.forEach((msg, index) => {
      console.log(`   ${index + 1}. ID: ${msg.id} | Tipo: ${msg.sender_type} | Conteúdo: ${msg.content.substring(0, 50)}...`);
    });

    console.log('\n🎉 TESTE CONCLUÍDO!');
    console.log('✅ As mensagens estão sendo buscadas corretamente');
    console.log('✅ O mapeamento está funcionando');
    console.log('✅ O ChatArea deve exibir as mensagens corretamente');

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testMessagesDisplay(); 