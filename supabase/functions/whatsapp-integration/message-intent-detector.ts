
import { MessageDetectionResult } from './conversation-flow-types.ts';

export class MessageIntentDetector {
  static detectIntent(message: string): MessageDetectionResult {
    const lowerMessage = message.toLowerCase();
    
    const greetings = ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'hello'];
    const isGreeting = greetings.some(greeting => lowerMessage.includes(greeting));

    const appointmentKeywords = ['agendar', 'agendamento', 'consulta', 'marcar', 'horário', 'médico', 'doutor', 'hora'];
    const isAppointmentRequest = appointmentKeywords.some(keyword => lowerMessage.includes(keyword));

    return {
      isGreeting,
      isAppointmentRequest
    };
  }

  static getGreetingResponse(): string {
    return `Oi! 😊 Sou a Lia, assistente aqui da clínica!
Como posso te ajudar hoje? 💙`;
  }

  static getContextualHelp(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
      return `Claro! Posso te ajudar com agendamentos de consulta! 😊

É só me dizer:
📅 **A especialidade** que você precisa
⏰ **A data e horário** de sua preferência

Exemplo: "Quero agendar cardiologia para amanhã às 10h"

O que você gostaria de agendar? 💙`;
    }
    
    return `Entendi! Posso te ajudar com agendamentos de consulta! 😊

Me diga qual especialidade você precisa e para quando? 💙`;
  }
}
