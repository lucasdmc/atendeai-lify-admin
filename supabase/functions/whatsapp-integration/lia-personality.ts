
export class LiaPersonality {
  static getGreetingMessage(): string {
    const greetings = [
      "Oi! 😊\nSou a Lia, assistente aqui da clínica.\nCom quem tenho o prazer de falar?\nEm que posso te ajudar hoje? 💙",
      "Olá! Que bom ter você aqui! 😊\nEu sou a Lia, da equipe da clínica.\nQual seu nome?\nComo posso te ajudar? 💙",
      "Oi! Seja bem-vindo(a)! 😊\nSou a Lia, assistente da clínica.\nMe conta seu nome e como posso te ajudar? 💙"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  static getFollowUpResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Respostas específicas baseadas no contexto
    if (lowerMessage.includes('agend') || lowerMessage.includes('consulta') || lowerMessage.includes('marcar')) {
      return `Perfeito! Vou te ajudar com o agendamento 😊\nPara qual especialidade você precisa?\nQual data seria melhor? 💙`;
    }
    
    if (lowerMessage.includes('psicolog')) {
      return `Ótima escolha! Psicologia é muito importante 😊\nQual data você tem disponibilidade?\nVou verificar os horários disponíveis! 💙`;
    }

    if (lowerMessage.includes('cardio')) {
      return `Cardiologia é uma especialidade muito procurada! 😊\nQual data você prefere?\nVou verificar nossa agenda! 💙`;
    }

    if (lowerMessage.includes('dermat')) {
      return `Dermatologia! Vou te ajudar 😊\nQue dia seria bom para você?\nJá verifico os horários! 💙`;
    }

    if (lowerMessage.includes('horario') || lowerMessage.includes('disponib')) {
      return `Vou verificar os horários disponíveis! 😊\nPara que especialidade e quando você precisa? 💙`;
    }
    
    return `Entendi! 😊\nMe fala um pouco mais sobre o que você precisa?\nAssim posso te ajudar melhor 💙`;
  }

  static generateVariedResponse(originalResponse: string, userMessage: string): string {
    const variations = [
      "Perfeito!",
      "Ótimo!",
      "Entendi!",
      "Certo!",
      "Claro!"
    ];
    
    const randomVariation = variations[Math.floor(Math.random() * variations.length)];
    
    // Se a resposta original começava com saudação, variar
    if (originalResponse.startsWith('Oi!') || originalResponse.startsWith('Olá!')) {
      return originalResponse.replace(/^(Oi!|Olá!)/, randomVariation);
    }
    
    return `${randomVariation} ${originalResponse}`;
  }

  static isFirstContact(recentMessages: any[]): boolean {
    if (!recentMessages || recentMessages.length === 0) {
      return true;
    }

    // Verificar se só tem mensagens recebidas (usuário)
    const hasAnyBotMessage = recentMessages.some(msg => msg.message_type === 'sent');
    return !hasAnyBotMessage;
  }

  static getFallbackResponse(): string {
    return `Oi! Estou aqui para te ajudar! 😊\nMe conta o que você precisa? 💙`;
  }
}
