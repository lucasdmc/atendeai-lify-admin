
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleAppointmentRequest } from './appointment-handler.ts';
import { generateAIResponse } from './openai-service.ts';
import { sendMessageWithRetry } from './message-retry.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  try {
    // Buscar ID da conversa
    const { data: conversationData, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id, escalated_to_human')
      .eq('phone_number', phoneNumber)
      .single();

    if (convError || !conversationData) {
      console.error('❌ Erro ao buscar conversa:', convError);
      return;
    }

    const conversationId = conversationData.id;

    // Verificar se já está escalado para humano
    if (conversationData.escalated_to_human) {
      console.log('🚨 Conversa escalada - enviando mensagem de transferência');
      const escalationMessage = `Sua conversa foi transferida para um atendente humano. Nossa equipe entrará em contato em breve para dar continuidade ao seu atendimento. 

Para urgências, entre em contato pelo telefone da clínica.`;
      
      await sendMessageWithRetry(phoneNumber, escalationMessage, supabase);
      return;
    }

    // Buscar contexto da clínica
    console.log('🏥 Buscando contexto da clínica...');
    const { data: contextData, error: contextError } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .order('order_number');

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError);
    } else {
      console.log(`✅ Contexto encontrado: ${contextData?.length || 0} itens`);
    }

    // Buscar histórico recente da conversa
    console.log('📝 Buscando histórico da conversa...');
    
    let recentMessages = [];
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('content, message_type, timestamp')
      .eq('conversation_id', conversationId)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (messagesError) {
      console.error('❌ Erro ao buscar histórico:', messagesError);
    } else {
      recentMessages = messages || [];
      console.log(`✅ Histórico encontrado: ${recentMessages.length} mensagens`);
    }

    // Verificar se é sobre agendamento e tentar processar
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    let aiResponse: string;

    if (isAboutAppointment) {
      console.log('🔄 Processando solicitação de agendamento...');
      const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
      if (appointmentResponse) {
        aiResponse = appointmentResponse;
        console.log('📅 Resposta de agendamento gerada:', appointmentResponse.substring(0, 100) + '...');
      } else {
        // Se não conseguiu processar agendamento, usar IA
        console.log('🤖 Processando com IA...');
        aiResponse = await generateAIResponse(contextData, recentMessages, message);
      }
    } else {
      // Processar com IA
      console.log('🤖 Processando com IA...');
      aiResponse = await generateAIResponse(contextData, recentMessages, message);
    }

    // SISTEMA ANTI-LOOP: Verificar loops antes de enviar
    console.log('🔄 Verificando loops...');
    const loopResult = await detectAndHandleLoop(conversationId, aiResponse, supabase);
    
    if (loopResult.shouldEscalate) {
      console.log('🆘 Conversa escalada devido a loop');
      await sendMessageWithRetry(phoneNumber, loopResult.finalResponse, supabase);
      return;
    }

    const finalResponse = loopResult.alternativeResponse || aiResponse;
    console.log('💬 Resposta final:', finalResponse.substring(0, 100) + '...');

    // Enviar resposta de volta via WhatsApp com retry
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, finalResponse, supabase);
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Tentar enviar mensagem de erro básica
    try {
      console.log('📤 Enviando mensagem de erro básica...');
      await sendMessageWithRetry(phoneNumber, 'Desculpe, estou com dificuldades no momento. Um atendente entrará em contato em breve.', supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}

async function detectAndHandleLoop(conversationId: string, response: string, supabase: any) {
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

function getAlternativeResponse(originalResponse: string): string {
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
