
// Sistema de recuperação de erros para garantir conversas fluidas
export class ErrorRecoverySystem {
  private static errorCount = new Map<string, number>();
  private static lastErrors = new Map<string, string>();
  
  static async handleError(phoneNumber: string, error: any, userMessage: string): Promise<string> {
    console.log(`🔧 Sistema de recuperação ativado para ${phoneNumber}`);
    
    // Contar erros por usuário
    const currentCount = this.errorCount.get(phoneNumber) || 0;
    this.errorCount.set(phoneNumber, currentCount + 1);
    this.lastErrors.set(phoneNumber, error.message || 'Erro desconhecido');
    
    // Estratégias baseadas no número de erros
    if (currentCount === 0) {
      return this.getFirstErrorResponse(userMessage);
    } else if (currentCount === 1) {
      return this.getSecondErrorResponse(userMessage);
    } else if (currentCount >= 2) {
      return this.getEscalationResponse(phoneNumber);
    }
    
    return this.getDefaultErrorResponse();
  }
  
  static resetErrorCount(phoneNumber: string): void {
    this.errorCount.delete(phoneNumber);
    this.lastErrors.delete(phoneNumber);
  }
  
  static getFirstErrorResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('agend')) {
      return `Ops, tive uma pequena dificuldade! 😅\nMas vou te ajudar com o agendamento sim!\nPara qual especialidade você gostaria de agendar? 💙`;
    }
    
    if (lowerMessage.includes('horario') || lowerMessage.includes('horário')) {
      return `Desculpa o contratempo! 😊\nNossos horários são de segunda a sexta, das 8h às 18h.\nQual dia seria melhor para você? 💙`;
    }
    
    if (lowerMessage.includes('oi') || lowerMessage.includes('ola') || lowerMessage.includes('olá')) {
      return `Oi! Desculpa a demora! 😊\nSou a Lia, assistente aqui da clínica.\nCom quem eu tenho o prazer de falar? 💙`;
    }
    
    return `Oi! Desculpa o pequeno contratempo! 😅\nSou a Lia e estou aqui para te ajudar.\nMe conta o que você precisa? 💙`;
  }
  
  static getSecondErrorResponse(userMessage: string): string {
    return `Peço desculpas pelos probleminhas técnicos! 🙏\nVou anotar sua solicitação e nossa equipe vai te retornar em breve.\nEnquanto isso, posso tentar te ajudar de outra forma?\nQual é a sua principal necessidade hoje? 💙`;
  }
  
  static getEscalationResponse(phoneNumber: string): string {
    console.log(`🚨 Escalando conversa para humano: ${phoneNumber} (muitos erros)`);
    return `Sinto muito pelos problemas técnicos! 🙏\nVou conectar você diretamente com nossa equipe.\nAlguém da clínica vai te atender pessoalmente em alguns minutos.\nObrigada pela paciência! 💙`;
  }
  
  static getDefaultErrorResponse(): string {
    return `Ops! Parece que tive um pequeno problema técnico. 😅\nPode tentar de novo? Prometo que vou conseguir te ajudar melhor desta vez! 💙`;
  }
  
  static async generateFallbackResponse(userMessage: string, contextData: any[] = []): Promise<string> {
    const lowerMessage = userMessage.toLowerCase();
    
    // Banco de respostas baseado em intenção
    const responses = {
      greeting: [
        `Oi! Que bom ter você aqui! 😊\nSou a Lia, assistente da clínica.\nCom quem eu tenho o prazer de falar? 💙`,
        `Olá! Seja bem-vindo(a)! 😊\nEu sou a Lia, estou aqui para te ajudar.\nQual seu nome? E como posso te ajudar hoje? 💙`,
        `Oi! Sou a Lia! 😊\nQue alegria te atender!\nMe conta seu nome e como você está hoje? 💙`
      ],
      appointment: [
        `Claro! Vou te ajudar com o agendamento! 😊\nPara qual especialidade você precisa?\nE qual data seria melhor? 💙`,
        `Perfeito! Vamos agendar sua consulta! 😊\nMe conta: que tipo de consulta você precisa?\nE quando gostaria de vir? 💙`,
        `Ótimo! Vou verificar nossa agenda! 😊\nQual especialidade você procura?\nE que dia seria bom para você? 💙`
      ],
      schedule: [
        `Nossos horários são de segunda a sexta, das 8h às 18h! 😊\nQual dia seria melhor para você?\nVou verificar nossa disponibilidade! 💙`,
        `Atendemos de segunda a sexta, das 8h às 18h! 😊\nTem algum período que prefere?\nManhã ou tarde? 💙`
      ],
      gratitude: [
        `Fico muito feliz em ajudar! 😊\nSe precisar de mais alguma coisa, é só me chamar!\nEstou sempre aqui! 💙`,
        `De nada! É um prazer te atender! 😊\nQualquer coisa que precisar, estarei aqui!\nTenha um ótimo dia! 💙`
      ],
      default: [
        `Entendi! 😊\nMe conta um pouquinho mais sobre o que você precisa?\nAssim posso te ajudar melhor! 💙`,
        `Certo! 😊\nPode me dar mais detalhes?\nQuero te ajudar da melhor forma possível! 💙`,
        `Perfeito! 😊\nMe explica melhor o que você está procurando?\nVou fazer o possível para te ajudar! 💙`
      ]
    };
    
    // Detectar intenção
    let category = 'default';
    
    if (lowerMessage.includes('oi') || lowerMessage.includes('ola') || lowerMessage.includes('olá') || 
        lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde')) {
      category = 'greeting';
    } else if (lowerMessage.includes('agend') || lowerMessage.includes('marcar') || lowerMessage.includes('consulta')) {
      category = 'appointment';
    } else if (lowerMessage.includes('horario') || lowerMessage.includes('horário') || lowerMessage.includes('atend')) {
      category = 'schedule';
    } else if (lowerMessage.includes('obrigad') || lowerMessage.includes('valeu') || lowerMessage.includes('muito bom')) {
      category = 'gratitude';
    }
    
    // Selecionar resposta aleatória da categoria
    const categoryResponses = responses[category];
    const randomResponse = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
    
    console.log(`✅ Resposta de fallback gerada (categoria: ${category})`);
    return randomResponse;
  }
}
