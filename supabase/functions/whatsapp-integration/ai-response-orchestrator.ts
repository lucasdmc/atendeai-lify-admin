
import { generateEnhancedAIResponse } from './enhanced-openai-service.ts';
import { isAppointmentRelated } from './appointment-utils.ts';
import { ConversationContextManager } from './conversation-context.ts';

export class AIResponseOrchestrator {
  static async generateResponse(
    contextData: any[],
    recentMessages: any[],
    message: string,
    phoneNumber: string,
    userIntent: any,
    supabase: any
  ): Promise<string> {
    console.log('🤖 Processando com IA Humanizada + MCP (PRIORIDADE 1)...');
    
    // Processar com IA HUMANIZADA usando sistema MCP e Supabase real
    const finalResponse = await generateEnhancedAIResponse(
      contextData, 
      recentMessages, 
      message, 
      phoneNumber,
      userIntent,
      supabase // Passar o cliente Supabase real
    );

    return finalResponse;
  }

  static checkAndHandleRepetition(phoneNumber: string, response: string): string {
    console.log('🔄 Verificando repetições com contexto emocional...');
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
    // Sistema de agendamento já integrado via MCP
    // Manter apenas como fallback se MCP falhar
    const isAboutAppointment = isAppointmentRelated(message);
    
    if (isAboutAppointment && !responseToSend.includes('agend') && !responseToSend.includes('horário')) {
      console.log('📅 Adicionando contexto de agendamento...');
      return `${responseToSend}\n\nPosso te ajudar com agendamentos! Me diga a especialidade e a data que você prefere 😊`;
    }

    return responseToSend;
  }
}
