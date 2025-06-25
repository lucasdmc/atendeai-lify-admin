
import { ConversationMemory } from './conversation-memory.ts';

export class MedicalContextManager {
  static getMedicalContext(memory: ConversationMemory): string {
    if (!memory) return '';
    
    let context = '';
    
    if (memory.medicalHistory) {
      context += `HISTÓRICO MÉDICO: ${memory.medicalHistory}\n`;
    }
    
    if (memory.conversationContext?.interactionHistory) {
      const medicalTopics = memory.conversationContext.interactionHistory
        .filter(interaction => this.isMedicalTopic(interaction.topic))
        .slice(-3); // Últimas 3 interações médicas
      
      if (medicalTopics.length > 0) {
        context += `TÓPICOS MÉDICOS RECENTES: ${medicalTopics.map(t => t.topic).join(', ')}\n`;
      }
    }
    
    return context;
  }
  
  private static isMedicalTopic(topic: string): boolean {
    const medicalKeywords = [
      'consulta', 'sintoma', 'dor', 'medicamento', 'exame', 
      'tratamento', 'médico', 'saúde', 'diagnóstico'
    ];
    
    return medicalKeywords.some(keyword => 
      topic.toLowerCase().includes(keyword)
    );
  }
  
  static updateMedicalHistory(memory: ConversationMemory, newInfo: string): void {
    if (!memory.medicalHistory) {
      memory.medicalHistory = newInfo;
    } else {
      memory.medicalHistory += `\n${newInfo}`;
    }
    
    // Manter histórico limitado para não ficar muito longo
    const lines = memory.medicalHistory.split('\n');
    if (lines.length > 10) {
      memory.medicalHistory = lines.slice(-10).join('\n');
    }
  }
}
