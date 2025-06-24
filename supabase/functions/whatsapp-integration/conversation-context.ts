
interface ConversationState {
  lastBotResponse: string;
  consecutiveRepeats: number;
  lastUserIntent: string;
  conversationStage: 'greeting' | 'information' | 'scheduling' | 'concluded';
  userPreferences: Record<string, any>;
  hasGreeted: boolean;
  lastInteractionTime: number;
  conversationHistory: Array<{
    content: string;
    type: 'user' | 'bot';
    timestamp: number;
    intent?: string;
  }>;
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
        lastInteractionTime: Date.now(),
        conversationHistory: []
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

  static addToHistory(phoneNumber: string, content: string, type: 'user' | 'bot', intent?: string) {
    const context = this.getContext(phoneNumber);
    
    // Adicionar à memória local
    context.conversationHistory.push({
      content,
      type,
      timestamp: Date.now(),
      intent
    });

    // Manter apenas as últimas 20 interações na memória
    if (context.conversationHistory.length > 20) {
      context.conversationHistory = context.conversationHistory.slice(-20);
    }

    this.updateContext(phoneNumber, { conversationHistory: context.conversationHistory });
  }

  static getRecentHistory(phoneNumber: string, limit: number = 10): Array<{content: string, type: 'user' | 'bot'}> {
    const context = this.getContext(phoneNumber);
    return context.conversationHistory.slice(-limit);
  }

  static checkForRepetition(phoneNumber: string, newResponse: string): boolean {
    const context = this.getContext(phoneNumber);
    
    // Verificar se é uma repetição exata ou muito similar
    const similarity = this.calculateSimilarity(context.lastBotResponse, newResponse);
    
    console.log(`🔍 Verificando repetição: similaridade ${similarity}`);
    console.log(`📝 Última resposta: ${context.lastBotResponse.substring(0, 50)}...`);
    console.log(`📝 Nova resposta: ${newResponse.substring(0, 50)}...`);
    
    if (similarity > 0.7) {
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
    
    const normalize = (text: string) => text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);
    
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
    
    // Só cumprimentar se ainda não cumprimentou ou se passou muito tempo (mais de 4 horas)
    const fourHours = 4 * 60 * 60 * 1000;
    const timeSinceLastInteraction = Date.now() - context.lastInteractionTime;
    
    return !context.hasGreeted || timeSinceLastInteraction > fourHours;
  }

  static markAsGreeted(phoneNumber: string) {
    this.updateContext(phoneNumber, { hasGreeted: true });
  }

  static analyzeConversationContext(phoneNumber: string): {
    hasAppointmentContext: boolean;
    lastAppointmentData: any;
    conversationFlow: string;
    userMentions: string[];
  } {
    const context = this.getContext(phoneNumber);
    const history = context.conversationHistory;
    
    // Analisar se há contexto de agendamento
    const appointmentKeywords = ['agendar', 'marcar', 'consulta', 'médico', 'doutor', 'especialista'];
    const hasAppointmentContext = history.some(msg => 
      appointmentKeywords.some(keyword => msg.content.toLowerCase().includes(keyword))
    );

    // Extrair menções importantes do usuário
    const userMentions = history
      .filter(msg => msg.type === 'user')
      .map(msg => msg.content)
      .filter(content => content.length > 0);

    // Analisar fluxo da conversa
    let conversationFlow = 'initial';
    if (history.length > 5) conversationFlow = 'ongoing';
    if (hasAppointmentContext) conversationFlow = 'appointment_focused';

    return {
      hasAppointmentContext,
      lastAppointmentData: null, // Pode ser expandido para extrair dados específicos
      conversationFlow,
      userMentions: userMentions.slice(-5) // Últimas 5 mensagens do usuário
    };
  }
}
