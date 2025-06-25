
import { sendMessageWithRetry } from './message-retry.ts';
import { ConversationContextManager } from './conversation-context.ts';
import { EscalationManager } from './escalation-manager.ts';
import { ConversationFlowManager } from './conversation-flow-manager.ts';
import { AIResponseOrchestrator } from './ai-response-orchestrator.ts';
import { FeedbackManager } from './feedback-manager.ts';
import { ErrorHandler } from './error-handler.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  ErrorHandler.logProcessingStart(phoneNumber, message);
  
  try {
    // Inicializar conversa e detectar intenção
    const { context, userIntent } = await ConversationFlowManager.initializeConversation(phoneNumber, message);

    // Carregar contextos necessários
    const [contextData, recentMessages] = await Promise.all([
      ConversationFlowManager.loadClinicContext(supabase),
      ConversationFlowManager.loadConversationHistory(phoneNumber, supabase)
    ]);

    // Verificar se é feedback do usuário
    const isFeedback = FeedbackManager.processFeedback(phoneNumber, message);
    if (isFeedback) {
      const rating = parseInt(message.trim()) || 3;
      const feedbackResponse = FeedbackManager.generateFeedbackResponse(rating);
      
      ConversationContextManager.addToHistory(phoneNumber, feedbackResponse, 'bot');
      await sendMessageWithRetry(phoneNumber, feedbackResponse, supabase);
      console.log(`✅ Feedback processado para ${phoneNumber}`);
      return;
    }

    // Gerar resposta da IA
    let finalResponse = await AIResponseOrchestrator.generateResponse(
      contextData, 
      recentMessages, 
      message, 
      phoneNumber,
      userIntent
    );

    // Verificar repetições e gerar variações se necessário
    let responseToSend = AIResponseOrchestrator.checkAndHandleRepetition(phoneNumber, finalResponse);

    // Verificar necessidade de escalação
    if (EscalationManager.checkRepetitionThreshold(context)) {
      console.log('🚨 Muitas repetições detectadas, analisando necessidade de escalação...');
      
      const needsEscalation = EscalationManager.shouldEscalateToHuman(context, userIntent, message);
      
      if (needsEscalation) {
        const escalationMessage = await EscalationManager.handleEscalation(phoneNumber, context, supabase);
        await sendMessageWithRetry(phoneNumber, escalationMessage, supabase);
        console.log(`✅ Conversa escalada inteligentemente para humano: ${phoneNumber}`);
        return;
      }
    }

    // Processar sistema de agendamento como fallback
    responseToSend = await AIResponseOrchestrator.handleAppointmentFallback(
      message,
      phoneNumber,
      userIntent,
      responseToSend,
      supabase
    );

    // Processar saudações
    ConversationFlowManager.handleGreeting(phoneNumber, userIntent);

    // Atualizar fluxo da conversa
    ConversationFlowManager.updateConversationFlow(phoneNumber, responseToSend, userIntent);

    // Adicionar feedback se apropriado
    const messageCount = context.conversationHistory.length;
    responseToSend = FeedbackManager.addFeedbackToResponse(responseToSend, phoneNumber, messageCount);

    // Enviar resposta final
    console.log('📤 Enviando resposta humanizada via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, responseToSend, supabase);
    ErrorHandler.logProcessingEnd(phoneNumber);
    
  } catch (error) {
    await ErrorHandler.handleCriticalError(error, phoneNumber, supabase);
  }
}
