
export class ContactManager {
  static extractContactName(webhookData: any): string | null {
    console.log('🔍 Analisando dados de contato disponíveis:', {
      pushName: webhookData.pushName,
      notifyName: webhookData.notifyName,
      contactName: webhookData.contactName,
      senderName: webhookData.senderName,
      contact: webhookData.contact,
      author: webhookData.author,
      participant: webhookData.participant
    });
    
    // Try different fields for name, in order of priority
    const nameFields = [
      webhookData.pushName,
      webhookData.notifyName,
      webhookData.senderName,
      webhookData.contactName,
      webhookData.contact?.name,
      webhookData.contact?.verifiedName,
      webhookData.contact?.pushname,
      webhookData.author,
      webhookData.participant
    ];
    
    for (const nameField of nameFields) {
      if (nameField && 
          typeof nameField === 'string' && 
          nameField.trim() && 
          nameField !== webhookData.from &&
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

  static async findOrCreateConversation(fromNumber: string, contactName: string | null, messageContent: string, supabase: any): Promise<string> {
    console.log('🔍 Buscando conversa existente...');
    const { data: existingConversation, error: fetchError } = await supabase
      .from('whatsapp_conversations')
      .select('id, name')
      .eq('phone_number', fromNumber)
      .single();

    let conversationId: string;

    if (fetchError && fetchError.code === 'PGRST116') {
      // Conversation doesn't exist, create new one
      console.log('📝 Criando nova conversa...');
      const conversationData: any = {
        phone_number: fromNumber,
        last_message_preview: messageContent.substring(0, 100),
        updated_at: new Date().toISOString()
      };

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

      // Update existing conversation
      const updateData: any = {
        last_message_preview: messageContent.substring(0, 100),
        updated_at: new Date().toISOString()
      };

      // Update contact name if we have a valid name and current name is not good
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

    return conversationId;
  }

  static async saveReceivedMessage(conversationId: string, messageContent: string, timestamp: number, supabase: any) {
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
}
