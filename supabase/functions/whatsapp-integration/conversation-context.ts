
interface ConversationState {
  lastBotResponse: string;
  consecutiveRepeats: number;
  lastUserIntent: string;
  conversationStage: 'greeting' | 'information' | 'scheduling' | 'concluded';
  userPreferences: Record<string, any>;
}

export class ConversationContextManager {
  private static contexts: Map<string, ConversationState> = new Map();

  static getContext(phoneNumber: string): ConversationState {
    if (!this.contexts.has(phoneNumber)) {
      this.contexts.set(phoneNumber, {
        lastBotResponse: '',
        consecutiveRepeats: 0,
        lastUserIntent: '',
        conversationStage: 'greeting',
        userPreferences: {}
      });
    }
    return this.contexts.get(phoneNumber)!;
  }

  static updateContext(phoneNumber: string, updates: Partial<ConversationState>) {
    const context = this.getContext(phoneNumber);
    this.contexts.set(phoneNumber, { ...context, ...updates });
  }

  static checkForRepetition(phoneNumber: string, newResponse: string): boolean {
    const context = this.getContext(phoneNumber);
    
    // Calcular similaridade entre respostas
    const similarity = this.calculateSimilarity(context.lastBotResponse, newResponse);
    
    if (similarity > 0.8) {
      context.consecutiveRepeats++;
      return true;
    } else {
      context.consecutiveRepeats = 0;
      return false;
    }
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  static generateVariedResponse(phoneNumber: string, baseResponse: string): string {
    const context = this.getContext(phoneNumber);
    
    if (context.consecutiveRepeats > 0) {
      // Gerar variações da resposta
      const variations = this.createResponseVariations(baseResponse);
      return variations[context.consecutiveRepeats % variations.length];
    }
    
    return baseResponse;
  }

  private static createResponseVariations(response: string): string[] {
    // Criar variações naturais da mesma resposta
    if (response.includes('agendar')) {
      return [
        response,
        'Vou te ajudar com o agendamento! ' + response.replace(/^[^.]*\./, ''),
        'Claro! Para marcar sua consulta, ' + response.replace(/Para agendar[^,]*,/, '').toLowerCase()
      ];
    }
    
    if (response.includes('informações')) {
      return [
        response,
        'Preciso de alguns detalhes para continuar: ' + response.replace(/^[^:]*:/, ''),
        'Me ajude com essas informações: ' + response.replace(/^[^:]*:/, '')
      ];
    }
    
    return [response];
  }

  static detectUserIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('agendar') || lowerMessage.includes('marcar')) {
      return 'scheduling';
    }
    if (lowerMessage.includes('cancelar') || lowerMessage.includes('desmarcar')) {
      return 'cancellation';
    }
    if (lowerMessage.includes('reagendar') || lowerMessage.includes('alterar')) {
      return 'rescheduling';
    }
    if (lowerMessage.includes('informação') || lowerMessage.includes('horário')) {
      return 'information';
    }
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi')) {
      return 'greeting';
    }
    
    return 'general';
  }
}
