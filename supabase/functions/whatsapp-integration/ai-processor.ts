
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleEnhancedAppointmentRequest } from './enhanced-appointment-handler.ts';
import { generateEnhancedAIResponse } from './enhanced-openai-service.ts';
import { sendMessageWithRetry } from './message-retry.ts';
import { ConversationContextManager } from './conversation-context.ts';
import { IntentDetector } from './intent-detector.ts';
import { UserProfileManager } from './user-profile-manager.ts';
import { ConversationValidator } from './conversation-validator.ts';
import { ConversationFeedbackManager } from './conversation-feedback.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA HUMANIZADA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  try {
    // Detectar intenção avançada
    const context = ConversationContextManager.getContext(phoneNumber);
    const userIntent = IntentDetector.detectAdvancedIntent(message, context.conversationHistory);
    
    console.log(`🎯 Intenção detectada: ${userIntent.primary} (confiança: ${userIntent.confidence})`);
    console.log(`📊 Contexto atual: Stage=${context.conversationStage}, Greeted=${context.hasGreeted}, Repeats=${context.consecutiveRepeats}`);

    // Analisar estilo do usuário para personalização
    UserProfileManager.analyzeUserStyle(message, phoneNumber);

    // NOVA PRIORIDADE 1: Resposta da IA Humanizada - PRIMEIRA PRIORIDADE
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

    // Buscar histórico COMPLETO da conversa
    console.log('📝 Buscando histórico completo da conversa...');
    
    const { data: conversationData, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    let recentMessages = [];
    if (!convError && conversationData) {
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('content, message_type, timestamp')
        .eq('conversation_id', conversationData.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (messagesError) {
        console.error('❌ Erro ao buscar histórico:', messagesError);
      } else {
        recentMessages = messages || [];
        console.log(`✅ Histórico encontrado: ${recentMessages.length} mensagens`);
        
        // Carregar histórico no contexto se ainda não estiver carregado
        if (context.conversationHistory.length === 0 && recentMessages.length > 0) {
          console.log('🔄 Carregando histórico do banco para o contexto...');
          recentMessages.reverse().forEach((msg) => {
            if (msg.content && msg.content.trim()) {
              ConversationContextManager.addToHistory(
                phoneNumber, 
                msg.content, 
                msg.message_type === 'received' ? 'user' : 'bot'
              );
            }
          });
        }
      }
    }

    // Verificar se é feedback do usuário
    const isFeedback = ConversationFeedbackManager.processFeedback(phoneNumber, message);
    if (isFeedback) {
      const rating = parseInt(message.trim()) || 3;
      const feedbackResponse = ConversationFeedbackManager.generateFeedbackResponse(rating);
      
      ConversationContextManager.addToHistory(phoneNumber, feedbackResponse, 'bot');
      await sendMessageWithRetry(phoneNumber, feedbackResponse, supabase);
      console.log(`✅ Feedback processado para ${phoneNumber}`);
      return;
    }

    // Processar com IA HUMANIZADA usando sistema MCP e memória conversacional
    console.log('🤖 Processando com IA Humanizada + MCP (PRIORIDADE 1)...');
    const finalResponse = await generateEnhancedAIResponse(
      contextData, 
      recentMessages, 
      message, 
      phoneNumber,
      userIntent
    );

    // PRIORIDADE 2: Detecção de Loops/Repetições - Agora mais inteligente
    console.log('🔄 Verificando repetições com contexto emocional (PRIORIDADE 2)...');
    const isRepetitive = ConversationContextManager.checkForRepetition(phoneNumber, finalResponse);
    let responseToSend = finalResponse;
    
    if (isRepetitive) {
      console.log('🔄 Repetição detectada, gerando variação contextual...');
      responseToSend = ConversationContextManager.generateVariedResponse(phoneNumber, finalResponse);
    }

    // Sistema de escalação mais inteligente
    if (context.consecutiveRepeats > 3) {
      console.log('🚨 Muitas repetições detectadas, analisando necessidade de escalação...');
      
      // Verificar se realmente precisa escalar baseado no contexto
      const needsEscalation = shouldEscalateToHuman(context, userIntent, message);
      
      if (needsEscalation) {
        // Atualizar conversa para escalada
        await supabase
          .from('whatsapp_conversations')
          .update({
            escalated_to_human: true,
            escalation_reason: 'Múltiplas repetições e necessidade detectada',
            escalated_at: new Date().toISOString()
          })
          .eq('phone_number', phoneNumber);

        const escalationMessage = `Percebi que talvez eu não esteja conseguindo ajudá-lo da melhor forma. Vou conectá-lo com um de nossos atendentes especializados que poderá dar o suporte que você merece. 😊\n\nUm momento, por favor!`;
        
        // Resetar contador
        ConversationContextManager.updateContext(phoneNumber, {
          consecutiveRepeats: 0,
          conversationStage: 'concluded'
        });

        await sendMessageWithRetry(phoneNumber, escalationMessage, supabase);
        console.log(`✅ Conversa escalada inteligentemente para humano: ${phoneNumber}`);
        return;
      }
    }

    // PRIORIDADE 3: Sistema de Agendamentos (integrado com MCP)
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    // O sistema de agendamento agora é integrado via MCP no generateEnhancedAIResponse
    // Mas mantemos fallback para casos específicos
    if (isAboutAppointment && userIntent.confidence < 0.6) {
      console.log('🔄 Verificando sistema de agendamento como suporte adicional...');
      try {
        const appointmentResponse = await handleEnhancedAppointmentRequest(message, phoneNumber, supabase);
        if (appointmentResponse && !responseToSend.includes('agend')) {
          console.log('📅 Integrando informações de agendamento na resposta');
          responseToSend = `${responseToSend}\n\n${appointmentResponse}`;
        }
      } catch (appointmentError) {
        console.error('❌ Erro no sistema de agendamento:', appointmentError);
      }
    }

    // Marcar como cumprimentado se foi uma saudação
    if (userIntent.primary === 'greeting') {
      ConversationContextManager.markAsGreeted(phoneNumber);
    }

    // Adicionar resposta do bot ao histórico
    ConversationContextManager.addToHistory(phoneNumber, responseToSend, 'bot');

    // Atualizar contexto com a resposta
    ConversationContextManager.updateContext(phoneNumber, {
      lastBotResponse: responseToSend,
      lastUserIntent: userIntent.primary
    });

    // Sistema de feedback inteligente - menos intrusivo
    const messageCount = context.conversationHistory.length;
    if (ConversationFeedbackManager.shouldRequestFeedback(phoneNumber, messageCount) && Math.random() < 0.3) {
      const feedbackRequest = ConversationFeedbackManager.requestFeedback(phoneNumber);
      responseToSend += `\n\n${feedbackRequest}`;
    }

    // Enviar resposta
    console.log('📤 Enviando resposta humanizada via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, responseToSend, supabase);
    console.log(`✅ Resposta humanizada enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento humanizado:', error);
    
    // Tentar enviar mensagem de erro mais empática
    try {
      console.log('📤 Enviando mensagem de erro empática...');
      const errorMsg = `Ops! Parece que tive um pequeno problema técnico. 😅 Pode tentar de novo? Prometo que vou conseguir te ajudar melhor desta vez!`;
      await sendMessageWithRetry(phoneNumber, errorMsg, supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}

function shouldEscalateToHuman(context: any, userIntent: any, message: string): boolean {
  // Lógica mais inteligente para escalação
  const escalationFactors = [
    userIntent.primary === 'frustration' && userIntent.confidence > 0.8,
    message.toLowerCase().includes('falar com pessoa'),
    message.toLowerCase().includes('atendente humano'),
    message.toLowerCase().includes('não está funcionando'),
    context.conversationStage === 'concluded',
    userIntent.urgencyLevel === 'urgent' && context.consecutiveRepeats > 2
  ];
  
  return escalationFactors.filter(Boolean).length >= 2;
}
