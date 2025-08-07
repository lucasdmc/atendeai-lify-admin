// ========================================
// TESTE DA CORREÇÃO DO SALVAMENTO DE RESPOSTAS
// ========================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

async function testResponseSavingFix() {
  console.log('🧪 TESTANDO CORREÇÃO DO SALVAMENTO DE RESPOSTAS');
  console.log('================================================');

  // 1. SIMULAR DADOS REAIS
  console.log('\n📋 1. SIMULANDO DADOS REAIS');
  
  const conversationId = '82e5c075-690e-4997-b899-b86b31838ca8'; // Conversa existente
  const senderPhone = '554730915628'; // Número do chatbot (quem ENVIA)
  const receiverPhone = '5547997192447'; // Número do paciente (quem RECEBE)
  const content = 'Teste de correção - resposta do chatbot';
  const messageType = 'sent';
  const whatsappMessageId = 'test_response_fix_' + Date.now();

  console.log('📊 Dados de teste:', {
    conversationId,
    senderPhone,
    receiverPhone,
    content,
    messageType,
    whatsappMessageId
  });

  // 2. TESTAR SALVAMENTO CORRETO
  console.log('\n📋 2. TESTANDO SALVAMENTO CORRETO');
  
  try {
    const { data: result, error } = await supabase
      .from('whatsapp_messages_improved')
      .insert({
        conversation_id: conversationId,
        sender_phone: senderPhone, // Número do chatbot (quem ENVIA)
        receiver_phone: receiverPhone, // Número do paciente (quem RECEBE)
        content: content,
        message_type: messageType,
        whatsapp_message_id: whatsappMessageId
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar resposta:', error);
      return;
    }

    console.log('✅ Resposta salva com sucesso:', {
      id: result.id,
      conversationId: result.conversation_id,
      senderPhone: result.sender_phone,
      receiverPhone: result.receiver_phone,
      content: result.content,
      messageType: result.message_type
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }

  // 3. VERIFICAR DADOS NO BANCO
  console.log('\n📋 3. VERIFICANDO DADOS NO BANCO');
  
  const { data: recentMessages, error: msgError } = await supabase
    .from('whatsapp_messages_improved')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (recentMessages) {
    console.log('📊 Últimas mensagens da conversa:', recentMessages.length);
    recentMessages.forEach(msg => {
      console.log(`   - ${msg.sender_phone} -> ${msg.receiver_phone}: ${msg.content.substring(0, 50)}... (${msg.message_type})`);
    });
  }

  // 4. VERIFICAR CONVERSA
  console.log('\n📋 4. VERIFICANDO CONVERSA');
  
  const { data: conversation, error: convError } = await supabase
    .from('whatsapp_conversations_improved')
    .select('*')
    .eq('id', conversationId)
    .single();

  if (conversation) {
    console.log('📊 Dados da conversa:', {
      id: conversation.id,
      patientPhone: conversation.patient_phone_number,
      clinicWhatsapp: conversation.clinic_whatsapp_number,
      lastMessage: conversation.last_message_preview,
      unreadCount: conversation.unread_count
    });
  }

  // 5. ANÁLISE DOS PROBLEMAS ANTERIORES
  console.log('\n📋 5. ANÁLISE DOS PROBLEMAS ANTERIORES');
  
  const { data: problematicMessages, error: probError } = await supabase
    .from('whatsapp_messages_improved')
    .select('*')
    .is('conversation_id', null)
    .eq('message_type', 'sent')
    .limit(3);

  if (problematicMessages) {
    console.log('🚨 Mensagens problemáticas (conversation_id = null):');
    problematicMessages.forEach(msg => {
      console.log(`   - ${msg.sender_phone} -> ${msg.receiver_phone}: ${msg.content.substring(0, 50)}...`);
      console.log(`     Problema: conversation_id = ${msg.conversation_id}`);
    });
  }

  console.log('\n✅ TESTE CONCLUÍDO');
  console.log('💡 A correção deve resolver o problema de conversation_id = null');
}

// Executar teste
testResponseSavingFix().catch(console.error); 