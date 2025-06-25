
export class ConversationInputAnalyzer {
  static analyzeUserInput(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    return {
      isTimeSelection: this.isTimeSelection(message),
      isConfirmation: this.isConfirmation(lowerMessage),
      isSpecialtySelection: this.isSpecialtySelection(lowerMessage),
      isGreeting: this.isGreeting(lowerMessage),
      isAppointmentRequest: this.isAppointmentRequest(lowerMessage),
      extractedTime: this.extractTime(message),
      extractedDate: this.extractDate(message),
      extractedEmail: this.extractEmail(message),
      extractedName: this.extractName(message),
      extractedSpecialty: this.extractSpecialty(lowerMessage)
    };
  }

  static isTimeSelection(message: string): boolean {
    const timePatterns = [
      /\b\d{1,2}:\d{2}\b/,
      /\b\d{1,2}h\b/,
      /às?\s*\d{1,2}/i,
      /\d{1,2}\s*da\s*(manhã|tarde)/i
    ];
    return timePatterns.some(pattern => pattern.test(message));
  }

  static isConfirmation(lowerMessage: string): boolean {
    const confirmWords = ['sim', 'confirmo', 'ok', 'está certo', 'perfeito', 'correto'];
    return confirmWords.some(word => lowerMessage.includes(word));
  }

  static isSpecialtySelection(lowerMessage: string): boolean {
    const specialties = [
      'ortopedia', 'cardiologia', 'psicologia', 'dermatologia', 
      'ginecologia', 'pediatria', 'clínica geral', 'geral'
    ];
    return specialties.some(specialty => lowerMessage.includes(specialty));
  }

  static isGreeting(lowerMessage: string): boolean {
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'];
    return greetings.some(greeting => lowerMessage.includes(greeting));
  }

  static isAppointmentRequest(lowerMessage: string): boolean {
    const appointmentKeywords = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'médico', 'doutor'];
    return appointmentKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  static extractTime(message: string): string {
    // Padrões para detectar horário
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})h/,
      /às?\s*(\d{1,2})/i,
      /(\d{1,2})\s*da\s*(manhã|tarde)/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 8 && hour <= 18) {
          return `${hour.toString().padStart(2, '0')}:00`;
        }
      }
    }
    return '';
  }

  static extractDate(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Detectar "amanhã"
    if (lowerMessage.includes('amanha') || lowerMessage.includes('amanhã')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toLocaleDateString('pt-BR');
    }
    
    // Detectar datas no formato DD/MM ou DD/MM/YYYY
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})\/(\d{1,2})/
    ];
    
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        const day = match[1];
        const month = match[2];
        const year = match[3] || new Date().getFullYear();
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    
    return '';
  }

  static extractEmail(message: string): string | undefined {
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    const match = message.match(emailPattern);
    return match ? match[1] : undefined;
  }

  static extractName(message: string): string {
    // Melhorar a extração de nome
    const lines = message.split('\n');
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
    
    // Procurar por linha que contém "Nome:" seguido do nome
    for (const line of lines) {
      if (line.toLowerCase().includes('nome:')) {
        const name = line.replace(/nome:?/gi, '').trim();
        if (name && name.length > 1) {
          return name;
        }
      }
    }
    
    // Se não encontrou formato "Nome:", procurar por nomes em linhas separadas
    for (const line of lines) {
      const cleanLine = line.trim();
      // Se a linha não contém email e tem pelo menos 2 palavras com letras
      if (!emailPattern.test(cleanLine) && cleanLine.length > 2) {
        const words = cleanLine.split(' ');
        // Verificar se parece ser um nome (pelo menos 2 palavras, só letras e espaços)
        if (words.length >= 2 && words.every(word => /^[A-Za-zÀ-ÿ]+$/.test(word))) {
          return cleanLine;
        }
        // Ou se é uma única palavra que parece ser um nome (mais de 2 caracteres, só letras)
        if (words.length === 1 && /^[A-Za-zÀ-ÿ]{3,}$/.test(cleanLine)) {
          return cleanLine;
        }
      }
    }
    
    // Fallback: se tem apenas texto sem formato específico
    const cleanMessage = message.replace(emailPattern, '').trim();
    const words = cleanMessage.split(/\s+/);
    if (words.length >= 2 && words.every(word => /^[A-Za-zÀ-ÿ]+$/.test(word))) {
      return cleanMessage;
    }
    
    return '';
  }

  static extractSpecialty(lowerMessage: string): string {
    const specialties = {
      'ortopedia': 'Ortopedia',
      'ortopedista': 'Ortopedia',
      'cardiologia': 'Cardiologia',
      'cardio': 'Cardiologia',
      'cardiologista': 'Cardiologia',
      'psicologia': 'Psicologia',
      'psico': 'Psicologia',
      'psicologo': 'Psicologia',
      'dermatologia': 'Dermatologia',
      'derma': 'Dermatologia',
      'dermatologista': 'Dermatologia',
      'ginecologia': 'Ginecologia',
      'gineco': 'Ginecologia',
      'ginecologista': 'Ginecologia',
      'pediatria': 'Pediatria',
      'pediatra': 'Pediatria',
      'geral': 'Clínica Geral',
      'clínica geral': 'Clínica Geral'
    };

    for (const [key, value] of Object.entries(specialties)) {
      if (lowerMessage.includes(key)) {
        return value;
      }
    }
    return '';
  }
}
