
import { processAndRespondWithAI } from './ai-processor.ts';
import { corsHeaders } from './config.ts';

export async function handleWebhook(data: any, supabase: any) {
  console.log('=== PROCESSANDO WEBHOOK ===');
  console.log('📥 Dados do webhook recebidos:', JSON.stringify(data, null, 2));

  try {
    if (data.event === 'message.received' && data.data) {
      console.log('✅ Evento de mensagem recebida detectado');
      console.log('📱 Dados da mensagem:', JSON.stringify(data.data, null, 2));
      
      const messageContent = data.data.message || 'Mensagem não suportada';
      const fromNumber = data.data.from;
      
      // Extrair nome do contato
      const contactName = extractContactName(data.data, fromNumber);
      
      console.log(`📞 Mensagem de: ${fromNumber}`);
      console.log(`👤 Nome do contato final: ${contactName || 'Não encontrado'}`);
      console.log(`💬 Conteúdo: ${messageContent}`);

      // Buscar ou criar conversa
      const conversationId = await findOrCreateConversation(fromNumber, contactName, messageContent, supabase);

      // Salvar mensagem recebida
      await saveReceivedMessage(conversationId, messageContent, data.data.timestamp, supabase);

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

function extractContactName(messageData: any, fromNumber: string): string | null {
  console.log('🔍 Analisando dados de contato disponíveis:', {
    pushName: messageData.pushName,
    notifyName: messageData.notifyName,
    contactName: messageData.contactName,
    senderName: messageData.senderName,
    contact: messageData.contact,
    author: messageData.author,
    participant: messageData.participant
  });
  
  // Tentar diferentes campos para o nome, em ordem de prioridade
  const nameFields = [
    messageData.pushName,
    messageData.notifyName,
    messageData.senderName,
    messageData.contactName,
    messageData.contact?.name,
    messageData.contact?.verifiedName,
    messageData.contact?.pushname,
    messageData.author,
    messageData.participant
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
      const contactName = nameField.trim();
      console.log(`👤 Nome do contato encontrado: ${contactName} (campo: ${nameField})`);
      return contactName;
    }
  }
  
  console.log('❌ Nenhum nome válido encontrado nos dados do webhook');
  return null;
}

async function findOrCreateConversation(fromNumber: string, contactName: string | null, messageContent: string, supabase: any): Promise<string> {
  // Primeiro, buscar conversa existente
  console.log('🔍 Buscando conversa existente...');
  const { data: existingConversation, error: fetchError } = await supabase
    .from('whatsapp_conversations')
    .select('id, name')
    .eq('phone_number', fromNumber)
    .single();

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

    console.log('✅ Nova conversa criada com ID:', newConversation.id);
    return newConversation.id;
  } else if (fetchError) {
    console.error('❌ Erro ao buscar conversa:', fetchError);
    throw fetchError;
  } else {
    console.log('✅ Conversa existente encontrada com ID:', existingConversation.id);

    // Atualizar a conversa existente
    const updateData: any = {
      last_message_preview: messageContent.substring(0, 100),
      updated_at: new Date().toISOString()
    };

    // Atualizar nome do contato se necessário
    if (contactName && shouldUpdateContactName(existingConversation.name, fromNumber)) {
      updateData.name = contactName;
      console.log(`📝 Atualizando nome do contato na conversa existente: ${contactName}`);
    }

    const { error: updateError } = await supabase
      .from('whatsapp_conversations')
      .update(updateData)
      .eq('id', existingConversation.id);
      
    if (updateError) {
      console.error('❌ Erro ao atualizar conversa:', updateError);
    }

    return existingConversation.id;
  }
}

function shouldUpdateContactName(existingName: string | null, phoneNumber: string): boolean {
  return !existingName || 
         existingName === phoneNumber || 
         existingName.includes('@s.whatsapp.net') ||
         existingName.includes('@c.us');
}

async function saveReceivedMessage(conversationId: string, messageContent: string, timestamp: number | undefined, supabase: any) {
  console.log('💾 Salvando mensagem recebida no banco...');
  const { error: messageError } = await supabase
    .from('whatsapp_messages')
    .insert({
      conversation_id: conversationId,
      content: messageContent,
      message_type: 'received',
      whatsapp_message_id: `msg_${timestamp || Date.now()}`
    });

  if (messageError) {
    console.error('❌ Erro ao salvar mensagem:', messageError);
  } else {
    console.log('✅ Mensagem salva no banco');
  }
}
