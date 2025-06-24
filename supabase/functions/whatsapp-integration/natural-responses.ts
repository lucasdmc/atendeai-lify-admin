
export class NaturalResponseGenerator {
  static generateGreeting(userName?: string, shouldGreet: boolean = true): string {
    if (!shouldGreet) {
      // Se já cumprimentou, apenas perguntar como pode ajudar
      const simpleGreetings = [
        "Como posso ajudá-lo hoje?",
        "Em que posso ser útil?",
        "O que você precisa?"
      ];
      return simpleGreetings[Math.floor(Math.random() * simpleGreetings.length)];
    }

    const greetings = [
      `Olá${userName ? ` ${userName}` : ''}! 😊 Como posso ajudá-lo hoje?`,
      `Oi${userName ? `, ${userName}` : ''}! Em que posso ser útil?`,
      `Seja bem-vindo${userName ? `, ${userName}` : ''}! Como posso te ajudar?`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  static generateSchedulingHelp(isFirstTime: boolean = true): string {
    if (!isFirstTime) {
      const quickResponses = [
        "Para o agendamento, preciso da data, horário e tipo de consulta.",
        "Me informe quando gostaria de ser atendido e qual especialidade.",
        "Qual data, horário e tipo de consulta você precisa?"
      ];
      return quickResponses[Math.floor(Math.random() * quickResponses.length)];
    }

    const responses = [
      `Perfeito! Para agendar sua consulta, preciso de:\n\n📅 Data desejada\n⏰ Horário preferido\n🩺 Tipo de consulta\n📧 Seu email`,
      
      `Vou te ajudar com o agendamento! Me informe:\n\n📅 Que dia você prefere?\n⏰ Qual horário?\n👨‍⚕️ Especialidade médica\n📧 Email para confirmação`,
      
      `Claro! Para marcar sua consulta, preciso saber:\n\n📅 Data\n⏰ Horário\n🩺 Tipo de consulta\n📧 Email`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  static generateInformationRequest(missingInfo: string[]): string {
    const casual_intros = [
      "Preciso de mais algumas informações:",
      "Para finalizar, me informe:",
      "Faltam só alguns detalhes:",
      "Quase lá! Preciso saber:"
    ];
    
    const intro = casual_intros[Math.floor(Math.random() * casual_intros.length)];
    
    let details = '';
    if (missingInfo.includes('date')) details += '\n📅 Data da consulta';
    if (missingInfo.includes('time')) details += '\n⏰ Horário preferido';
    if (missingInfo.includes('type')) details += '\n🩺 Tipo de consulta';
    if (missingInfo.includes('email')) details += '\n📧 Seu email';
    
    return `${intro}${details}`;
  }

  static generateConfirmation(appointmentDetails: any): string {
    const confirmations = [
      `✅ **Agendamento confirmado!**\n\n📅 **Data:** ${appointmentDetails.displayDate}\n⏰ **Horário:** ${appointmentDetails.startTime} às ${appointmentDetails.endTime}\n👨‍⚕️ **Consulta:** ${appointmentDetails.title}\n📧 **Email:** ${appointmentDetails.email}\n📍 **Local:** ${appointmentDetails.location}\n\nSeu agendamento foi criado com sucesso! Você receberá uma confirmação por email em breve.\n\nSe precisar cancelar ou reagendar, me avise!`,
      
      `🎉 **Pronto! Consulta agendada:**\n\n📅 ${appointmentDetails.displayDate}\n⏰ ${appointmentDetails.startTime} às ${appointmentDetails.endTime}\n🩺 ${appointmentDetails.title}\n📧 ${appointmentDetails.email}\n\nConfirmação enviada para seu email!`,
      
      `✨ **Agendamento realizado com sucesso!**\n\n📅 ${appointmentDetails.displayDate}\n⏰ ${appointmentDetails.startTime}-${appointmentDetails.endTime}\n👩‍⚕️ ${appointmentDetails.title}\n\nDetalhes enviados para ${appointmentDetails.email}. Qualquer dúvida, é só falar!`
    ];
    
    return confirmations[Math.floor(Math.random() * confirmations.length)];
  }

  static generateErrorResponse(): string {
    const errors = [
      "Ops! Algo deu errado. Pode tentar novamente? 🤔",
      "Desculpe, tive um probleminha técnico. Vamos tentar de novo?",
      "Eita! Parece que houve uma falha. Pode repetir sua solicitação?"
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  static generateGenericHelp(): string {
    const helps = [
      "Posso te ajudar com:\n\n📅 Agendar consultas\n🔄 Reagendar ou cancelar\n📋 Informações sobre a clínica\n\nO que você precisa?",
      
      "Estou aqui para:\n\n✅ Marcar suas consultas\n✅ Alterar agendamentos\n✅ Responder suas dúvidas\n\nComo posso ajudar?",
      
      "Posso fazer por você:\n\n📝 Agendamentos\n🔄 Alterações de horário\n❌ Cancelamentos\n💡 Informações da clínica\n\nEm que posso ser útil?"
    ];
    
    return helps[Math.floor(Math.random() * helps.length)];
  }

  static generateContextualResponse(intent: string, stage: string): string {
    if (intent === 'scheduling' && stage === 'information') {
      return "Para o agendamento, preciso da data, horário e tipo de consulta.";
    }
    
    if (intent === 'information') {
      return "Que informação você gostaria de saber sobre nossa clínica?";
    }
    
    return this.generateGenericHelp();
  }
}
