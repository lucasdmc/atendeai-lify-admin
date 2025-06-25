
interface ConversationState {
  phoneNumber: string;
  currentState: 'initial' | 'service_selection' | 'time_selection' | 'contact_info' | 'confirmation' | 'completed';
  selectedService?: string;
  selectedDate?: string;
  selectedTime?: string;
  customerName?: string;
  customerEmail?: string;
  lastActivity: number;
  attempts: number;
}

export class ConversationStateManager {
  private static states = new Map<string, ConversationState>();

  static getState(phoneNumber: string): ConversationState {
    const existing = this.states.get(phoneNumber);
    if (existing && (Date.now() - existing.lastActivity < 30 * 60 * 1000)) { // 30 minutos
      return existing;
    }

    const newState: ConversationState = {
      phoneNumber,
      currentState: 'initial',
      lastActivity: Date.now(),
      attempts: 0
    };
    
    this.states.set(phoneNumber, newState);
    return newState;
  }

  static updateState(phoneNumber: string, updates: Partial<ConversationState>) {
    const current = this.getState(phoneNumber);
    const updated = {
      ...current,
      ...updates,
      lastActivity: Date.now()
    };
    this.states.set(phoneNumber, updated);
    return updated;
  }

  static clearState(phoneNumber: string) {
    this.states.delete(phoneNumber);
  }

  static analyzeUserInput(message: string): {
    isTimeSelection: boolean;
    isConfirmation: boolean;
    extractedTime?: string;
    extractedDate?: string;
    extractedName?: string;
    extractedEmail?: string;
  } {
    const lowerMessage = message.toLowerCase().trim();
    
    // Detectar seleção de horário
    const timePatterns = [
      /(?:às?\s*)?(\d{1,2})(?:h|:00|:\d{2})?(?:\s*(?:da\s*)?(?:manhã|tarde))?/i,
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*horas?/i
    ];
    
    let extractedTime = '';
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 8 && hour <= 18) {
          extractedTime = `${hour.toString().padStart(2, '0')}:00`;
          break;
        }
      }
    }

    // Detectar confirmação
    const confirmationWords = ['sim', 'confirmar', 'confirmo', 'ok', 'certo', 'perfeito', 'pode ser'];
    const isConfirmation = confirmationWords.some(word => lowerMessage.includes(word));

    // Detectar email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const extractedEmail = emailMatch ? emailMatch[1] : undefined;

    // Detectar nome (palavras capitalizadas que não são horários)
    const nameMatch = message.match(/(?:nome|sou|me chamo|eu sou)\s+([A-Za-zÀ-ÿ\s]+)/i);
    const extractedName = nameMatch ? nameMatch[1].trim() : undefined;

    return {
      isTimeSelection: !!extractedTime,
      isConfirmation,
      extractedTime,
      extractedEmail,
      extractedName
    };
  }
}
