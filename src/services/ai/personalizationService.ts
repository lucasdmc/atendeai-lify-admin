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
        .order('date', { ascending: false })
        .limit(10);

      // Buscar perfil completo do paciente
      const { data: patientData } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phoneNumber)
        .single();

      // Analisar padrões de comportamento
      const behaviorPatterns = await this.analyzeBehaviorPatterns(phoneNumber, appointments);
      
      // Identificar oportunidades
      const opportunities = await this.identifyOpportunities(
        patientData,
        appointments,
        memory
      );

      // Construir contexto de personalização
      return {
        patientProfile: {
          name: patientData?.name || memory.userProfile.name || 'Paciente',
          phone: phoneNumber,
          appointmentCount: appointments?.length || 0,
          lastAppointment: appointments?.[0] && appointments[0].date && appointments[0].doctor_name && appointments[0].service_type ? {
            date: appointments[0].date as string,
            doctor: appointments[0].doctor_name as string,
            service: appointments[0].service_type as string
          } : undefined,
          preferredDoctor: this.extractPreferredDoctor(appointments),
          preferredTimes: this.extractPreferredTimes(appointments),
          commonServices: this.extractCommonServices(appointments),
          communicationPreference: this.detectCommunicationStyle(memory),
          insurancePlan: patientData?.insurance_plan,
          medicalHistory: patientData?.medical_conditions || []
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
      const relatedServices = await this.getRelatedServices(currentService);
      
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
    
    // Up-sell baseado em oportunidades identificadas
    context.opportunities.upSell.forEach(opp => {
      suggestions.push(this.formatOpportunitySuggestion(opp, context));
    });
    
    // Cuidado preventivo baseado em perfil
    if (context.patientProfile.appointmentCount > 0) {
      const lastAppointmentDate = new Date(context.patientProfile.lastAppointment?.date || '');
      const monthsSinceLastAppointment = this.getMonthsDifference(lastAppointmentDate, new Date());
      
      if (monthsSinceLastAppointment > 6) {
        suggestions.push(
          `Percebi que sua última consulta foi há ${monthsSinceLastAppointment} meses. ` +
          `Que tal agendar um check-up de rotina para garantir que está tudo bem?`
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
  private static async analyzeBehaviorPatterns(phoneNumber: string, appointments: any[]): Promise<PersonalizationContext['behaviorPatterns']> {
    return {
      averageResponseTime: 60,
      preferredChannels: ['whatsapp'],
      appointmentFrequency: appointments?.length || 0,
      cancellationRate: 0.1,
      noShowRate: 0.05
    };
  }

  private static async identifyOpportunities(patientData: any, appointments: any[], memory: any): Promise<PersonalizationContext['opportunities']> {
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
    return [];
  }

  private static extractCommonServices(appointments: any[]): string[] {
    return [];
  }

  private static detectCommunicationStyle(memory: any): 'formal' | 'informal' | 'friendly' {
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

  private static async getRelatedServices(service: string): Promise<string[]> {
    return ['Eletrocardiograma', 'Check-up'];
  }

  private static formatOpportunitySuggestion(opportunity: string, context: PersonalizationContext): string {
    return `Aproveite: ${opportunity}`;
  }

  private static getMonthsDifference(date1: Date, date2: Date): number {
    if (!date1 || !date2) return 0;
    return (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth());
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