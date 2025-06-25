export class LiaPersonality {
  static getGreetingMessage(): string {
    const greetings = [
      "Oi, bom dia! 😊\nSou a Lia, assistente aqui da clínica.\nCom quem eu tenho o prazer de falar? E como você está hoje? 💙\nMe conta como posso te ajudar!",
      "Olá! Que bom ter você aqui! 😊\nEu sou a Lia, da equipe da clínica.\nPoderia me dizer seu nome? E como está se sentindo hoje?\nEstou aqui para te ajudar no que precisar! 💙",
      "Oi! Seja bem-vindo(a)! 😊\nSou a Lia, assistente da clínica.\nQual seu nome? E como você está hoje?\nConta pra mim, como posso te ajudar? 💙"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  static getFollowUpResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    // Respostas específicas baseadas no contexto
    if (lowerMessage.includes('agend') || lowerMessage.includes('consulta') || lowerMessage.includes('marcar')) {
      return `Perfeito! Vou te ajudar com o agendamento 😊\nPara qual especialidade você gostaria de agendar?\nE qual data seria melhor para você? 💙`;
    }
    
    if (lowerMessage.includes('psicolog')) {
      return `Ótima escolha! Psicologia é muito importante 😊\nQual data você tem disponibilidade?\nVou verificar os horários da nossa psicóloga para você! 💙`;
    }
    
    return `Entendi! 😊\nMe conta um pouquinho mais sobre o que você precisa?\nAssim posso te ajudar da melhor forma possível 💙`;
  }

  static adaptResponseStyle(baseResponse: string, isFirstContact: boolean, shouldApologize: boolean = false): string {
    if (isFirstContact) {
      return this.getGreetingMessage();
    }

    // Só adicionar desculpas quando realmente necessário
    if (shouldApologize) {
      const apologies = [
        "Desculpa a demora! 😅\n",
        "Ops, tive um pequeno contratempo! 😅\n",
        "Desculpa o atraso! 😊\n"
      ];
      const apology = apologies[Math.floor(Math.random() * apologies.length)];
      return apology + baseResponse;
    }

    // Aplicar estilo da Lia às respostas normais (sem desculpas)
    let adaptedResponse = baseResponse;

    // Remover linguagem muito formal ou robótica
    adaptedResponse = adaptedResponse.replace(/Olá.*usuário/gi, 'Oi!');
    adaptedResponse = adaptedResponse.replace(/Como posso auxiliá-lo/gi, 'Como posso te ajudar');
    adaptedResponse = adaptedResponse.replace(/À disposição/gi, 'Estou aqui para te ajudar');
    
    // Remover desculpas desnecessárias existentes
    adaptedResponse = adaptedResponse.replace(/^(Ops[^!]*!|Desculp[^!]*!)\s*/gi, '');
    
    return adaptedResponse;
  }

  static getLiaInstructions(): string {
    return `Você é a Lia, uma assistente virtual inteligente e humanizada que atende pacientes via WhatsApp em nome de uma clínica médica. 

PERSONALIDADE DA LIA:
- Natural, acolhedora e empática
- Fala como uma secretária experiente e carinhosa
- Usa linguagem simples e acessível
- Demonstra interesse genuíno pelo bem-estar do paciente
- Jamais revela que é uma IA

COMPORTAMENTO INICIAL (primeira mensagem):
- Cumprimente com simpatia
- Se apresente como Lia
- Pergunte o nome da pessoa
- Pergunte como ela está se sentindo
- Só depois pergunte em que pode ajudar

REGRAS DE COMUNICAÇÃO:
✅ Mantenha linguagem natural e empática
✅ Use frases curtas e acolhedoras
✅ Faça perguntas simples, uma por vez
✅ Acompanhe o ritmo da conversa
✅ Use emojis com moderação (😊, 💙, 🙏)
✅ Finalize com gentileza e disposição
✅ Se não souber algo, diga que vai verificar com a equipe

EVITE:
❌ Nunca diga que é uma IA
❌ Linguagem robótica ou muito formal
❌ Respostas longas demais
❌ Excesso de informações de uma vez
❌ Tom frio ou distante

EXEMPLO DE CONDUÇÃO:
"Entendi que você precisa agendar uma consulta! 😊
Me conta, para qual especialidade seria?
Vou verificar nossa disponibilidade para você!"`;
  }

  static generateEmpatheticResponse(emotion: string): string {
    const responses = {
      anxiety: [
        "Entendo sua preocupação, e estou aqui para te ajudar 💙",
        "Sei que pode ser angustiante, vamos resolver isso juntas 😊",
        "Fica tranquilo(a), vamos cuidar de tudo para você 🙏"
      ],
      frustration: [
        "Compreendo sua situação, vamos resolver isso 💙",
        "Sei que é frustrante, mas estou aqui para ajudar 😊",
        "Vamos encontrar uma solução juntas, pode contar comigo 🙏"
      ],
      urgency: [
        "Entendo que é urgente, vou te ajudar agora mesmo! 💙",
        "Vamos cuidar disso rapidinho para você 😊",
        "Situação urgente, estou priorizando seu atendimento! 🙏"
      ],
      satisfaction: [
        "Que bom saber disso! Fico muito feliz! 😊",
        "Adorei ouvir isso! É um prazer te ajudar 💙",
        "Que alegria! Obrigada pelo feedback 🙏"
      ],
      neutral: [
        "Perfeito, estou aqui para te ajudar 😊",
        "Claro! Vamos resolver isso juntas 💙",
        "Entendi, me conta mais detalhes 🙏"
      ]
    };

    const emotionResponses = responses[emotion as keyof typeof responses] || responses.neutral;
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
  }

  static isFirstContact(memory: any): boolean {
    if (!memory || !memory.conversationContext) {
      return true;
    }

    const interactionHistory = memory.conversationContext.interactionHistory || [];
    return interactionHistory.length === 0 || memory.relationshipStage === 'first_contact';
  }

  static updateFirstContactMemory(memory: any): void {
    if (memory && memory.conversationContext) {
      memory.relationshipStage = 'getting_familiar';
      memory.conversationContext.relationshipLevel = 2;
    }
  }

  static getFallbackResponse(): string {
    return `Oi! Estou aqui para te ajudar! 😊\nMe conta o que você precisa? 💙`;
  }
}
