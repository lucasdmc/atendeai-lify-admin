
import { ValidationResult } from './input-validator.ts';

export interface ConfirmationSession {
  phoneNumber: string;
  pendingData: {
    name?: { value: string; needsConfirmation: boolean };
    email?: { value: string; needsConfirmation: boolean };
    time?: { value: string; needsConfirmation: boolean };
    date?: { value: string; needsConfirmation: boolean };
  };
  waitingFor?: 'name_confirmation' | 'email_confirmation' | 'time_confirmation' | 'date_confirmation';
  attempts: number;
  lastIssues: string[];
}

export class ConfirmationManager {
  private static sessions = new Map<string, ConfirmationSession>();

  static needsConfirmation(validationResult: ValidationResult): boolean {
    // Só confirma se:
    // 1. É inválido (confiança baixa ou tem problemas)
    // 2. Tem confiança baixa (< 0.8) mesmo sendo "válido"
    // 3. Tem sugestões (indica ambiguidade)
    
    if (!validationResult.isValid) return true;
    if (validationResult.confidence < 0.8) return true;
    if (validationResult.suggestions.length > 0) return true;
    
    return false;
  }

  static createConfirmationSession(phoneNumber: string): ConfirmationSession {
    const session: ConfirmationSession = {
      phoneNumber,
      pendingData: {},
      attempts: 0,
      lastIssues: []
    };
    
    this.sessions.set(phoneNumber, session);
    return session;
  }

  static getSession(phoneNumber: string): ConfirmationSession | null {
    return this.sessions.get(phoneNumber) || null;
  }

  static updateSession(phoneNumber: string, updates: Partial<ConfirmationSession>): void {
    const session = this.sessions.get(phoneNumber);
    if (session) {
      Object.assign(session, updates);
    }
  }

  static clearSession(phoneNumber: string): void {
    this.sessions.delete(phoneNumber);
  }

  static generateConfirmationMessage(
    dataType: 'name' | 'email' | 'time' | 'date',
    validationResult: ValidationResult,
    currentValue?: string
  ): string {
    const { issues, suggestions } = validationResult;
    
    if (!validationResult.isValid) {
      let message = `❌ **${this.getDataTypeLabel(dataType)}** com problema:\n`;
      
      // Adicionar problemas identificados
      if (issues.length > 0) {
        message += `🔍 **Problema:** ${issues[0]}\n`;
      }
      
      // Adicionar sugestões específicas
      if (suggestions.length > 0) {
        message += `💡 **Sugestão:** ${suggestions[0]}\n`;
      }
      
      message += `\nPor favor, me informe ${this.getDataTypeLabel(dataType).toLowerCase()} novamente:`;
      return message;
    }
    
    // Caso de baixa confiança - pedir confirmação
    if (validationResult.confidence < 0.8) {
      let message = `🤔 **${this.getDataTypeLabel(dataType)}** - preciso confirmar:\n`;
      message += `📝 Entendi: **${validationResult.value || currentValue}**\n`;
      
      if (suggestions.length > 0) {
        message += `💭 Ou você quis dizer: ${suggestions[0]}\n`;
      }
      
      message += `\nEstá correto ou quer corrigir?`;
      return message;
    }
    
    return '';
  }

  private static getDataTypeLabel(dataType: string): string {
    const labels = {
      'name': 'Nome',
      'email': 'Email',
      'time': 'Horário',
      'date': 'Data'
    };
    return labels[dataType as keyof typeof labels] || dataType;
  }

  static processConfirmationResponse(
    phoneNumber: string,
    message: string,
    waitingFor: string
  ): { confirmed: boolean; newValue?: string; needsNewInput: boolean } {
    const lowerMessage = message.toLowerCase().trim();
    
    // Respostas de confirmação positiva
    const confirmWords = ['sim', 'correto', 'certo', 'ok', 'confirmo', 'isso mesmo', 'exato'];
    const isConfirming = confirmWords.some(word => lowerMessage.includes(word));
    
    // Respostas de negação
    const negateWords = ['não', 'nao', 'errado', 'incorreto', 'não é isso'];
    const isNegating = negateWords.some(word => lowerMessage.includes(word));
    
    if (isConfirming && !isNegating) {
      return { confirmed: true, needsNewInput: false };
    }
    
    if (isNegating) {
      return { confirmed: false, needsNewInput: true };
    }
    
    // Se não é confirmação nem negação, assumir que é nova tentativa de input
    return { confirmed: false, newValue: message, needsNewInput: false };
  }

  static formatSuccessMessage(dataType: string, value: string): string {
    return `✅ **${this.getDataTypeLabel(dataType)}** confirmado: ${value}`;
  }
}
