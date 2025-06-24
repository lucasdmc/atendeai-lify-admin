
interface ConversationFeedback {
  conversationId: string;
  userSatisfaction: 'satisfied' | 'neutral' | 'unsatisfied';
  botPerformance: number; // 1-5
  issuesReported: string[];
  timestamp: number;
}

export class ConversationFeedbackManager {
  private static feedbacks: Map<string, ConversationFeedback> = new Map();

  static requestFeedback(phoneNumber: string): string {
    return `😊 Como foi nossa conversa hoje?

1️⃣ ⭐ Excelente
2️⃣ 👍 Boa  
3️⃣ 😐 Ok
4️⃣ 👎 Ruim
5️⃣ ❌ Péssima

Sua avaliação nos ajuda a melhorar! (Opcional)`;
  }

  static processFeedback(phoneNumber: string, message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Detectar rating numérico
    if (/^[1-5]$/.test(message.trim())) {
      const rating = parseInt(message.trim());
      this.saveFeedback(phoneNumber, rating);
      return true;
    }
    
    // Detectar feedback textual
    const positiveWords = ['bom', 'ótimo', 'excelente', 'obrigado'];
    const negativeWords = ['ruim', 'péssimo', 'problema', 'erro'];
    
    const isPositive = positiveWords.some(word => lowerMessage.includes(word));
    const isNegative = negativeWords.some(word => lowerMessage.includes(word));
    
    if (isPositive || isNegative) {
      const rating = isPositive ? 5 : isNegative ? 2 : 3;
      this.saveFeedback(phoneNumber, rating, message);
      return true;
    }
    
    return false;
  }

  private static saveFeedback(phoneNumber: string, rating: number, comment?: string) {
    const satisfaction = rating >= 4 ? 'satisfied' : rating >= 3 ? 'neutral' : 'unsatisfied';
    
    const feedback: ConversationFeedback = {
      conversationId: phoneNumber,
      userSatisfaction: satisfaction,
      botPerformance: rating,
      issuesReported: comment ? [comment] : [],
      timestamp: Date.now()
    };
    
    this.feedbacks.set(phoneNumber, feedback);
    console.log('📊 Feedback recebido:', feedback);
  }

  static shouldRequestFeedback(phoneNumber: string, messageCount: number): boolean {
    // Solicitar feedback a cada 10 mensagens ou ao final de agendamentos
    return messageCount % 10 === 0;
  }

  static generateFeedbackResponse(rating: number): string {
    if (rating >= 4) {
      return `🎉 Obrigado pela avaliação! Fico feliz em ter ajudado! Se precisar de mais alguma coisa, é só falar! 😊`;
    } else if (rating >= 3) {
      return `👍 Obrigado pelo feedback! Estamos sempre trabalhando para melhorar nosso atendimento! 😊`;
    } else {
      return `😔 Lamento que a experiência não tenha sido ideal. Suas observações são valiosas para melhorarmos! Nossa equipe revisará este atendimento.`;
    }
  }
}
