
import { ConversationMemory } from './conversation-memory.ts';

export class PersonalityAdapter {
  static getPersonalityAdaptation(memory: ConversationMemory): string {
    const { communicationStyle, responsePreference } = memory.personalityProfile;
    
    let adaptation = '';
    
    switch (communicationStyle) {
      case 'formal':
        adaptation += 'O paciente prefere comunicação formal e respeitosa. Use "senhor/senhora" e seja mais protocolar.';
        break;
      case 'casual':
        adaptation += 'O paciente é casual e descontraído. Pode usar linguagem mais relaxada e próxima.';
        break;
      case 'direct':
        adaptation += 'O paciente valoriza objetividade. Seja direta, clara e vá direto ao ponto.';
        break;
      case 'empathetic':
        adaptation += 'O paciente aprecia empatia e cuidado. Seja mais acolhedora e demonstre preocupação genuína.';
        break;
    }
    
    switch (responsePreference) {
      case 'brief':
        adaptation += ' Prefere respostas concisas e diretas.';
        break;
      case 'detailed':
        adaptation += ' Aprecia explicações detalhadas e completas.';
        break;
      case 'step-by-step':
        adaptation += ' Gosta de orientações passo a passo e bem estruturadas.';
        break;
    }
    
    return adaptation;
  }

  static getRelationshipContext(memory: ConversationMemory): string {
    switch (memory.relationshipStage) {
      case 'first_contact':
        return 'PRIMEIRO CONTATO: Este é seu primeiro atendimento com este paciente. Seja acolhedora e estabeleça rapport.';
      case 'getting_familiar':
        return 'CONHECENDO O PACIENTE: Já tiveram algumas interações. Continue construindo confiança.';
      case 'established':
        return 'RELACIONAMENTO ESTABELECIDO: Vocês já se conhecem bem. Seja mais natural e personalizada.';
      case 'trusted':
        return 'RELACIONAMENTO DE CONFIANÇA: O paciente confia em você. Seja mais próxima e proativa.';
    }
  }
}
