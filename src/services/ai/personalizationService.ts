import { supabase } from '@/integrations/supabase/client';
import { ConversationMemoryService } from './conversationMemoryService';

export interface PersonalizationContext {
  patientProfile: {
    name: string;
    phone: string;
    appointmentCount: number;
    lastAppointment?: {
      date: string;
      doctor: string;
      service: string;
    };
    preferredDoctor?: string;
    preferredTimes?: string[];
    commonServices?: string[];
    communicationPreference?: 'formal' | 'informal' | 'friendly';
    insurancePlan?: string;
    medicalHistory?: string[];
  };
  behaviorPatterns: {
    averageResponseTime: number;
    preferredChannels: string[];
    appointmentFrequency: number;
    cancellationRate: number;
    noShowRate: number;
  };
  opportunities: {
    crossSell: string[];
    upSell: string[];
    preventiveCare: string[];
    followUp: string[];
  };
}

export class PersonalizationService {
  /**
   * Carrega contexto completo de personalização do paciente
   */
  static async loadPersonalizationContext(phoneNumber: string): Promise<PersonalizationContext> {
    try {
      // Carregar memória da conversa
      const memory = await ConversationMemoryService.loadMemory(phoneNumber);
      
      // Buscar histórico de agendamentos
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_phone', phoneNumber)
        .order('appointment_date', { ascending: false })
        .limit(10);

      // Analisar padrões de comportamento
      const behaviorPatterns = await this.analyzeBehaviorPatterns(appointments || []);
      
      // Identificar oportunidades
      const opportunities = await this.identifyOpportunities(appointments || []);

      // Construir contexto de personalização
      return {
        patientProfile: {
          name: appointments?.[0]?.patient_name || memory.userProfile.name || 'Paciente',
          phone: phoneNumber,
          appointmentCount: appointments?.length || 0,
          ...(appointments?.[0] && {
            lastAppointment: {
              date: appointments[0].appointment_date,
              doctor: appointments[0].doctor_name,
              service: appointments[0].status
            }
          }),
          preferredTimes: this.extractPreferredTimes(appointments || []),
          commonServices: this.extractCommonServices(appointments || []),
          communicationPreference: this.detectCommunicationStyle(),
          insurancePlan: '',
          medicalHistory: []
        },
        behaviorPatterns,
        opportunities
      };
    } catch (error) {
      console.error('Error loading personalization context:', error);
      return this.getDefaultContext(phoneNumber);
    }
  }

  /**
   * Gera mensagem personalizada baseada no contexto
   */
  static generatePersonalizedMessage(
    template: string,
    context: PersonalizationContext,
    intent?: string
  ): string {
    let message = template;
    
    // Substituir variáveis básicas
    message = message.replace('[Nome]', context.patientProfile.name);
    
    // Personalização baseada em histórico
    if (context.patientProfile.appointmentCount > 0) {
      // Paciente recorrente
      if (intent === 'APPOINTMENT_CREATE' && context.patientProfile.preferredDoctor) {
        message = `Olá, ${context.patientProfile.name}! Bem-vindo(a) de volta. ` +
                 `Você costuma se consultar com ${context.patientProfile.preferredDoctor}. ` +
                 `Gostaria de marcar um novo horário com ele(a) ou prefere ver outras opções?`;
      }
    } else {
      // Paciente novo
      if (intent === 'APPOINTMENT_CREATE') {
        message = `Olá, ${context.patientProfile.name}! Seja muito bem-vindo(a) à nossa clínica. ` +
                 `Ficarei feliz em ajudá-lo(a) a agendar sua primeira consulta. ` +
                 `Temos excelentes profissionais em diversas especialidades. Por qual área gostaria de começar?`;
      }
    }
    
    // Ajustar tom baseado na preferência
    message = this.adjustTone(message, context.patientProfile.communicationPreference);
    
    return message;
  }

