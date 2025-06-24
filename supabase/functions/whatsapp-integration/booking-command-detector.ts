
export function detectBookingCommand(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  // Comandos que iniciam o fluxo de agendamento
  const bookingCommands = [
    '/agendar',
    'agendar',
    'quero agendar',
    'agendar consulta',
    'marcar consulta',
    'marcar horário',
    'reservar horário'
  ];
  
  return bookingCommands.some(command => 
    lowerMessage === command || lowerMessage.startsWith(command + ' ')
  );
}

export function detectBookingResponse(message: string, sessionState: string): {
  isResponse: boolean;
  responseType?: 'date' | 'time' | 'confirmation' | 'cancel';
  value?: string;
} {
  const lowerMessage = message.toLowerCase().trim();
  
  // Cancelamento
  if (lowerMessage.includes('cancelar') || lowerMessage.includes('sair') || lowerMessage === '/cancelar') {
    return { isResponse: true, responseType: 'cancel' };
  }
  
  // Respostas baseadas no estado da sessão
  switch (sessionState) {
    case 'awaiting_date':
      // Detectar seleção de data (formato DD/MM ou número do dia)
      const datePattern = /^(\d{1,2})(\/\d{1,2})?$/;
      const dayPattern = /^(\d{1,2})$/;
      
      if (datePattern.test(message) || dayPattern.test(message)) {
        return { isResponse: true, responseType: 'date', value: message };
      }
      break;
      
    case 'awaiting_time':
      // Detectar seleção de horário (número ou horário)
      const timePattern = /^(\d{1,2}):?(\d{2})?$/;
      const optionPattern = /^(\d+)$/;
      
      if (timePattern.test(message) || optionPattern.test(message)) {
        return { isResponse: true, responseType: 'time', value: message };
      }
      break;
      
    case 'awaiting_confirmation':
      if (lowerMessage.includes('confirmar') || lowerMessage.includes('sim') || lowerMessage === 's') {
        return { isResponse: true, responseType: 'confirmation', value: 'yes' };
      }
      if (lowerMessage.includes('não') || lowerMessage.includes('nao') || lowerMessage === 'n') {
        return { isResponse: true, responseType: 'confirmation', value: 'no' };
      }
      break;
  }
  
  return { isResponse: false };
}
