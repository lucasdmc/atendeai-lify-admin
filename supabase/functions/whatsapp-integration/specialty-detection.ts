
import { SpecialtyDetectionResult } from './conversation-flow-types.ts';

export class SpecialtyDetector {
  private static readonly SPECIALTIES = {
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
    'geral': 'Clínica Geral',
    'clínica geral': 'Clínica Geral',
    'clinica geral': 'Clínica Geral'
  };

  static detectFromMessage(message: string): SpecialtyDetectionResult {
    const lowerMessage = message.toLowerCase();
    
    for (const [key, value] of Object.entries(this.SPECIALTIES)) {
      if (lowerMessage.includes(key)) {
        return {
          specialty: value,
          confidence: 0.9
        };
      }
    }
    
    return { confidence: 0 };
  }

  static getSpecialtyMenuResponse(): string {
    return `Perfeito! Para qual especialidade você gostaria de agendar? 😊

🩺 **Clínica Geral**
❤️ **Cardiologia** 
🧠 **Psicologia**
🌟 **Dermatologia**
👩‍⚕️ **Ginecologia**
🦴 **Ortopedia**
👶 **Pediatria**

É só me dizer qual você precisa! 💙`;
  }

  static getSpecialtyHelpResponse(): string {
    return `Me ajuda a entender! Qual dessas especialidades você precisa? 😊

🩺 Clínica Geral
❤️ Cardiologia
🧠 Psicologia
🌟 Dermatologia
👩‍⚕️ Ginecologia
🦴 Ortopedia
👶 Pediatria

É só falar o nome da especialidade! 💙`;
  }
}
