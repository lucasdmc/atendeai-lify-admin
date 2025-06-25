
export class ConversationInputAnalyzer {
  static analyzeUserInput(message: string): any {
    const lowerMessage = message.toLowerCase().trim();
    
    return {
      isAppointmentRequest: this.isAppointmentRequest(message),
      isSpecialtySelection: this.isSpecialtySelection(message),
      isTimeSelection: this.isTimeSelection(message),
      isConfirmation: this.isConfirmation(message),
      extractedSpecialty: this.extractSpecialty(message),
      extractedTime: this.extractTime(message),
      extractedDate: this.extractDate(message)
    };
  }

  private static isAppointmentRequest(message: string): boolean {
    const keywords = ['agendar', 'marcar', 'consulta', 'agendamento'];
    return keywords.some(keyword => message.toLowerCase().includes(keyword));
  }

  private static isSpecialtySelection(message: string): boolean {
    const specialties = ['cardiologia', 'dermatologia', 'ginecologia', 'ortopedia', 'pediatria', 'geral'];
    return specialties.some(spec => message.toLowerCase().includes(spec));
  }

  private static isTimeSelection(message: string): boolean {
    // Detectar horários no formato HH:MM ou HHh
    const timePattern = /\b(\d{1,2}):?(\d{2})?\b|\b(\d{1,2})h\b/;
    return timePattern.test(message);
  }

  private static isConfirmation(message: string): boolean {
    const confirmWords = ['sim', 'confirmo', 'ok', 'correto', 'certo'];
    const negateWords = ['não', 'nao', 'errado'];
    const lowerMessage = message.toLowerCase();
    
    return confirmWords.some(word => lowerMessage.includes(word)) || 
           negateWords.some(word => lowerMessage.includes(word));
  }

  private static extractSpecialty(message: string): string | null {
    const specialtyMap = {
      'cardiologia': ['cardio', 'coração', 'cardiologia', 'cardiologista'],
      'dermatologia': ['derma', 'pele', 'dermatologia', 'dermatologista'],
      'ginecologia': ['gineco', 'ginecologia', 'ginecologista'],
      'ortopedia': ['orto', 'osso', 'ortopedia', 'ortopedista'],
      'pediatria': ['pediatra', 'criança', 'pediatria'],
      'clínico geral': ['geral', 'clínico', 'clinico geral']
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [specialty, keywords] of Object.entries(specialtyMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return specialty;
      }
    }
    
    return null;
  }

  private static extractTime(message: string): string | null {
    // Extrair horário em formatos: 10:00, 10h, às 10h, etc.
    const timePatterns = [
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})h/,
      /às?\s*(\d{1,2})/i
    ];

    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hours = parseInt(match[1]);
        if (hours >= 8 && hours <= 17) {
          return `${hours.toString().padStart(2, '0')}:00`;
        }
      }
    }
    
    return null;
  }

  private static extractDate(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    
    // Detectar "amanhã"
    if (lowerMessage.includes('amanha') || lowerMessage.includes('amanhã')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toLocaleDateString('pt-BR');
    }
    
    // Detectar datas DD/MM ou DD/MM/YYYY
    const datePattern = /(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/;
    const match = message.match(datePattern);
    
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3] || new Date().getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    return null;
  }
}
