
import { ConversationContextManager } from './conversation-context.ts';

export class EscalationManager {
  static shouldEscalateToHuman(context: any, userIntent: any, message: string): boolean {
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

  static async handleEscalation(phoneNumber: string, context: any, supabase: any): Promise<string> {
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

    return escalationMessage;
  }

  static checkRepetitionThreshold(context: any): boolean {
    return context.consecutiveRepeats > 3;
  }
}
