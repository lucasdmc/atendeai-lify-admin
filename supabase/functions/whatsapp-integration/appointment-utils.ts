
export function isAppointmentRelated(message: string): boolean {
  const appointmentKeywords = [
    'agendar', 'agendamento', 'consulta', 'horário', 'marcar',
    'reagendar', 'cancelar', 'desmarcar', 'alterar', 'mudar',
    'disponibilidade', 'agenda', 'atendimento', 'médico', 'doutor',
    'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo',
    'hoje', 'amanhã', 'próxima', 'próximo'
  ];
  
  const lowerMessage = message.toLowerCase();
  const hasKeyword = appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Verificar se tem padrões de data ou hora
  const hasDatePattern = /\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?/.test(message);
  const hasTimePattern = /\d{1,2}:?\d{0,2}\s*(h|hora|horas)?/i.test(message);
  const hasEmailPattern = /[\w\.-]+@[\w\.-]+\.\w+/.test(message);
  
  console.log('🔍 Análise de agendamento:', {
    message: message.substring(0, 50),
    hasKeyword,
    hasDatePattern,
    hasTimePattern,
    hasEmailPattern,
    isRelated: hasKeyword || (hasDatePattern && hasTimePattern)
  });
  
  return hasKeyword || (hasDatePattern && hasTimePattern);
}

export function extractAppointmentData(message: string): any {
  console.log('🔍 Extraindo dados de agendamento da mensagem:', message);
  
  const result = {
    hasRequiredData: false,
    title: '',
    description: '',
    date: '',
    displayDate: '',
    startTime: '',
    endTime: '',
    email: '',
    location: 'Clínica'
  };

  const lowerMessage = message.toLowerCase();
  
  // Extrair email
  const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
  const emailMatch = message.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[0];
    console.log('📧 Email encontrado:', result.email);
  }

  // Extrair data - formatos mais flexíveis
  let dateFound = false;
  const currentYear = new Date().getFullYear();
  
  // Formato DD/MM/YYYY ou DD/MM
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{2,4}))?/;
  const dateMatch = message.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    let year = dateMatch[4] ? parseInt(dateMatch[4]) : currentYear;
    
    // Se ano com 2 dígitos, assumir 20XX
    if (year < 100) {
      year = 2000 + year;
    }
    
    // Validar data
    const testDate = new Date(year, parseInt(month) - 1, parseInt(day));
    if (testDate.getFullYear() === year && 
        testDate.getMonth() === parseInt(month) - 1 && 
        testDate.getDate() === parseInt(day)) {
      result.date = `${year}-${month}-${day}`;
      result.displayDate = `${day}/${month}/${year}`;
      dateFound = true;
      console.log('📅 Data encontrada (formato numérico):', result.date);
    }
  }
  
  // Se não encontrou data numérica, tentar formato "DD de MMMM"
  if (!dateFound) {
    const monthNames = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    };
    
    const textDateRegex = /(\d{1,2})\s+de\s+(\w+)/i;
    const textDateMatch = message.match(textDateRegex);
    if (textDateMatch) {
      const day = textDateMatch[1].padStart(2, '0');
      const monthName = textDateMatch[2].toLowerCase();
      const monthNum = monthNames[monthName];
      if (monthNum) {
        result.date = `${currentYear}-${monthNum}-${day}`;
        result.displayDate = `${day}/${monthNum}/${currentYear}`;
        dateFound = true;
        console.log('📅 Data encontrada (formato texto):', result.date);
      }
    }
  }

  // Extrair horário - melhorado para capturar formatos mais flexíveis
  const timePatterns = [
    // Padrão HH:MM
    /(\d{1,2}):(\d{2})/g,
    // Padrão HH:MM com h
    /(\d{1,2}):(\d{2})h/g,
    // Padrão HHh ou HH h
    /(\d{1,2})\s*h(?:oras?)?/g,
    // Padrão apenas números seguidos de h
    /(\d{1,2})h/g
  ];
  
  let timeFound = false;
  
  for (const pattern of timePatterns) {
    const timeMatches = [...message.matchAll(pattern)];
    
    if (timeMatches.length > 0) {
      const firstTime = timeMatches[0];
      let startHour = parseInt(firstTime[1]);
      let startMin = firstTime[2] ? parseInt(firstTime[2]) : 0;
      
      // Validar horário
      if (startHour >= 0 && startHour <= 23 && startMin >= 0 && startMin <= 59) {
        result.startTime = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        
        // Assumir 1 hora de duração
        let endHour = startHour + 1;
        if (endHour > 23) endHour = 23;
        result.endTime = `${endHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
        
        timeFound = true;
        console.log('🕐 Horário encontrado:', result.startTime, '-', result.endTime);
        break;
      }
    }
  }

  // Extrair tipo de consulta
  const consultationTypes = [
    'dermatologia', 'cardiologia', 'cardiologista', 'neurologia', 'ortopedia', 'ortopedista',
    'ginecologia', 'ginecologista', 'pediatria', 'pediatra', 'clínico geral',
    'consulta geral', 'retorno', 'check-up', 'exame', 'avaliação',
    'oftalmologia', 'oftalmologista', 'psiquiatria', 'psiquiatra',
    'endocrinologia', 'endocrinologista', 'urologia', 'urologista'
  ];
  
  for (const type of consultationTypes) {
    if (lowerMessage.includes(type)) {
      if (type === 'cardiologista') {
        result.title = 'Cardiologia';
      } else {
        result.title = type.charAt(0).toUpperCase() + type.slice(1);
      }
      console.log('👨‍⚕️ Tipo de consulta encontrado:', result.title);
      break;
    }
  }

  // Se não encontrou tipo específico, usar padrão
  if (!result.title) {
    result.title = 'Consulta Médica';
  }

  // Verificar se temos dados suficientes para agendar
  result.hasRequiredData = !!(result.date && result.startTime && result.endTime && result.title);
  
  console.log('✅ Dados extraídos:', {
    hasRequiredData: result.hasRequiredData,
    title: result.title,
    date: result.date,
    startTime: result.startTime,
    endTime: result.endTime,
    email: result.email || 'não informado'
  });

  return result;
}
