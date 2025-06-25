
import { ConversationStateManager } from './conversation-state-manager.ts';
import { AppointmentFlowHandlers } from './appointment-flow-handlers.ts';
import { MessageIntentDetector } from './message-intent-detector.ts';
import { SpecialtyDetector } from './specialty-detection.ts';
import { TimeExtractor } from './time-extraction.ts';

export class SmartConversationHandler {
  static async processMessage(
    phoneNumber: string, 
    message: string, 
    supabase: any
  ): Promise<string> {
    console.log(`🧠 Smart Conversation Handler - Processing: ${message}`);
    
    const state = await ConversationStateManager.getState(phoneNumber, supabase);
    const userInput = ConversationStateManager.analyzeUserInput(message);
    
    console.log(`📊 Current state: ${state.currentState}, Started: ${state.conversationStarted}, Messages: ${state.messageCount}`);
    console.log(`🔍 User input analysis:`, userInput);

    const intent = MessageIntentDetector.detectIntent(message);

    // PRIMEIRA PRIORIDADE: Detectar se é primeira saudação real
    if (!state.conversationStarted && intent.isGreeting && state.messageCount === 0) {
      console.log('👋 Primeira saudação detectada');
      await ConversationStateManager.updateState(phoneNumber, { 
        conversationStarted: true,
        currentState: 'initial'
      }, supabase);
      return MessageIntentDetector.getGreetingResponse();
    }

    // SEGUNDA PRIORIDADE: Se já cumprimentou e usuário quer agendar
    if (state.conversationStarted && (
      userInput.isAppointmentRequest || 
      userInput.isSpecialtySelection ||
      intent.isAppointmentRequest
    )) {
      console.log('📅 Solicitação de agendamento detectada');
      
      // Se já tem especialidade na mensagem, pular para seleção de horário
      if (userInput.isSpecialtySelection && userInput.extractedSpecialty) {
        console.log(`👨‍⚕️ Especialidade detectada na mensagem: ${userInput.extractedSpecialty}`);
        await ConversationStateManager.updateState(phoneNumber, { 
          currentState: 'time_selection',
          selectedService: userInput.extractedSpecialty
        }, supabase);
        return TimeExtractor.getTimeSelectionResponse(userInput.extractedSpecialty, userInput.extractedDate);
      }
      
      // Senão, ir para seleção de especialidade
      await ConversationStateManager.updateState(phoneNumber, { 
        currentState: 'service_selection'
      }, supabase);
      return SpecialtyDetector.getSpecialtyMenuResponse();
    }

    // TERCEIRA PRIORIDADE: Fluxo baseado no estado atual
    const flowParams = { phoneNumber, message, userInput, supabase };
    
    switch (state.currentState) {
      case 'service_selection':
        return await AppointmentFlowHandlers.handleServiceSelection(flowParams);
      
      case 'time_selection':
        return await AppointmentFlowHandlers.handleTimeSelection(flowParams);
      
      case 'contact_info':
        return await AppointmentFlowHandlers.handleContactInfo(flowParams);
      
      case 'confirmation':
        return await AppointmentFlowHandlers.handleFinalConfirmation(flowParams);
      
      default:
        // Estado inicial - resposta contextual
        if (state.conversationStarted) {
          console.log('💭 Conversa já iniciada, fornecendo orientação contextual');
          return MessageIntentDetector.getContextualHelp(message);
        } else {
          console.log('👋 Primeira interação, iniciando conversa');
          await ConversationStateManager.updateState(phoneNumber, { 
            conversationStarted: true
          }, supabase);
          return MessageIntentDetector.getGreetingResponse();
        }
    }
  }
}
