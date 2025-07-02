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

  /**
   * Métodos auxiliares privados
   */
  
  private static async analyzeBehaviorPatterns(
    phoneNumber: string,
    appointments: any[]
  ): Promise<PersonalizationContext['behaviorPatterns']> {
    // Analisar padrões de resposta
    const { data: messages } = await supabase
      .from('whatsapp_messages')
      .select('timestamp, message_type')
      .eq('conversation_id', `conv_${phoneNumber.replace(/\D/g, '')}`)
      .order('timestamp', { ascending: true });

    let totalResponseTime = 0;
    let responseCount = 0;

    if (messages) {
      for (let i = 1; i < messages.length; i++) {
        if (messages[i].message_type === 'received' && messages[i-1].message_type === 'sent') {
          const timeDiff = new Date(messages[i].timestamp).getTime() - 
                          new Date(messages[i-1].timestamp).getTime();
          totalResponseTime += timeDiff;
          responseCount++;
        }
      }
    }

    // Calcular métricas
    const cancelledAppointments = appointments?.filter(a => a.status === 'cancelled').length || 0;
    const noShowAppointments = appointments?.filter(a => a.status === 'no_show').length || 0;
    const totalAppointments = appointments?.length || 1;

    return {
      averageResponseTime: responseCount > 0 ? totalResponseTime / responseCount : 0,
      preferredChannels: ['whatsapp'], // Pode ser expandido
      appointmentFrequency: this.calculateAppointmentFrequency(appointments),
      cancellationRate: (cancelledAppointments / totalAppointments) * 100,
      noShowRate: (noShowAppointments / totalAppointments) * 100
    };
  }

  private static async identifyOpportunities(
    patientData: any,
    appointments: any[],
    memory: any
  ): Promise<PersonalizationContext['opportunities']> {
    const opportunities = {
      crossSell: [] as string[],
      upSell: [] as string[],
      preventiveCare: [] as string[],
      followUp: [] as string[]
    };

    // Identificar cross-sell baseado em serviços anteriores
    const servicesUsed = appointments?.map(a => a.service_type) || [];
    
    if (servicesUsed.includes('consulta_cardiologia') && !servicesUsed.includes('eletrocardiograma')) {
      opportunities.crossSell.push('eletrocardiograma');
    }

    if (servicesUsed.includes('consulta_clinico_geral') && !servicesUsed.includes('exames_laboratoriais')) {
      opportunities.crossSell.push('checkup_completo');
    }

    // Identificar up-sell
    if (appointments?.length > 3 && !patientData?.has_health_plan) {
      opportunities.upSell.push('plano_saude_clinica');
    }

    // Cuidados preventivos baseados em idade/perfil
    if (patientData?.age > 40 && !servicesUsed.includes('checkup_anual')) {
      opportunities.preventiveCare.push('checkup_anual_40+');
    }

    // Follow-ups necessários
    const lastAppointment = appointments?.[0];
    if (lastAppointment?.requires_followup) {
      opportunities.followUp.push(`followup_${lastAppointment.service_type}`);
    }

    return opportunities;
  }

  private static extractPreferredDoctor(appointments: any[]): string | undefined {
    if (!appointments || appointments.length === 0) return undefined;
    
    // Contar frequência de cada médico
    const doctorFrequency = appointments.reduce((acc, apt) => {
      acc[apt.doctor_name] = (acc[apt.doctor_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Encontrar o mais frequente
    let maxFreq = 0;
    let preferredDoctor = undefined;
    
    for (const [doctor, freq] of Object.entries(doctorFrequency)) {
      if (freq > maxFreq) {
        maxFreq = freq;
        preferredDoctor = doctor;
      }
    }
    
    return maxFreq >= 2 ? preferredDoctor : undefined;
  }

  private static extractPreferredTimes(appointments: any[]): string[] {
    if (!appointments || appointments.length === 0) return [];
    
    const timeSlots = appointments.map(apt => {
      const hour = new Date(apt.start_time).getHours();
      if (hour < 12) return 'manhã';
      if (hour < 18) return 'tarde';
      return 'noite';
    });
    
    // Retornar slots únicos mais comuns
    return [...new Set(timeSlots)];
  }

  private static extractCommonServices(appointments: any[]): string[] {
    if (!appointments || appointments.length === 0) return [];
    
    const services = appointments.map(apt => apt.service_type);
    const serviceFrequency = services.reduce((acc, service) => {
      acc[service] = (acc[service] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Retornar serviços usados mais de uma vez
    return Object.entries(serviceFrequency)
      .filter(([_, freq]) => freq > 1)
      .map(([service, _]) => service);
  }

  private static detectCommunicationStyle(memory: any): 'formal' | 'informal' | 'friendly' {
    const recentMessages = memory.history.slice(-10);
    
    let informalCount = 0;
    let formalCount = 0;
    
    recentMessages.forEach((msg: any) => {
      if (msg.role === 'user') {
        const content = msg.content.toLowerCase();
        
        // Indicadores de informalidade
        if (content.includes('oi') || content.includes('olá') || 
            content.includes('blz') || content.includes('td bem')) {
          informalCount++;
        }
        
        // Indicadores de formalidade
        if (content.includes('senhor') || content.includes('senhora') ||
            content.includes('por favor') || content.includes('gostaria')) {
          formalCount++;
        }
      }
    });
    
    if (informalCount > formalCount * 2) return 'informal';
    if (formalCount > informalCount * 2) return 'formal';
    return 'friendly';
  }

  private static adjustTone(message: string, preference?: string): string {
    if (!preference) return message;
    
    switch (preference) {
      case 'informal':
        return message
          .replace('Gostaria', 'Quer')
          .replace('Por favor', 'Por favor')
          .replace('Senhor(a)', 'Você');
      
      case 'formal':
        return message
          .replace('Você', 'O(A) senhor(a)')
          .replace('Quer', 'Gostaria')
          .replace('Oi', 'Olá');
      
      default:
        return message;
    }
  }

  private static makeInformal(message: string): string {
    return message
      .replace(/Gostaria/g, 'Quer')
      .replace(/O\(A\) senhor\(a\)/g, 'Você')
      .replace(/Por gentileza/g, '')
      .replace(/\. /g, '! '); // Mais entusiasmo
  }

  private static makeFriendly(message: string): string {
    // Adicionar emojis e tom mais caloroso
    return message
      .replace(/Olá/g, 'Oi')
      .replace(/\./g, ' 😊.')
      .replace(/\?/g, '? 🤔');
  }

  private static makeFormal(message: string): string {
    return message
      .replace(/Oi/g, 'Olá')
      .replace(/Você/g, 'O(A) senhor(a)')
      .replace(/Quer/g, 'Gostaria')
      .replace(/!/, '.');
  }

  private static async getRelatedServices(service: string): Promise<string[]> {
    // Mapeamento de serviços relacionados
    const relatedServicesMap: Record<string, string[]> = {
      'consulta_cardiologia': ['eletrocardiograma', 'ecocardiograma', 'teste_esforco'],
      'consulta_ortopedia': ['raio_x', 'fisioterapia', 'ressonancia'],
      'consulta_ginecologia': ['papanicolau', 'ultrassom_pelvico', 'mamografia'],
      'checkup_geral': ['exames_sangue', 'eletrocardiograma', 'ultrassom_abdomen']
    };
    
    return relatedServicesMap[service] || [];
  }

  private static formatOpportunitySuggestion(opportunity: string, context: PersonalizationContext): string {
    const templates: Record<string, string> = {
      'plano_saude_clinica': `${context.patientProfile.name}, como você é um paciente frequente, ` +
                            `temos um plano especial que pode economizar até 30% nas consultas. Gostaria de saber mais?`,
      
      'checkup_anual_40+': `É recomendado fazer check-ups anuais após os 40 anos. ` +
                          `Posso agendar uma avaliação completa com nossos especialistas?`,
      
      'followup_consulta_cardiologia': `Sua última consulta com o cardiologista indicou necessidade de retorno. ` +
                                      `Vamos agendar para garantir que está tudo bem?`
    };
    
    return templates[opportunity] || '';
  }

  private static calculateAppointmentFrequency(appointments: any[]): number {
    if (!appointments || appointments.length < 2) return 0;
    
    const dates = appointments.map(a => new Date(a.date)).sort((a, b) => a.getTime() - b.getTime());
    let totalDays = 0;
    
    for (let i = 1; i < dates.length; i++) {
      totalDays += (dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24);
    }
    
    return appointments.length / (totalDays / 30); // Consultas por mês
  }

  private static getMonthsDifference(date1: Date, date2: Date): number {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12;
    return months + date2.getMonth() - date1.getMonth();
  }

  private static getDefaultContext(phoneNumber: string): PersonalizationContext {
    return {
      patientProfile: {
        name: 'Paciente',
        phone: phoneNumber,
        appointmentCount: 0,
        communicationPreference: 'formal'
      },
      behaviorPatterns: {
        averageResponseTime: 0,
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