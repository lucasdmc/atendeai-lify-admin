
import { ConversationMemory } from './conversation-memory.ts';

export class MedicalContextManager {
  static getMedicalContext(memory: ConversationMemory): string {
    let context = '';
    
    if (memory.personalityProfile.medicalHistory.length > 0) {
      context += `Histórico médico conhecido: ${memory.personalityProfile.medicalHistory.join(', ')}. `;
    }
    
    if (memory.conversationContext.nextAppointment) {
      context += `Próxima consulta: ${memory.conversationContext.nextAppointment}. `;
    }
    
    if (memory.conversationContext.lastAppointment) {
      context += `Última consulta: ${memory.conversationContext.lastAppointment}. `;
    }
    
    if (memory.conversationContext.recentConcerns.length > 0) {
      context += `Preocupações recentes: ${memory.conversationContext.recentConcerns.join(', ')}.`;
    }
    
    return context || 'Nenhum histórico médico específico conhecido ainda.';
  }
}