  /**
   * Sugere ações personalizadas (cross-sell/up-sell)
   */
  static async generatePersonalizedSuggestions(
    context: PersonalizationContext,
    currentService?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];
    
    // Cross-sell baseado no serviço atual
    if (currentService) {
      if (currentService.includes('cardiologia') && !context.patientProfile.medicalHistory?.includes('eletrocardiograma_recente')) {
        suggestions.push(
          'Muitos pacientes aproveitam para fazer um eletrocardiograma no mesmo dia. ' +
          'Gostaria de saber mais ou já incluir no seu agendamento?'
        );
      }
      
      if (currentService.includes('checkup') && context.patientProfile.appointmentCount > 2) {
        suggestions.push(
          'Notei que você é um paciente frequente. Temos um programa de check-up anual ' +
          'com condições especiais. Posso enviar mais informações?'
        );
      }
    }
    
    return suggestions;
  }

  /**
   * Adapta linguagem baseada no histórico
   */
  static adaptLanguageStyle(
    message: string,
    context: PersonalizationContext
  ): string {
    const style = context.patientProfile.communicationPreference || 'formal';
    
    switch (style) {
      case 'informal':
        return this.makeInformal(message);
      
      case 'friendly':
        return this.makeFriendly(message);
      
      case 'formal':
      default:
        return this.makeFormal(message);
    }
  }

  // Métodos auxiliares (implementações simplificadas)
  private static async analyzeBehaviorPatterns(appointments: any[]): Promise<PersonalizationContext['behaviorPatterns']> {
    return {
      averageResponseTime: 60,
      preferredChannels: ['whatsapp'],
      appointmentFrequency: appointments?.length || 0,
      cancellationRate: 0.1,
      noShowRate: 0.05
    };
  }

  private static async identifyOpportunities(_appointments: any[]): Promise<PersonalizationContext['opportunities']> {
    return {
      crossSell: ['Eletrocardiograma', 'Check-up anual'],
      upSell: ['Programa de acompanhamento'],
      preventiveCare: ['Vacinas em dia'],
      followUp: ['Retorno pós-consulta']
    };
  }

  private static extractPreferredDoctor(appointments: any[]): string | undefined {
    if (!appointments || appointments.length === 0) return undefined;
    // Exemplo: retorna o médico mais frequente
    const freq: Record<string, number> = {};
    appointments.forEach(a => {
      if (a.doctor_name) freq[a.doctor_name] = (freq[a.doctor_name] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0];
  }

  private static extractPreferredTimes(appointments: any[]): string[] {
    const times = appointments.map(apt => apt.appointment_time).filter(Boolean);
    return [...new Set(times)].slice(0, 3);
  }

  private static extractCommonServices(appointments: any[]): string[] {
    const services = appointments.map(apt => apt.status).filter(Boolean);
    return [...new Set(services)].slice(0, 5);
  }

  private static detectCommunicationStyle(): 'formal' | 'informal' | 'friendly' {
    return 'formal';
  }

  private static adjustTone(message: string, preference?: string): string {
    if (preference === 'informal') return this.makeInformal(message);
    if (preference === 'friendly') return this.makeFriendly(message);
    return this.makeFormal(message);
  }

  private static makeInformal(message: string): string {
    return message.replace('Olá', 'Oi');
  }

  private static makeFriendly(message: string): string {
    return message + ' 😊';
  }

  private static makeFormal(message: string): string {
    return message;
  }

  private static getDefaultContext(phoneNumber: string): PersonalizationContext {
    return {
      patientProfile: {
        name: 'Paciente',
        phone: phoneNumber,
        appointmentCount: 0
      },
      behaviorPatterns: {
        averageResponseTime: 60,
        preferredChannels: ['whatsapp'],
        appointmentFrequency: 0,
        cancellationRate: 0,
        noShowRate: 0
      },
      opportunities: {
        crossSell: [],
        upSell: [],
        preventiveCare: [],
        followUp: []
      }
    };
  }
}