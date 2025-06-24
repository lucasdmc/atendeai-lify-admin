
// Função para detectar se a mensagem é sobre agendamento
export function isAppointmentRelated(message: string): boolean {
  console.log('🔍 Verificando se mensagem é sobre agendamento:', message);
  
  const appointmentKeywords = [
    // Agendamento/Marcação
    'agendar', 'marcar', 'consulta', 'horário', 'agenda', 'atendimento',
    'disponibilidade', 'vaga', 'hora', 'data', 'médico', 'doutor', 'doutora',
    
    // Cancelamento
    'cancelar', 'desmarcar', 'cancela', 'desmarca',
    
    // Reagendamento
    'reagendar', 'alterar', 'mudar', 'trocar', 'remarcar',
    
    // Especialidades médicas
    'cardiologia', 'dermatologia', 'ginecologia', 'ortopedia', 'pediatria',
    'clínico geral', 'neurologista', 'oftalmologista', 'psiquiatra',
    
    // Contexto médico
    'especialidade', 'especialista', 'clínica', 'hospital', 'posto',
    'exame', 'retorno', 'primeira vez', 'emergência', 'urgente'
  ];

  const lowerMessage = message.toLowerCase();
  
  // Verificar palavras-chave diretas
  const hasDirectKeyword = appointmentKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  // Verificar padrões de horário (ex: 14:00, 2:30, meio-dia)
  const timePatterns = [
    /\d{1,2}:\d{2}/, // 14:30, 9:15
    /\d{1,2}h\d{0,2}/, // 14h30, 9h
    /meio[- ]?dia/, // meio-dia, meio dia
    /manhã/, // manhã
    /tarde/, // tarde
    /noite/, // noite
  ];
  
  const hasTimePattern = timePatterns.some(pattern => 
    pattern.test(lowerMessage)
  );
  
  // Verificar padrões de data
  const datePatterns = [
    /\d{1,2}\/\d{1,2}/, // 25/12, 1/3
    /\d{1,2}\/\d{1,2}\/\d{2,4}/, // 25/12/2024
    /(segunda|terça|quarta|quinta|sexta|sábado|domingo)/, // dias da semana
    /(hoje|amanhã|depois|próxim)/, // referências temporais
    /(janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)/, // meses
  ];
  
  const hasDatePattern = datePatterns.some(pattern => 
    pattern.test(lowerMessage)
  );

  // Verificar números (possivelmente escolhendo opção do menu)
  const hasNumber = /^[1-7]$/.test(message.trim());

  // Verificar confirmações (sim/não)
  const isConfirmation = /^(sim|não|nao|ok|confirmo|correto)$/i.test(message.trim());

  const isRelated = hasDirectKeyword || hasTimePattern || hasDatePattern || hasNumber || isConfirmation;
  
  console.log(`📝 Análise de agendamento:`, {
    hasDirectKeyword,
    hasTimePattern,
    hasDatePattern,
    hasNumber,
    isConfirmation,
    isRelated
  });
  
  return isRelated;
}

// Função para extrair informações de agendamento da mensagem
export function extractAppointmentInfo(message: string): {
  service?: string;
  date?: string;
  time?: string;
  email?: string;
  name?: string;
} {
  const lowerMessage = message.toLowerCase();
  const info: any = {};

  // Extrair especialidades
  const services = {
    'cardiologia': ['cardio', 'coração', 'cardiologia', 'cardiologista'],
    'dermatologia': ['derma', 'pele', 'dermatologia', 'dermatologista'],
    'ginecologia': ['gineco', 'ginecologia', 'ginecologista', 'mulher'],
    'ortopedia': ['orto', 'osso', 'ortopedia', 'ortopedista'],
    'pediatria': ['pediatra', 'criança', 'pediatria', 'infantil'],
    'clínico geral': ['geral', 'clínico', 'clinico geral', 'consulta geral']
  };

  for (const [service, keywords] of Object.entries(services)) {
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      info.service = service;
      break;
    }
  }

  // Extrair horário
  const timeMatch = message.match(/(\d{1,2}):?(\d{2})/);
  if (timeMatch) {
    info.time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  // Extrair email
  const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) {
    info.email = emailMatch[1];
  }

  // Extrair nome (texto após "nome:" ou similar)
  const nameMatch = message.match(/(?:nome?:?\s*)([a-zA-ZÀ-ÿ\s]+?)(?:\s*email|$)/i);
  if (nameMatch) {
    info.name = nameMatch[1].trim();
  }

  return info;
}

// Função para validar informações de agendamento
export function validateAppointmentData(data: {
  service?: string;
  date?: string;
  time?: string;
  email?: string;
  name?: string;
}): {
  isValid: boolean;
  missing: string[];
  errors: string[];
} {
  const missing: string[] = [];
  const errors: string[] = [];

  if (!data.service) missing.push('especialidade');
  if (!data.date) missing.push('data');
  if (!data.time) missing.push('horário');
  if (!data.email) missing.push('email');
  if (!data.name) missing.push('nome');

  // Validar email
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Email inválido');
  }

  // Validar horário
  if (data.time && !/^\d{2}:\d{2}$/.test(data.time)) {
    errors.push('Horário deve estar no formato HH:MM');
  }

  return {
    isValid: missing.length === 0 && errors.length === 0,
    missing,
    errors
  };
}

// Função para formatar data em português
export function formatDateForDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const formatted = date.toLocaleDateString('pt-BR');
  
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} (${formatted})`;
}

// Função para verificar se é horário comercial
export function isBusinessHours(time: string): boolean {
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // 8:00 às 18:00
  return totalMinutes >= 8 * 60 && totalMinutes <= 18 * 60;
}
