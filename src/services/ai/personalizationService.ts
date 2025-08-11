// src/services/ai/personalizationService.ts

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
          lastAppointment: appointments?.[0] ? {
            date: appointments[0].date,
            doctor: appointments[0].doctor_name,
            service: appointments[0].service_type
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
              // ❌ SEM FALLBACKS HARDCODED - PROPAGAR ERRO
        throw new Error(`Não foi possível carregar contexto de personalização para ${phoneNumber}`);
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

    // Substituir placeholders
    message = message.replace('{name}', context.patientProfile.name);
    message = message.replace('{appointmentCount}', context.patientProfile.appointmentCount.toString());
    
    if (context.patientProfile.lastAppointment) {
      message = message.replace('{lastDoctor}', context.patientProfile.lastAppointment.doctor);
      message = message.replace('{lastService}', context.patientProfile.lastAppointment.service);
    }

    // Adaptar tom baseado na preferência de comunicação
    message = this.adaptLanguageStyle(message, context);

    // Adicionar contexto específico da intenção
    if (intent === 'APPOINTMENT_CREATE' && context.patientProfile.preferredDoctor) {
      message += `\n\n💡 Nota: Você costuma agendar com ${context.patientProfile.preferredDoctor}. Posso verificar a disponibilidade dele primeiro.`;
    }

    return message;
  }

  /**
   * Gera sugestões personalizadas baseadas no contexto
   */
  static async generatePersonalizedSuggestions(
    context: PersonalizationContext,
    currentService?: string
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Sugestões baseadas em histórico
    if (context.patientProfile.lastAppointment) {
      suggestions.push(`Gostaria de agendar novamente com ${context.patientProfile.lastAppointment.doctor}?`);
    }

    // Sugestões de cross-sell
    if (currentService && context.opportunities.crossSell.length > 0) {
      const relatedServices = await this.getRelatedServices(currentService);
      if (relatedServices.length > 0) {
        suggestions.push(`Que tal também agendar ${relatedServices[0]}?`);
      }
    }

    // Sugestões de follow-up
    if (context.opportunities.followUp.length > 0) {
      suggestions.push(context.opportunities.followUp[0]);
    }

    // Sugestões baseadas em frequência
    if (context.behaviorPatterns.appointmentFrequency > 2) {
      suggestions.push('Posso agendar sua próxima consulta de rotina?');
    }

    return suggestions.slice(0, 3); // Limitar a 3 sugestões
  }

  /**
   * Adapta o estilo de linguagem baseado na preferência
   */
  static adaptLanguageStyle(
    message: string,
    context: PersonalizationContext
  ): string {
    const preference = context.patientProfile.communicationPreference;
    
    switch (preference) {
      case 'informal':
        return this.makeInformal(message);
      case 'friendly':
        return this.makeFriendly(message);
      case 'formal':
        return this.makeFormal(message);
      default:
        return message;
    }
  }

  /**
   * Analisa padrões de comportamento do paciente
   */
  private static async analyzeBehaviorPatterns(
    phoneNumber: string,
    appointments: any[]
  ): Promise<PersonalizationContext['behaviorPatterns']> {
    try {
      // Calcular frequência de agendamentos
      const appointmentFrequency = this.calculateAppointmentFrequency(appointments);

      // Calcular taxas de cancelamento e no-show
      const totalAppointments = appointments.length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;
      const noShowAppointments = appointments.filter(a => a.status === 'no_show').length;

      const cancellationRate = totalAppointments > 0 ? cancelledAppointments / totalAppointments : 0;
      const noShowRate = totalAppointments > 0 ? noShowAppointments / totalAppointments : 0;

      // Buscar dados de comunicação
      const { data: communicationData } = await supabase
        .from('whatsapp_conversations')
        .select('created_at, updated_at')
        .eq('phone_number', phoneNumber)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calcular tempo médio de resposta
      let averageResponseTime = 0;
      if (communicationData && communicationData.length > 1) {
        const responseTimes = communicationData.slice(1).map((conv, index) => {
          const current = new Date(conv.created_at);
          const previous = new Date(communicationData[index].created_at);
          return current.getTime() - previous.getTime();
        });
        averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      }

      return {
        averageResponseTime,
        preferredChannels: ['whatsapp'], // Assumindo WhatsApp como principal
        appointmentFrequency,
        cancellationRate,
        noShowRate
      };
    } catch (error) {
      console.error('Error analyzing behavior patterns:', error);
      return {
        averageResponseTime: 0,
        preferredChannels: ['whatsapp'],
        appointmentFrequency: 0,
        cancellationRate: 0,
        noShowRate: 0
      };
    }
  }

  /**
   * Identifica oportunidades de negócio
   */
  private static async identifyOpportunities(
    patientData: any,
    appointments: any[],
    memory: any
  ): Promise<PersonalizationContext['opportunities']> {
    const opportunities: PersonalizationContext['opportunities'] = {
      crossSell: [],
      upSell: [],
      preventiveCare: [],
      followUp: []
    };

    // Oportunidades baseadas no histórico médico
    if (patientData?.medical_conditions) {
      if (patientData.medical_conditions.includes('diabetes')) {
        opportunities.preventiveCare.push('consulta de endocrinologia');
        opportunities.followUp.push('exame de glicemia');
      }
      if (patientData.medical_conditions.includes('hipertensão')) {
        opportunities.preventiveCare.push('monitoramento de pressão');
      }
    }

    // Oportunidades baseadas em idade (se disponível)
    if (patientData?.birth_date) {
      const age = this.calculateAge(patientData.birth_date);
      if (age > 50) {
        opportunities.preventiveCare.push('check-up completo');
      }
    }

    // Oportunidades baseadas em frequência
    if (appointments.length > 0) {
      const lastAppointment = appointments[0];
      const daysSinceLast = this.getDaysDifference(new Date(lastAppointment.date), new Date());
      
      if (daysSinceLast > 365) {
        opportunities.followUp.push('consulta de rotina anual');
      }
    }

    return opportunities;
  }

  /**
   * Extrai médico preferido do histórico
   */
  private static extractPreferredDoctor(appointments: any[]): string | undefined {
    if (!appointments || appointments.length === 0) return undefined;

    const doctorCounts: Record<string, number> = {};
    appointments.forEach(appointment => {
      if (appointment.doctor_name) {
        doctorCounts[appointment.doctor_name] = (doctorCounts[appointment.doctor_name] || 0) + 1;
      }
    });

    const preferredDoctor = Object.entries(doctorCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return preferredDoctor?.[0];
  }

  /**
   * Extrai horários preferidos
   */
  private static extractPreferredTimes(appointments: any[]): string[] {
    if (!appointments || appointments.length === 0) return [];

    const timeCounts: Record<string, number> = {};
    appointments.forEach(appointment => {
      if (appointment.appointment_time) {
        const hour = appointment.appointment_time.split(':')[0];
        timeCounts[hour] = (timeCounts[hour] || 0) + 1;
      }
    });

    return Object.entries(timeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);
  }

  /**
   * Extrai serviços mais comuns
   */
  private static extractCommonServices(appointments: any[]): string[] {
    if (!appointments || appointments.length === 0) return [];

    const serviceCounts: Record<string, number> = {};
    appointments.forEach(appointment => {
      if (appointment.service_type) {
        serviceCounts[appointment.service_type] = (serviceCounts[appointment.service_type] || 0) + 1;
      }
    });

    return Object.entries(serviceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([service]) => service);
  }

  /**
   * Detecta estilo de comunicação baseado na memória
   */
  private static detectCommunicationStyle(memory: any): 'formal' | 'informal' | 'friendly' {
    if (!memory.history || memory.history.length === 0) return 'formal';

    const recentMessages = memory.history
      .filter((h: any) => h.role === 'user')
      .slice(-5)
      .map((h: any) => h.content.toLowerCase());

    const informalWords = ['oi', 'ola', 'beleza', 'valeu', 'tranquilo'];
    const formalWords = ['por favor', 'gostaria', 'poderia', 'obrigado'];

    let informalCount = 0;
    let formalCount = 0;

    recentMessages.forEach(message => {
      informalWords.forEach(word => {
        if (message.includes(word)) informalCount++;
      });
      formalWords.forEach(word => {
        if (message.includes(word)) formalCount++;
      });
    });

    if (informalCount > formalCount) return 'informal';
    if (formalCount > informalCount) return 'formal';
    return 'friendly';
  }

  /**
   * Ajusta tom da mensagem
   */
  private static adjustTone(message: string, preference?: string): string {
    switch (preference) {
      case 'informal':
        return this.makeInformal(message);
      case 'friendly':
        return this.makeFriendly(message);
      case 'formal':
        return this.makeFormal(message);
      default:
        return message;
    }
  }

  /**
   * Torna mensagem informal
   */
  private static makeInformal(message: string): string {
    return message
      .replace(/Por favor/g, 'Pode ser')
      .replace(/Gostaria/g, 'Quer')
      .replace(/Posso ajudá-lo/g, 'Posso te ajudar');
  }

  /**
   * Torna mensagem amigável
   */
  private static makeFriendly(message: string): string {
    return message
      .replace(/\./g, ' 😊')
      .replace(/!/g, ' 😄');
  }

  /**
   * Torna mensagem formal
   */
  private static makeFormal(message: string): string {
    return message
      .replace(/Pode ser/g, 'Por favor')
      .replace(/Quer/g, 'Gostaria')
      .replace(/Posso te ajudar/g, 'Posso ajudá-lo');
  }

  /**
   * Busca serviços relacionados
   */
  private static async getRelatedServices(service: string): Promise<string[]> {
    try {
      const { data } = await supabase
        .from('contextualization_data')
        .select('content')
        .eq('category', 'servicos')
        .ilike('content', `%${service}%`);

      return data?.map(item => item.content) || [];
    } catch (error) {
      console.error('Error getting related services:', error);
      return [];
    }
  }

  /**
   * Formata sugestão de oportunidade
   */
  private static formatOpportunitySuggestion(opportunity: string, context: PersonalizationContext): string {
    return `💡 ${opportunity}`;
  }

  /**
   * Calcula frequência de agendamentos
   */
  private static calculateAppointmentFrequency(appointments: any[]): number {
    if (appointments.length < 2) return 0;

    const sortedAppointments = appointments
      .map(a => new Date(a.date))
      .sort((a, b) => a.getTime() - b.getTime());

    const totalMonths = this.getMonthsDifference(
      sortedAppointments[0],
      sortedAppointments[sortedAppointments.length - 1]
    );

    return totalMonths > 0 ? appointments.length / totalMonths : 0;
  }

  /**
   * Calcula diferença em meses entre duas datas
   */
  private static getMonthsDifference(date1: Date, date2: Date): number {
    return (date2.getFullYear() - date1.getFullYear()) * 12 + 
           (date2.getMonth() - date1.getMonth());
  }

  /**
   * Calcula diferença em dias entre duas datas
   */
  private static getDaysDifference(date1: Date, date2: Date): number {
    return Math.floor((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Calcula idade baseada na data de nascimento
   */
  private static calculateAge(birthDate: string): number {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // ❌ MÉTODO REMOVIDO: getDefaultContext era fallback hardcoded (NUNCA PEDIDO)
}