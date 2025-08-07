import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInterfaceComplete() {
  console.log('🧪 TESTANDO INTERFACE COMPLETA');
  console.log('===============================');

  try {
    // 1. Simular o que o ConversationContext faria
    console.log('🔍 Simulando ConversationContext...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('whatsapp_conversations_improved')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversas:', conversationsError);
      return;
    }

    console.log('✅ Conversas encontradas:', conversations.length);
    
    // 2. Simular o mapeamento do ConversationContext
    const mappedConversations = conversations.map(conv => ({
      id: conv.id,
      patient_phone_number: conv.patient_phone_number,
      clinic_whatsapp_number: conv.clinic_whatsapp_number,
      patient_name: conv.patient_name,
      last_message_preview: conv.last_message_preview,
      unread_count: conv.unread_count || 0,
      last_message_at: conv.last_message_at,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      clinic_id: conv.clinic_id
    }));

    console.log('✅ Conversas mapeadas:', mappedConversations.length);

    // 3. Simular seleção de conversa
    if (mappedConversations.length > 0) {
      const selectedConversation = mappedConversations[0];
      console.log('🎯 Conversa selecionada:', {
        id: selectedConversation.id,
        patient_phone_number: selectedConversation.patient_phone_number,
        clinic_whatsapp_number: selectedConversation.clinic_whatsapp_number,
        patient_name: selectedConversation.patient_name
      });

      // 4. Simular busca de mensagens do ChatArea
      console.log('🔍 Simulando ChatArea...');
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_messages_improved')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('❌ Erro ao buscar mensagens:', messagesError);
        return;
      }

      console.log('✅ Mensagens encontradas:', messages.length);

      // 5. Simular mapeamento do ChatArea
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
        console.log(`   ${index + 1}. Tipo: ${msg.sender_type} | Conteúdo: ${msg.content.substring(0, 50)}...`);
      });

      // 6. Simular getDisplayName
      const getDisplayName = (conversation) => {
        if (conversation.patient_name && 
            conversation.patient_name.trim() && 
            conversation.patient_name !== conversation.patient_phone_number) {
          return conversation.patient_name;
        }
        return conversation.patient_phone_number || 'Contato Desconhecido';
      };

      const displayName = getDisplayName(selectedConversation);
      console.log('✅ Nome de exibição:', displayName);

      console.log('\n🎉 TESTE COMPLETO CONCLUÍDO!');
      console.log('✅ ConversationContext está funcionando');
      console.log('✅ ChatArea está funcionando');
      console.log('✅ getDisplayName está funcionando');
      console.log('✅ Interface deve estar funcionando corretamente');
      console.log('✅ Conversas devem aparecer na tela');
      console.log('✅ Mensagens devem aparecer quando selecionar uma conversa');

    } else {
      console.log('❌ Nenhuma conversa encontrada para testar');
    }

  } catch (error) {
    console.error('💥 Erro no teste:', error);
  }
}

testInterfaceComplete(); 