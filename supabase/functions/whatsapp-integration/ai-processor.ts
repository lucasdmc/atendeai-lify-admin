
import { sendMessageWithRetry } from './message-retry.ts';
import { ConversationContextManager } from './conversation-context.ts';
import { EscalationManager } from './escalation-manager.ts';
import { ConversationFlowManager } from './conversation-flow-manager.ts';
import { AIResponseOrchestrator } from './ai-response-orchestrator.ts';
import { FeedbackManager } from './feedback-manager.ts';
import { ErrorRecoverySystem } from './error-recovery-system.ts';
import { ConversationFlowTest } from './conversation-flow-test.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA HUMANIZADA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  try {
    // Resetar contador de erros em caso de sucesso anterior
    ErrorRecoverySystem.resetErrorCount(phoneNumber);
    
    // Executar testes automatizados a cada 50 mensagens (para monitoramento)
    if (Math.random() < 0.02) { // 2% de chance = ~1 a cada 50 mensagens
      console.log('🧪 Executando testes automatizados de qualidade...');
      setTimeout(() => ConversationFlowTest.runAllTests(), 1000);
    }
    
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

    // Gerar resposta da IA com sistema de recuperação robusto
    let finalResponse: string;
    
    try {
      finalResponse = await AIResponseOrchestrator.generateResponse(
        contextData, 
        recentMessages, 
        message, 
        phoneNumber,
        userIntent
      );
    } catch (aiError) {
      console.error('❌ Erro na geração principal, usando sistema de recuperação:', aiError);
      finalResponse = await ErrorRecoverySystem.handleError(phoneNumber, aiError, message);
    }

    // Verificar se a resposta é válida
    if (!finalResponse || finalResponse.trim().length === 0) {
      console.log('⚠️ Resposta vazia, gerando fallback');
      finalResponse = await ErrorRecoverySystem.generateFallbackResponse(message, contextData);
    }

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

    // Validação final da resposta
    if (responseToSend.toLowerCase().includes('problema técnico') && 
        responseToSend.length < 50) {
      console.log('⚠️ Detectada resposta de erro padrão, substituindo por fallback');
      responseToSend = await ErrorRecoverySystem.generateFallbackResponse(message, contextData);
    }

    // Enviar resposta final
    console.log('📤 Enviando resposta humanizada via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, responseToSend, supabase);
    console.log(`✅ Resposta humanizada enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento:', error);
    
    // Sistema de recuperação de último recurso
    try {
      const recoveryResponse = await ErrorRecoverySystem.handleError(phoneNumber, error, message);
      await sendMessageWithRetry(phoneNumber, recoveryResponse, supabase);
      console.log(`✅ Resposta de recuperação enviada para ${phoneNumber}`);
    } catch (recoveryError) {
      console.error('❌ Falha total no sistema de recuperação:', recoveryError);
      
      // Último recurso - resposta mínima da Lia
      const lastResortResponse = `Oi! Desculpa, tive um probleminha técnico! 😅\nMas estou aqui para te ajudar!\nPode me contar o que você precisa? 💙`;
      await sendMessageWithRetry(phoneNumber, lastResortResponse, supabase);
    }
  }
}
