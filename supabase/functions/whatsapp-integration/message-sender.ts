
import { corsHeaders, WHATSAPP_SERVER_URL } from './config.ts';

export async function sendMessage(to: string, message: string, supabase: any) {
  console.log(`📤 === ENVIANDO MENSAGEM ===`);
  console.log(`📞 Para: ${to}`);
  console.log(`💬 Mensagem: ${message}`);
  console.log(`🔗 WHATSAPP_SERVER_URL: ${WHATSAPP_SERVER_URL}`);

  if (!WHATSAPP_SERVER_URL) {
    console.error('❌ WHATSAPP_SERVER_URL não configurado');
    throw new Error('WhatsApp server not configured');
  }

  try {
    const sendUrl = `${WHATSAPP_SERVER_URL}/api/whatsapp/send-message`;
    console.log(`🚀 Enviando para URL: ${sendUrl}`);
    
    console.log('📋 Request payload:', JSON.stringify({
      to: to,
      message: message
    }, null, 2));
    
    const response = await fetch(sendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: to,
        message: message
      })
    });

    console.log(`📡 Status da resposta: ${response.status}`);
    console.log(`📡 Status text: ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`❌ Erro na resposta (${response.status}): ${errorData}`);
      
      let errorMessage = `Failed to send message: ${response.status}`;
      
      try {
        const parsedError = JSON.parse(errorData);
        if (parsedError.error) {
          errorMessage = parsedError.error;
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse error response as JSON');
        errorMessage = errorData || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Mensagem enviada com sucesso:', result);

    // Save message to database
    await saveMessageToDatabase(to, message, result.messageId, supabase);

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      status: 'sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro crítico ao enviar mensagem:', error);
    
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

async function saveMessageToDatabase(to: string, message: string, messageId: string, supabase: any) {
  // Find conversation ID
  console.log('🔍 Buscando conversa para salvar mensagem...');
  const { data: conversationData, error: conversationFetchError } = await supabase
    .from('whatsapp_conversations')
    .select('id')
    .eq('phone_number', to)
    .single();

  if (conversationFetchError) {
    console.error('❌ Erro ao buscar conversa:', conversationFetchError);
    throw new Error('Conversation not found');
  }

  console.log('✅ Conversa encontrada ID:', conversationData.id);

  // Save message to database
  console.log('💾 Salvando mensagem no banco...');
  const { error } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversationData.id,
      content: message,
      message_type: 'sent',
      whatsapp_message_id: messageId || `msg_${Date.now()}`
    });

  if (error) {
    console.error('❌ Erro ao salvar mensagem no banco:', error);
  } else {
    console.log('✅ Mensagem salva no banco com sucesso');
  }

  // Update conversation
  console.log('🔄 Atualizando última mensagem da conversa...');
  const { error: updateError } = await supabase
    .from('whatsapp_conversations')
    .update({
      last_message_preview: message.substring(0, 100),
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationData.id);

  if (updateError) {
    console.error('❌ Erro ao atualizar conversa:', updateError);
  } else {
    console.log('✅ Conversa atualizada com sucesso');
  }
}
