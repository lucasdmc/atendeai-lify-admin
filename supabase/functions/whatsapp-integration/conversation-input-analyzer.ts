
import { UserInputAnalysis } from './conversation-state-types.ts';

export class ConversationInputAnalyzer {
  static analyzeUserInput(message: string): UserInputAnalysis {
    const lowerMessage = message.toLowerCase().trim();
    
    // Detectar saudações (mais flexível)
    const greetingPatterns = ['oi', 'olá', 'ola', 'hello', 'hi', 'bom dia', 'boa tarde', 'boa noite'];
    const isGreeting = greetingPatterns.some(greeting => lowerMessage.includes(greeting));
    
    // Detectar solicitação de agendamento (mais flexível)
    const appointmentPatterns = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'hora', 'médico', 'doutor'];
    const isAppointmentRequest = appointmentPatterns.some(pattern => lowerMessage.includes(pattern));
    
    // Detectar seleção de especialidade (melhorado)
    const specialties = {
      'ortopedia': 'Ortopedia',
      'ortopedista': 'Ortopedia', 
      'osso': 'Ortopedia',
      'cardiologia': 'Cardiologia',
      'cardio': 'Cardiologia',
      'cardiologista': 'Cardiologia',
      'coração': 'Cardiologia',
      'psicologia': 'Psicologia',
      'psico': 'Psicologia',
      'psicologo': 'Psicologia',
      'psicóloga': 'Psicologia',
      'dermatologia': 'Dermatologia',
      'derma': 'Dermatologia',
      'dermatologista': 'Dermatologia',
      'pele': 'Dermatologia',
      'ginecologia': 'Ginecologia',
      'gineco': 'Ginecologia',
      'ginecologista': 'Ginecologia',
      'pediatria': 'Pediatria',
      'pediatr': 'Pediatria',
      'pediatra': 'Pediatria',
      'criança': 'Pediatria',
      'clínica geral': 'Clínica Geral',
      'clinica geral': 'Clínica Geral',
      'geral': 'Clínica Geral',
      'clínico geral': 'Clínica Geral'
    };
    
    let extractedSpecialty = '';
    for (const [key, value] of Object.entries(specialties)) {
      if (lowerMessage.includes(key)) {
        extractedSpecialty = value;
        break;
      }
    }
    
    // Detectar seleção de horário (muito mais flexível)
    const timePatterns = [
      /(?:às?\s*)?(\d{1,2})(?:h|:00|:\d{2})?(?:\s*(?:da\s*)?(?:manhã|tarde))?/i,
      /(\d{1,2}):(\d{2})/,
      /(\d{1,2})\s*horas?/i,
      /(\d{1,2})\s*da\s*(manhã|tarde)/i
    ];
    
    let extractedTime = '';
    for (const pattern of timePatterns) {
      const match = message.match(pattern);
      if (match) {
        const hour = parseInt(match[1]);
        if (hour >= 8 && hour <= 18) {
          extractedTime = `${hour.toString().padStart(2, '0')}:00`;
          break;
        }
      }
    }

    // Detectar data (mais flexível)
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
      /dia\s+(\d{1,2})\/(\d{1,2})/i,
      /(\d{1,2})\s+de\s+(\w+)/i,
      /amanhã|amanha/i,
      /hoje/i,
      /depois\s+de\s+amanhã/i
    ];
    
    let extractedDate = '';
    for (const pattern of datePatterns) {
      const match = message.match(pattern);
      if (match) {
        if (pattern.source.includes('amanhã') || pattern.source.includes('amanha')) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          extractedDate = tomorrow.toLocaleDateString('pt-BR');
        } else if (pattern.source.includes('hoje')) {
          extractedDate = new Date().toLocaleDateString('pt-BR');
        } else {
          extractedDate = match[0];
        }
        break;
      }
    }

    // Detectar confirmação (mais amplo)
    const confirmationWords = ['sim', 'confirmar', 'confirmo', 'ok', 'certo', 'perfeito', 'pode ser', 'tá bom', 'beleza', 'fechado'];
    const isConfirmation = confirmationWords.some(word => lowerMessage.includes(word));

    // Detectar email
    const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    const extractedEmail = emailMatch ? emailMatch[1] : undefined;

    // Detectar nome (melhorado)
    const namePatterns = [
      /(?:nome|sou|me chamo|eu sou)\s+([A-Za-zÀ-ÿ\s]+)/i,
      /^([A-Za-zÀ-ÿ]+(?:\s+[A-Za-zÀ-ÿ]+)+)$/
    ];
    
    let extractedName = undefined;
    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        extractedName = match[1].trim();
        break;
      }
    }

    return {
      isTimeSelection: !!extractedTime,
      isConfirmation,
      isSpecialtySelection: !!extractedSpecialty,
      isGreeting,
      isAppointmentRequest,
      extractedTime,
      extractedDate,
      extractedEmail,
      extractedName,
      extractedSpecialty
    };
  }
}
