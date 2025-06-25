
// Utility functions for analyzing and processing messages

export function shouldRespondQuickly(message: string, recentMessages: any[]): boolean {
  const quickKeywords = ['oi', 'olá', 'sim', 'não', 'ok', 'obrigado', 'tchau'];
  const lowerMessage = message.toLowerCase();
  
  if (quickKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // Se é uma resposta muito curta
  if (message.length < 10) {
    return true;
  }
  
  return false;
}

export function detectAppointmentIntent(message: string): any {
  const lowerMessage = message.toLowerCase();
  
  // Keywords para agendamento
  const appointmentKeywords = [
    'agendar', 'agendamento', 'marcar', 'consulta', 'horário',
    'disponibilidade', 'psicolog', 'cardio', 'dermat', 'gineco'
  ];
  
  const hasAppointmentKeyword = appointmentKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Detectar especialidade
  let specialty = null;
  if (lowerMessage.includes('psicolog')) specialty = 'Psicologia';
  if (lowerMessage.includes('cardio')) specialty = 'Cardiologia';
  if (lowerMessage.includes('dermat')) specialty = 'Dermatologia';
  if (lowerMessage.includes('gineco')) specialty = 'Ginecologia';
  if (lowerMessage.includes('pediatr')) specialty = 'Pediatria';
  if (lowerMessage.includes('geral') || lowerMessage.includes('clínic')) specialty = 'Clínica Geral';
  
  // Detectar data
  const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-]?(\d{2,4})?/;
  const dateMatch = message.match(datePattern);
  
  // Detectar horário
  const timePattern = /(\d{1,2}):?(\d{2})|(\d{1,2})h/;
  const timeMatch = message.match(timePattern);
  
  return {
    isAppointmentRelated: hasAppointmentKeyword,
    specialty,
    date: dateMatch ? dateMatch[0] : null,
    time: timeMatch ? timeMatch[0] : null,
    confidence: hasAppointmentKeyword ? 0.8 : 0.2
  };
}
