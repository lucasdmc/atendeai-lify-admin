
export class ConversationValidator {
  static validateAppointmentData(data: any): {
    isValid: boolean;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // Validar data
    if (data.date) {
      const date = new Date(data.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        errors.push('Data não pode ser no passado');
        suggestions.push('Escolha uma data futura');
      }
      
      // Verificar se é final de semana (assumindo que não atende)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        errors.push('Não atendemos nos finais de semana');
        suggestions.push('Escolha uma data entre segunda e sexta-feira');
      }
    }
    
    // Validar horário
    if (data.time) {
      const [hours, minutes] = data.time.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      // Horário comercial: 8:00 às 18:00
      if (timeInMinutes < 8 * 60 || timeInMinutes > 18 * 60) {
        errors.push('Horário fora do funcionamento');
        suggestions.push('Escolha um horário entre 8:00 e 18:00');
      }
    }
    
    // Validar email
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email inválido');
        suggestions.push('Use formato: exemplo@email.com');
      }
    }
    
    // Validar nome
    if (data.name) {
      if (data.name.length < 2) {
        errors.push('Nome muito curto');
        suggestions.push('Informe seu nome completo');
      }
      
      if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(data.name)) {
        errors.push('Nome contém caracteres inválidos');
        suggestions.push('Use apenas letras e espaços');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    };
  }

  static validateTimeSlot(date: string, time: string): boolean {
    const appointmentDate = new Date(`${date}T${time}`);
    const now = new Date();
    
    // Não pode agendar no passado
    if (appointmentDate < now) {
      return false;
    }
    
    // Não pode agendar com menos de 2 horas de antecedência
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    if (appointmentDate < twoHoursFromNow) {
      return false;
    }
    
    return true;
  }

  static generateSuggestions(invalidData: any): string[] {
    const suggestions: string[] = [];
    
    if (invalidData.date) {
      suggestions.push('📅 Escolha uma data futura entre segunda e sexta-feira');
    }
    
    if (invalidData.time) {
      suggestions.push('🕐 Escolha um horário entre 8:00 e 18:00');
    }
    
    if (invalidData.email) {
      suggestions.push('📧 Use um email válido (exemplo@email.com)');
    }
    
    if (invalidData.name) {
      suggestions.push('👤 Informe seu nome completo');
    }
    
    return suggestions;
  }
}
