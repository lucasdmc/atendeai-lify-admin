
export async function detectAndHandleLoop(conversationId: string, response: string, supabase: any) {
  try {
    console.log('🔍 Iniciando detecção de loop...');
    
    // Buscar estado atual da conversa
    const { data: conversation, error } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !conversation) {
      console.error('❌ Erro ao buscar conversa para loop:', error);
      return { shouldEscalate: false, alternativeResponse: null, finalResponse: response };
    }

    // Se já está escalado, retornar mensagem de transferência
    if (conversation.escalated_to_human) {
      return {
        shouldEscalate: true,
        finalResponse: `Sua conversa foi transferida para um atendente humano. Nossa equipe entrará em contato em breve. Para urgências, ligue para a clínica.`
      };
    }

    // Verificar se é a mesma resposta consecutiva
    const isSameResponse = conversation.last_ai_response === response;
    const consecutiveCount = isSameResponse ? (conversation.consecutive_same_responses || 0) + 1 : 1;
    const loopCount = isSameResponse ? (conversation.loop_counter || 0) + 1 : (conversation.loop_counter || 0);

    console.log('🔍 Estado do loop:', {
      isSameResponse,
      consecutiveCount,
      loopCount,
      lastResponse: conversation.last_ai_response?.substring(0, 50) + '...'
    });

    // Atualizar estado da conversa
    await supabase
      .from('whatsapp_conversations')
      .update({
        last_ai_response: response,
        consecutive_same_responses: consecutiveCount,
        loop_counter: loopCount
      })
      .eq('id', conversationId);

    // Detectar loop (3+ respostas iguais consecutivas)
    if (consecutiveCount >= 3) {
      console.log('🚨 Loop detectado! Respostas consecutivas:', consecutiveCount);
      
      // Registrar evento de loop
      await supabase
        .from('whatsapp_loop_events')
        .insert({
          conversation_id: conversationId,
          event_type: 'loop_detected',
          ai_response: response,
          loop_count: loopCount
        });

      // Se já tentou muito, escalar
      if (loopCount >= 3) {
        console.log('🆘 Escalando para atendimento humano');
        
        await supabase
          .from('whatsapp_conversations')
          .update({
            escalated_to_human: true,
            escalation_reason: `Loop detectado - ${consecutiveCount} respostas repetitivas`,
            escalated_at: new Date().toISOString()
          })
          .eq('id', conversationId);

        await supabase
          .from('whatsapp_loop_events')
          .insert({
            conversation_id: conversationId,
            event_type: 'escalated_to_human',
            ai_response: response,
            loop_count: loopCount
          });

        return {
          shouldEscalate: true,
          finalResponse: `Percebo que estou tendo dificuldades para ajudá-lo adequadamente. Vou transferir sua conversa para um atendente humano que poderá auxiliá-lo melhor.

Nossa equipe entrará em contato em breve. Para urgências, entre em contato pelo telefone da clínica.`
        };
      } else {
        // Tentar resposta alternativa
        const alternativeResponse = getAlternativeResponse(response);
        console.log('🔄 Usando resposta alternativa');
        
        await supabase
          .from('whatsapp_loop_events')
          .insert({
            conversation_id: conversationId,
            event_type: 'response_varied',
            ai_response: alternativeResponse,
            loop_count: loopCount
          });

        return { shouldEscalate: false, alternativeResponse };
      }
    }

    return { shouldEscalate: false, alternativeResponse: null, finalResponse: response };
  } catch (error) {
    console.error('❌ Erro na detecção de loop:', error);
    return { shouldEscalate: false, alternativeResponse: null, finalResponse: response };
  }
}

export function getAlternativeResponse(originalResponse: string): string {
  const responseVariations = {
    greeting: [
      "Olá! Como posso ajudá-lo hoje?",
      "Oi! Em que posso ser útil?",
      "Bem-vindo! Como posso auxiliá-lo?",
      "Olá! Estou aqui para ajudar. O que você precisa?"
    ],
    appointment: [
      "Vou te ajudar com o agendamento. Preciso de algumas informações:",
      "Para marcar sua consulta, me informe os dados necessários:",
      "Perfeito! Vamos agendar sua consulta. Me forneça:",
      "Ótimo! Para confirmar o agendamento, preciso que me informe:"
    ],
    clarification: [
      "Não entendi completamente. Pode reformular sua pergunta?",
      "Desculpe, preciso de mais detalhes para ajudá-lo melhor.",
      "Pode explicar de forma diferente? Quero garantir que entendi corretamente.",
      "Preciso de mais informações para te dar a melhor resposta possível."
    ],
    general: [
      "Entendi. Como posso ajudá-lo de forma diferente?",
      "Vamos tentar uma abordagem diferente. O que você gostaria de saber?",
      "Deixe-me reformular: em que exatamente posso ajudá-lo?",
      "Posso explicar de outra forma. Qual sua dúvida principal?"
    ]
  };

  // Categorizar resposta e retornar alternativa
  const lowerResponse = originalResponse.toLowerCase();
  
  if (lowerResponse.includes('olá') || lowerResponse.includes('bem-vindo')) {
    return getRandomResponse(responseVariations.greeting);
  } else if (lowerResponse.includes('agendar') || lowerResponse.includes('consulta')) {
    return getRandomResponse(responseVariations.appointment);
  } else if (lowerResponse.includes('não entendi') || lowerResponse.includes('reformular')) {
    return getRandomResponse(responseVariations.clarification);
  } else {
    return getRandomResponse(responseVariations.general);
  }
}

function getRandomResponse(responses: string[]): string {
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}
