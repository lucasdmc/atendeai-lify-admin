
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
  
  // Formato DD/MM/YYYY ou DD/MM
  const dateRegex = /(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{2,4}))?/;
  const dateMatch = message.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1].padStart(2, '0');
    const month = dateMatch[2].padStart(2, '0');
    const year = dateMatch[4] || new Date().getFullYear();
    result.date = `${year}-${month}-${day}`;
    result.displayDate = `${day}/${month}/${year}`;
    dateFound = true;
    console.log('📅 Data encontrada (formato numérico):', result.date);
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
        const currentYear = new Date().getFullYear();
        result.date = `${currentYear}-${monthNum}-${day}`;
        result.displayDate = `${day}/${monthNum}/${currentYear}`;
        dateFound = true;
        console.log('📅 Data encontrada (formato texto):', result.date);
      }
    }
  }

  // Extrair horário - mais flexível
  const timeRegex = /(\d{1,2}):?(\d{0,2})\s*h?(?:oras?)?(?:\s*(?:às?|até|-)?\s*(\d{1,2}):?(\d{0,2})\s*h?(?:oras?)?)?/gi;
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

  // Extrair tipo de consulta - mais abrangente
  const consultationTypes = [
    'dermatologia', 'cardiologia', 'neurologia', 'ortopedia', 'ortopedista',
    'ginecologia', 'ginecologista', 'pediatria', 'pediatra', 'clínico geral',
    'consulta geral', 'retorno', 'check-up', 'exame', 'avaliação',
    'oftalmologia', 'oftalmologista', 'psiquiatria', 'psiquiatra',
    'endocrinologia', 'endocrinologista', 'urologia', 'urologista'
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

  // Verificar se temos dados suficientes - mais flexível
  result.hasRequiredData = !!(result.date && result.startTime && result.endTime);
  
  // Se tem email, é ainda melhor
  if (result.email) {
    result.hasRequiredData = result.hasRequiredData && !!result.email;
  }
  
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
