
interface ConversationState {
  lastBotResponse: string;
  consecutiveRepeats: number;
  lastUserIntent: string;
  conversationStage: 'greeting' | 'information' | 'scheduling' | 'concluded';
  userPreferences: Record<string, any>;
  hasGreeted: boolean;
  lastInteractionTime: number;
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
        userPreferences: {},
        hasGreeted: false,
        lastInteractionTime: Date.now()
      });
    }
    return this.contexts.get(phoneNumber)!;
  }

  static updateContext(phoneNumber: string, updates: Partial<ConversationState>) {
    const context = this.getContext(phoneNumber);
    this.contexts.set(phoneNumber, { 
      ...context, 
      ...updates,
      lastInteractionTime: Date.now()
    });
  }

  static checkForRepetition(phoneNumber: string, newResponse: string): boolean {
    const context = this.getContext(phoneNumber);
    
    // Verificar se é uma repetição exata ou muito similar
    const similarity = this.calculateSimilarity(context.lastBotResponse, newResponse);
    
    console.log(`🔍 Verificando repetição: similaridade ${similarity}`);
    console.log(`📝 Última resposta: ${context.lastBotResponse.substring(0, 50)}...`);
    console.log(`📝 Nova resposta: ${newResponse.substring(0, 50)}...`);
    
    if (similarity > 0.7) { // Reduzir threshold para ser mais sensível
      context.consecutiveRepeats++;
      console.log(`⚠️ Repetição detectada! Contador: ${context.consecutiveRepeats}`);
      return true;
    } else {
      context.consecutiveRepeats = 0;
      return false;
    }
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;
    
    // Normalizar textos
    const normalize = (text: string) => text.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove pontuação
      .replace(/\s+/g, ' ')    // Normaliza espaços
      .trim();
    
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);
    
    // Se são iguais após normalização, similaridade é 1
    if (norm1 === norm2) return 1;
    
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  static generateVariedResponse(phoneNumber: string, baseResponse: string): string {
    const context = this.getContext(phoneNumber);
    
    if (context.consecutiveRepeats > 0) {
      console.log(`🔄 Gerando variação da resposta (tentativa ${context.consecutiveRepeats})`);
      const variations = this.createResponseVariations(baseResponse, context.conversationStage);
      return variations[context.consecutiveRepeats % variations.length];
    }
    
    return baseResponse;
  }

  private static createResponseVariations(response: string, stage: string): string[] {
    // Evitar saudações repetidas se já saudou
    if (response.includes('Oi!') || response.includes('Olá')) {
      return [
        response.replace(/^[^!]*! Tudo ótimo[^!]*!\s*/, ''),
        'Como posso ajudar você hoje?',
        'Em que posso ser útil?'
      ];
    }
    
    if (response.includes('agendar')) {
      return [
        response,
        'Perfeito! Para o agendamento, preciso de alguns dados. Qual data, horário e tipo de consulta você gostaria?',
        'Vou te ajudar com isso! Me informe a data desejada, horário e especialidade médica.',
        'Claro! Para marcar sua consulta, preciso saber quando você gostaria de ser atendido e que tipo de consulta.'
      ];
    }
    
    if (response.includes('informações')) {
      return [
        response,
        'Para continuar, preciso de mais alguns detalhes.',
        'Só faltam algumas informações para finalizar.',
        'Quase lá! Me ajude com mais alguns dados.'
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
    if (lowerMessage.includes('informação') || lowerMessage.includes('horário') || lowerMessage.includes('quando')) {
      return 'information';
    }
    if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde')) {
      return 'greeting';
    }
    
    return 'general';
  }

  static shouldGreet(phoneNumber: string): boolean {
    const context = this.getContext(phoneNumber);
    
    // Só cumprimentar se ainda não cumprimentou ou se passou muito tempo (mais de 30 min)
    const thirtyMinutes = 30 * 60 * 1000;
    const timeSinceLastInteraction = Date.now() - context.lastInteractionTime;
    
    return !context.hasGreeted || timeSinceLastInteraction > thirtyMinutes;
  }

  static markAsGreeted(phoneNumber: string) {
    this.updateContext(phoneNumber, { hasGreeted: true });
  }
}
