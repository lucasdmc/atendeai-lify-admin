
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
        message_type: 'sent',
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
      
      // Melhorar a captura do nome do contato com mais opções
      let contactName = null;
      
      console.log('🔍 Analisando dados de contato disponíveis:', {
        pushName: data.data.pushName,
        notifyName: data.data.notifyName,
        contactName: data.data.contactName,
        senderName: data.data.senderName,
        contact: data.data.contact,
        author: data.data.author,
        participant: data.data.participant
      });
      
      // Tentar diferentes campos para o nome, em ordem de prioridade
      const nameFields = [
        data.data.pushName,
        data.data.notifyName,
        data.data.senderName,
        data.data.contactName,
        data.data.contact?.name,
        data.data.contact?.verifiedName,
        data.data.contact?.pushname,
        data.data.author,
        data.data.participant
      ];
      
      for (const nameField of nameFields) {
        if (nameField && 
            typeof nameField === 'string' && 
            nameField.trim() && 
            nameField !== fromNumber &&
            !nameField.includes('@s.whatsapp.net') &&
            !nameField.includes('@c.us') &&
            nameField !== 'null' &&
            nameField !== 'undefined') {
          contactName = nameField.trim();
          console.log(`👤 Nome do contato encontrado: ${contactName} (campo: ${nameField})`);
          break;
        }
      }
      
      if (!contactName) {
        console.log('❌ Nenhum nome válido encontrado nos dados do webhook');
      }
      
      console.log(`📞 Mensagem de: ${fromNumber}`);
      console.log(`👤 Nome do contato final: ${contactName || 'Não encontrado'}`);
      console.log(`💬 Conteúdo: ${messageContent}`);

      // Primeiro, buscar ou criar a conversa usando o número de telefone
      const { data: existingConversation, error: fetchError } = await supabase
        .from('whatsapp_conversations')
        .select('id, name')
        .eq('phone_number', fromNumber)
        .single();

      let conversationId: string;

      if (fetchError && fetchError.code === 'PGRST116') {
        // Conversa não existe, criar uma nova
        console.log('📝 Criando nova conversa...');
        const conversationData: any = {
          phone_number: fromNumber,
          last_message_preview: messageContent.substring(0, 100),
          updated_at: new Date().toISOString()
        };

        // Adicionar nome do contato se disponível e válido
        if (contactName) {
          conversationData.name = contactName;
          console.log(`📝 Nome do contato salvo na nova conversa: ${contactName}`);
        }

        const { data: newConversation, error: createError } = await supabase
          .from('whatsapp_conversations')
          .insert(conversationData)
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Erro ao criar conversa:', createError);
          throw createError;
        }

        conversationId = newConversation.id;
        console.log('✅ Nova conversa criada com ID:', conversationId);
      } else if (fetchError) {
        console.error('❌ Erro ao buscar conversa:', fetchError);
        throw fetchError;
      } else {
        conversationId = existingConversation.id;
        console.log('✅ Conversa existente encontrada com ID:', conversationId);

        // Atualizar a conversa existente
        const updateData: any = {
          last_message_preview: messageContent.substring(0, 100),
          updated_at: new Date().toISOString()
        };

        // Atualizar nome do contato se:
        // 1. Temos um nome válido no webhook atual
        // 2. E (não temos nome salvo OU o nome salvo é igual ao número OU contém @)
        if (contactName && (
            !existingConversation.name || 
            existingConversation.name === fromNumber || 
            existingConversation.name.includes('@s.whatsapp.net') ||
            existingConversation.name.includes('@c.us')
        )) {
          updateData.name = contactName;
          console.log(`📝 Atualizando nome do contato na conversa existente: ${contactName}`);
        }

        const { error: updateError } = await supabase
          .from('whatsapp_conversations')
          .update(updateData)
          .eq('id', conversationId);
          
        if (updateError) {
          console.error('❌ Erro ao atualizar conversa:', updateError);
        }
      }

      // Salvar mensagem recebida
      console.log('💾 Salvando mensagem no banco...');
      const { error: messageError } = await supabase
        .from('whatsapp_messages')
        .insert({
          conversation_id: conversationId,
          content: messageContent,
          message_type: 'received',
          whatsapp_message_id: `msg_${data.data.timestamp || Date.now()}`
        });

      if (messageError) {
        console.error('❌ Erro ao salvar mensagem:', messageError);
      } else {
        console.log('✅ Mensagem salva no banco');
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
