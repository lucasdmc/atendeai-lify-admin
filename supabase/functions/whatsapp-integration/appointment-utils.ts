
export function isAppointmentRelated(message: string): boolean {
  const appointmentKeywords = [
    'agendar', 'agendamento', 'consulta', 'horário', 'marcar',
    'reagendar', 'cancelar', 'desmarcar', 'alterar', 'mudar',
    'disponibilidade', 'agenda', 'atendimento'
  ];
  
  const lowerMessage = message.toLowerCase();
  return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
}

export function extractAppointmentData(message: string): any {
  console.log('🔍 Extraindo dados de agendamento da mensagem...');
  
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

  // Extrair data (formatos: DD/MM/YYYY, DD/MM, DD de MMMM)
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
  const dateMatch = message.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[3];
    result.date = `${year}-${month}-${day}`;
    result.displayDate = `${day}/${month}/${year}`;
    console.log('📅 Data encontrada:', result.date);
  } else {
    // Tentar formato "DD de MMMM"
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
        const currentYear = new Date().getFullYear();
        result.date = `${currentYear}-${monthNum}-${day}`;
        result.displayDate = `${day}/${monthNum}/${currentYear}`;
        console.log('📅 Data em texto encontrada:', result.date);
      }
    }
  }

  // Extrair horário
  const timeRegex = /(\d{1,2}):?(\d{0,2})\s*h?(?:oras?)?(?:\s*(?:às?|até)\s*(\d{1,2}):?(\d{0,2})\s*h?(?:oras?)?)?/g;
  const timeMatches = [...message.matchAll(timeRegex)];
  
  if (timeMatches.length > 0) {
    const firstTime = timeMatches[0];
    const startHour = firstTime[1].padStart(2, '0');
    const startMin = (firstTime[2] || '00').padStart(2, '0');
    result.startTime = `${startHour}:${startMin}`;
    
    // Se há horário de fim especificado
    if (firstTime[3]) {
      const endHour = firstTime[3].padStart(2, '0');
      const endMin = (firstTime[4] || '00').padStart(2, '0');
      result.endTime = `${endHour}:${endMin}`;
    } else {
      // Assumir 1 hora de duração
      const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
      result.endTime = `${endHour}:${startMin}`;
    }
    
    console.log('🕐 Horário encontrado:', result.startTime, '-', result.endTime);
  }

  // Extrair tipo de consulta
  const consultationTypes = [
    'dermatologia', 'cardiologia', 'neurologia', 'ortopedia',
    'ginecologia', 'pediatria', 'consulta geral', 'retorno',
    'check-up', 'exame'
  ];
  
  for (const type of consultationTypes) {
    if (lowerMessage.includes(type)) {
      result.title = type.charAt(0).toUpperCase() + type.slice(1);
      console.log('👨‍⚕️ Tipo de consulta encontrado:', result.title);
      break;
    }
  }

  // Se não encontrou tipo específico, usar padrão
  if (!result.title) {
    result.title = 'Consulta Médica';
  }

  // Verificar se temos dados suficientes
  result.hasRequiredData = !!(result.date && result.startTime && result.endTime && result.email);
  
  console.log('✅ Dados extraídos:', {
    hasRequiredData: result.hasRequiredData,
    title: result.title,
    date: result.date,
    startTime: result.startTime,
    endTime: result.endTime,
    email: result.email
  });

  return result;
}
