
import { generateEnhancedAIResponse } from './enhanced-openai-service.ts';
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleEnhancedAppointmentRequest } from './enhanced-appointment-handler.ts';
import { ConversationContextManager } from './conversation-context.ts';

export class AIResponseOrchestrator {
  static async generateResponse(
    contextData: any[],
    recentMessages: any[],
    message: string,
    phoneNumber: string,
    userIntent: any
  ): Promise<string> {
    console.log('🤖 Processando com IA Humanizada + MCP (PRIORIDADE 1)...');
    
    // Processar com IA HUMANIZADA usando sistema MCP e memória conversacional
    const finalResponse = await generateEnhancedAIResponse(
      contextData, 
      recentMessages, 
      message, 
      phoneNumber,
      userIntent
    );

    return finalResponse;
  }

  static checkAndHandleRepetition(phoneNumber: string, response: string): string {
    console.log('🔄 Verificando repetições com contexto emocional (PRIORIDADE 2)...');
    const isRepetitive = ConversationContextManager.checkForRepetition(phoneNumber, response);
    
    if (isRepetitive) {
      console.log('🔄 Repetição detectada, gerando variação contextual...');
      return ConversationContextManager.generateVariedResponse(phoneNumber, response);
    }
    
    return response;
  }

  static async handleAppointmentFallback(
    message: string,
    phoneNumber: string,
    userIntent: any,
    responseToSend: string,
    supabase: any
  ): Promise<string> {
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
          return `${responseToSend}\n\n${appointmentResponse}`;
        }
      } catch (appointmentError) {
        console.error('❌ Erro no sistema de agendamento:', appointmentError);
      }
    }

    return responseToSend;
  }
}
