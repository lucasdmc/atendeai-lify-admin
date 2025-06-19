import { corsHeaders, WHATSAPP_SERVER_URL } from './config.ts';
import { processAndRespondWithAI } from './ai-processor.ts';
import type { WhatsappMessage } from './types.ts';

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
      
      // Verificar tipos específicos de erro
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

    // Buscar o ID da conversa existente na tabela
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

    // Salvar mensagem no banco usando o ID correto da conversa
    console.log('💾 Salvando mensagem no banco...');
    const { error } = await supabase
      .from('whatsapp_messages')
      .insert({
        conversation_id: conversationData.id,
        content: message,
        message_type: 'sent',
        whatsapp_message_id: result.messageId || `msg_${Date.now()}`
      });

    if (error) {
      console.error('❌ Erro ao salvar mensagem no banco:', error);
    } else {
      console.log('✅ Mensagem salva no banco com sucesso');
    }

    // Atualizar conversa
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

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      status: 'sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro crítico ao enviar mensagem:', error);
    
    // Log detalhado do erro
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

export async function handleWebhook(data: any, supabase: any) {
  console.log('=== PROCESSANDO WEBHOOK ===');
  console.log('📥 Dados do webhook recebidos:', JSON.stringify(data, null, 2));

  try {
    if (data.event === 'message.received' && data.data) {
      console.log('✅ Evento de mensagem recebida detectado');
      console.log('📱 Dados da mensagem:', JSON.stringify(data.data, null, 2));
      
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
      console.log('🔍 Buscando conversa existente...');
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
      console.log('💾 Salvando mensagem recebida no banco...');
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
      try {
        await processAndRespondWithAI(fromNumber, messageContent, supabase);
        console.log('✅ Processamento com IA concluído');
      } catch (aiError) {
        console.error('❌ Erro no processamento com IA:', aiError);
      }
    } else {
      console.log('ℹ️ Webhook recebido mas não é uma mensagem:', data.event || 'evento não identificado');
      console.log('📄 Dados completos do webhook:', JSON.stringify(data, null, 2));
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Erro crítico ao processar webhook:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
