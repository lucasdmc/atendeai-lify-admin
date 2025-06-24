
export function detectHumanRequest(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Palavras-chave que indicam pedido para falar com humano
  const humanKeywords = [
    'falar com humano',
    'quero humano',
    'atendente humano',
    'pessoa real',
    'não quero bot',
    'quero atendimento',
    'transferir para humano',
    'humano por favor',
    'preciso de humano',
    'não é bot',
    'conversar com pessoa',
    'atendimento humano',
    'sem bot',
    'sem robô',
    'sem robo'
  ];
  
  // Verifica se a mensagem contém alguma das palavras-chave
  return humanKeywords.some(keyword => lowerMessage.includes(keyword));
}

export async function escalateToHumanImmediately(conversationId: string, reason: string, supabase: any): Promise<void> {
  try {
    console.log('🆘 Escalando conversa imediatamente para humano:', conversationId);
    
    // Marcar conversa como escalada
    await supabase
      .from('whatsapp_conversations')
      .update({
        escalated_to_human: true,
        escalation_reason: reason,
        escalated_at: new Date().toISOString(),
        loop_counter: 0,
        consecutive_same_responses: 0
      })
      .eq('id', conversationId);

    // Registrar evento de escalação
    await supabase
      .from('whatsapp_loop_events')
      .insert({
        conversation_id: conversationId,
        event_type: 'escalated_to_human',
        message_content: reason,
        ai_response: '',
        loop_count: 0
      });

    console.log('✅ Conversa escalada com sucesso para humano');
  } catch (error) {
    console.error('❌ Erro ao escalar conversa para humano:', error);
    throw error;
  }
}
