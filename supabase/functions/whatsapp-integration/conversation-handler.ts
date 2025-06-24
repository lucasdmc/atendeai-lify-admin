
export async function fetchConversationData(phoneNumber: string, supabase: any) {
  console.log('📞 Buscando dados da conversa...');
  
  // Buscar ID da conversa
  const { data: conversationData, error: convError } = await supabase
    .from('whatsapp_conversations')
    .select('id, escalated_to_human')
    .eq('phone_number', phoneNumber)
    .single();

  if (convError || !conversationData) {
    console.error('❌ Erro ao buscar conversa:', convError);
    throw new Error('Conversa não encontrada');
  }

  return conversationData;
}

export async function fetchContextData(supabase: any) {
  console.log('🏥 Buscando contexto da clínica...');
  
  const { data: contextData, error: contextError } = await supabase
    .from('contextualization_data')
    .select('question, answer')
    .order('order_number');

  if (contextError) {
    console.error('❌ Erro ao buscar contexto:', contextError);
    return [];
  }

  console.log(`✅ Contexto encontrado: ${contextData?.length || 0} itens`);
  return contextData || [];
}

export async function fetchConversationHistory(conversationId: string, supabase: any) {
  console.log('📝 Buscando histórico da conversa...');
  
  const { data: messages, error: messagesError } = await supabase
    .from('whatsapp_messages')
    .select('content, message_type, timestamp')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: false })
    .limit(10);

  if (messagesError) {
    console.error('❌ Erro ao buscar histórico:', messagesError);
    return [];
  }

  console.log(`✅ Histórico encontrado: ${messages?.length || 0} mensagens`);
  return messages || [];
}

export function checkIfEscalated(conversationData: any): boolean {
  return conversationData.escalated_to_human;
}

export function getEscalationMessage(): string {
  return `Sua conversa foi transferida para um atendente humano. Nossa equipe entrará em contato em breve para dar continuidade ao seu atendimento. 

Para urgências, entre em contato pelo telefone da clínica.`;
}
