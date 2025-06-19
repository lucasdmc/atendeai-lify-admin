
import { corsHeaders, WHATSAPP_SERVER_URL } from './config.ts';
import { processAndRespondWithAI } from './ai-processor.ts';
import type { WhatsappMessage } from './types.ts';

export async function sendMessage(to: string, message: string, supabase: any) {
  if (!WHATSAPP_SERVER_URL) {
    throw new Error('WhatsApp server not configured');
  }

  try {
    console.log(`Sending WhatsApp message to ${to}: ${message}`);
    
    const response = await fetch(`${WHATSAPP_SERVER_URL}/api/whatsapp/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: to,
        message: message
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }

    const result = await response.json();
    console.log('Message sent successfully:', result);

    // Buscar o ID da conversa existente na tabela
    const { data: conversationData, error: conversationFetchError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', to)
      .single();

    if (conversationFetchError) {
      console.error('Error fetching conversation:', conversationFetchError);
      throw new Error('Conversation not found');
    }

    console.log('Found conversation ID:', conversationData.id);

    // Salvar mensagem no banco usando o ID correto da conversa
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationData.id,
        content: message,
        message_type: 'outbound',
        whatsapp_message_id: result.messageId || `msg_${Date.now()}`
      });

    if (error) {
      console.error('Error saving message to database:', error);
    } else {
      console.log('Message saved to database successfully');
    }

    // Atualizar conversa
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_message_preview: message.substring(0, 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationData.id);

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      status: 'sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function handleWebhook(data: any, supabase: any) {
  console.log('=== PROCESSANDO WEBHOOK ===');
  console.log('Webhook data received:', JSON.stringify(data, null, 2));

  try {
    if (data.event === 'message.received' && data.data) {
      console.log('✅ Evento de mensagem recebida detectado');
      console.log('Message data:', JSON.stringify(data.data, null, 2));
      
      const messageContent = data.data.message || 'Mensagem não suportada';
      const fromNumber = data.data.from;
      const contactName = data.data.pushName || data.data.notifyName || data.data.contact?.name || null;
      
      console.log(`📞 Mensagem de: ${fromNumber}`);
      console.log(`👤 Nome do contato: ${contactName || 'Não informado'}`);
      console.log(`💬 Conteúdo: ${messageContent}`);

      // Gerar ID único da conversa baseado no número limpo
      const cleanPhone = fromNumber.replace(/[^\d]/g, '');
      const conversationId = `conv_${cleanPhone}`;

      // Salvar mensagem recebida
      console.log('💾 Salvando mensagem no banco...');
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          message_type: 'inbound',
          whatsapp_message_id: `msg_${data.data.timestamp || Date.now()}`
        });

      if (messageError) {
        console.error('❌ Erro ao salvar mensagem:', messageError);
      } else {
        console.log('✅ Mensagem salva no banco');
      }

      // Criar ou atualizar conversa com nome do contato se disponível
      console.log('👤 Atualizando conversa...');
      const conversationData: any = {
        id: conversationId,
        phone_number: fromNumber,
        last_message_preview: messageContent.substring(0, 100),
        updated_at: new Date().toISOString()
      };

      // Adicionar nome do contato se disponível e válido
      if (contactName && contactName.trim() && contactName !== fromNumber) {
        conversationData.name = contactName.trim();
        console.log(`📝 Nome do contato salvo: ${contactName}`);
      }

      const { error: conversationError } = await supabase
        .from('whatsapp_conversations')
        .upsert(conversationData);

      if (conversationError) {
        console.error('❌ Erro ao atualizar conversa:', conversationError);
      } else {
        console.log('✅ Conversa atualizada');
      }

      // PROCESSAR COM IA
      console.log('🤖 Iniciando processamento com IA...');
      await processAndRespondWithAI(fromNumber, messageContent, supabase);
    } else {
      console.log('ℹ️ Webhook recebido mas não é uma mensagem:', data.event || 'evento não identificado');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
