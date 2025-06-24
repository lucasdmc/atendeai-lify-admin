
interface UserProfile {
  phoneNumber: string;
  name?: string;
  email?: string;
  preferredSpecialty?: string;
  communicationStyle: 'formal' | 'casual' | 'mixed';
  responseLength: 'short' | 'medium' | 'long';
  lastInteraction: number;
  appointmentHistory: any[];
  preferences: Record<string, any>;
}

export class UserProfileManager {
  private static profiles: Map<string, UserProfile> = new Map();

  static getProfile(phoneNumber: string): UserProfile {
    if (!this.profiles.has(phoneNumber)) {
      this.profiles.set(phoneNumber, {
        phoneNumber,
        communicationStyle: 'mixed',
        responseLength: 'medium',
        lastInteraction: Date.now(),
        appointmentHistory: [],
        preferences: {}
      });
    }
    return this.profiles.get(phoneNumber)!;
  }

  static updateProfile(phoneNumber: string, updates: Partial<UserProfile>) {
    const profile = this.getProfile(phoneNumber);
    Object.assign(profile, updates, { lastInteraction: Date.now() });
    this.profiles.set(phoneNumber, profile);
  }

  static analyzeUserStyle(message: string, phoneNumber: string) {
    const profile = this.getProfile(phoneNumber);
    
    // Detectar estilo de comunicação
    const formalIndicators = ['por favor', 'obrigado', 'gostaria', 'poderia'];
    const casualIndicators = ['oi', 'valeu', 'blz', 'ok'];
    
    const formalScore = formalIndicators.filter(word => 
      message.toLowerCase().includes(word)
    ).length;
    
    const casualScore = casualIndicators.filter(word => 
      message.toLowerCase().includes(word)
    ).length;
    
    if (formalScore > casualScore) {
      profile.communicationStyle = 'formal';
    } else if (casualScore > formalScore) {
      profile.communicationStyle = 'casual';
    }
    
    // Detectar preferência de tamanho de resposta
    if (message.length < 20) {
      profile.responseLength = 'short';
    } else if (message.length > 100) {
      profile.responseLength = 'long';
    }
    
    this.updateProfile(phoneNumber, profile);
  }

  static getPersonalizationContext(phoneNumber: string): string {
    const profile = this.getProfile(phoneNumber);
    
    let context = '';
    
    if (profile.communicationStyle === 'formal') {
      context += 'Use linguagem formal e respeitosa. ';
    } else if (profile.communicationStyle === 'casual') {
      context += 'Use linguagem casual e descontraída. ';
    }
    
    if (profile.responseLength === 'short') {
      context += 'Respostas concisas e diretas. ';
    } else if (profile.responseLength === 'long') {
      context += 'Respostas detalhadas e explicativas. ';
    }
    
    if (profile.preferredSpecialty) {
      context += `Especialidade preferida: ${profile.preferredSpecialty}. `;
    }
    
    return context;
  }

  static addAppointmentToHistory(phoneNumber: string, appointment: any) {
    const profile = this.getProfile(phoneNumber);
    profile.appointmentHistory.push({
      ...appointment,
      timestamp: Date.now()
    });
    
    // Detectar especialidade preferida
    if (appointment.specialty) {
      const specialtyCount = profile.appointmentHistory.filter(apt => 
        apt.specialty === appointment.specialty
      ).length;
      
      if (specialtyCount >= 2) {
        profile.preferredSpecialty = appointment.specialty;
      }
    }
    
    this.updateProfile(phoneNumber, profile);
  }
}
