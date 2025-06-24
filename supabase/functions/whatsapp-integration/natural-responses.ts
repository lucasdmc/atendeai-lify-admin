
export class NaturalResponseGenerator {
  static generateGreeting(userName?: string): string {
    const greetings = [
      `Olá${userName ? ` ${userName}` : ''}! 😊 Como posso ajudá-lo hoje?`,
      `Oi${userName ? `, ${userName}` : ''}! Em que posso ser útil?`,
      `Seja bem-vindo${userName ? `, ${userName}` : ''}! Como posso te ajudar?`
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  static generateSchedulingHelp(): string {
    const responses = [
      `Vou te ajudar a agendar sua consulta! Para isso, preciso de algumas informações:\n\n📅 Que dia você prefere?\n⏰ Qual horário funciona melhor?\n👨‍⚕️ Que tipo de consulta?\n📧 Seu email para confirmação`,
      
      `Perfeito! Vamos marcar sua consulta. Me informe:\n\n📅 **Data desejada**\n⏰ **Horário preferido**\n🩺 **Especialidade**\n📧 **Email para contato**`,
      
      `Claro! Para agendar, só preciso que você me conte:\n\n📅 Quando gostaria de ser atendido?\n⏰ Que horário prefere?\n👩‍⚕️ Qual consulta precisa?\n📧 Email para enviar confirmação`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  static generateInformationRequest(missingInfo: string[]): string {
    const casual_intros = [
      "Só preciso de mais algumas informações:",
      "Para finalizar, me informe:",
      "Quase lá! Preciso saber:",
      "Faltam só alguns detalhes:"
    ];
    
    const intro = casual_intros[Math.floor(Math.random() * casual_intros.length)];
    
    let details = '';
    if (missingInfo.includes('date')) details += '\n📅 Que dia você prefere?';
    if (missingInfo.includes('time')) details += '\n⏰ Qual horário?';
    if (missingInfo.includes('type')) details += '\n🩺 Tipo de consulta?';
    if (missingInfo.includes('email')) details += '\n📧 Seu email?';
    
    return `${intro}${details}`;
  }

  static generateConfirmation(appointmentDetails: any): string {
    const confirmations = [
      `Perfeito! ✅ Sua consulta está agendada:\n\n📅 ${appointmentDetails.date}\n⏰ ${appointmentDetails.time}\n🩺 ${appointmentDetails.type}\n\nVou enviar uma confirmação para ${appointmentDetails.email}!`,
      
      `Pronto! 🎉 Consulta marcada com sucesso:\n\n📅 **${appointmentDetails.date}**\n⏰ **${appointmentDetails.time}**\n🩺 **${appointmentDetails.type}**\n\nConfirmação enviada para ${appointmentDetails.email}`,
      
      `Tudo certo! ✨ Agendamento confirmado:\n\n📅 ${appointmentDetails.date}\n⏰ ${appointmentDetails.time}\n🩺 ${appointmentDetails.type}\n\nDetalhes foram enviados para ${appointmentDetails.email}`
    ];
    
    return confirmations[Math.floor(Math.random() * confirmations.length)];
  }

  static generateErrorResponse(): string {
    const errors = [
      "Ops! Algo deu errado aqui. Pode tentar novamente? 🤔",
      "Desculpe, tive um probleminha técnico. Vamos tentar de novo?",
      "Eita! Parece que tive uma falha. Pode repetir sua solicitação?"
    ];
    
    return errors[Math.floor(Math.random() * errors.length)];
  }

  static generateGenericHelp(): string {
    const helps = [
      "Posso te ajudar com:\n\n📅 Agendar consultas\n🔄 Reagendar ou cancelar\n📋 Ver seus agendamentos\n💬 Tirar dúvidas sobre a clínica\n\nO que você precisa?",
      
      "Estou aqui para:\n\n✅ Marcar suas consultas\n✅ Alterar agendamentos\n✅ Responder suas dúvidas\n✅ Informar sobre nossos serviços\n\nComo posso ajudar?",
      
      "Posso fazer por você:\n\n📝 Agendamentos\n🔄 Alterações de horário\n❌ Cancelamentos\n💡 Informações da clínica\n\nEm que posso ser útil?"
    ];
    
    return helps[Math.floor(Math.random() * helps.length)];
  }
}
