import { createClient } from '@supabase/supabase-js';

interface ProactiveSuggestion {
  id: string;
  type: 'information' | 'action' | 'reminder' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  trigger: string;
  context: string[];
  actionUrl?: string;
  expiresAt?: Date;
}

interface UserContext {
  userId: string;
  clinicId: string;
  currentSession: {
    startTime: Date;
    messages: string[];
    currentPage: string;
  };
  userProfile: {
    age?: number;
    gender?: string;
    medicalHistory: string[];
    preferences: string[];
    lastVisit?: Date;
    upcomingAppointments: any[];
  };
  clinicContext: {
    specialty: string;
    services: string[];
    currentPromotions: string[];
    businessHours: any;
  };
}

interface ProactiveTrigger {
  condition: (context: UserContext) => boolean;
  suggestion: (context: UserContext) => ProactiveSuggestion;
  priority: number;
}

export class ProactiveAIService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private triggers: ProactiveTrigger[] = [
    // Triggers baseados em tempo
    {
      condition: (context) => this.isFirstTimeUser(context),
      suggestion: (context) => ({
        id: `welcome-${Date.now()}`,
        type: 'information',
        title: 'Bem-vindo! 👋',
        description: 'Sou seu assistente virtual. Posso ajudar com agendamentos, informações sobre serviços e muito mais. Como posso ajudar você hoje?',
        priority: 'high',
        trigger: 'first_time_user',
        context: ['welcome', 'introduction']
      }),
      priority: 10
    },
    {
      condition: (context) => this.hasUpcomingAppointment(context),
      suggestion: (context) => {
        const nextAppointment = context.userProfile.upcomingAppointments[0];
        return {
          id: `appointment-reminder-${Date.now()}`,
          type: 'reminder',
          title: 'Lembrete de Consulta 📅',
          description: `Você tem uma consulta agendada para ${nextAppointment.date}. Deseja confirmar ou reagendar?`,
          priority: 'high',
          trigger: 'upcoming_appointment',
          context: ['appointment', 'reminder'],
          actionUrl: '/appointments'
        };
      },
      priority: 9
    },
    {
      condition: (context) => this.isNearBusinessHours(context),
      suggestion: (context) => ({
        id: `business-hours-${Date.now()}`,
        type: 'information',
        title: 'Horário de Funcionamento ⏰',
        description: 'Estamos abertos agora! Posso ajudar você a agendar uma consulta ou tirar dúvidas sobre nossos serviços.',
        priority: 'medium',
        trigger: 'business_hours',
        context: ['business_hours', 'availability']
      }),
      priority: 8
    },
    {
      condition: (context) => this.hasMedicalHistory(context),
      suggestion: (context) => ({
        id: `medical-history-${Date.now()}`,
        type: 'recommendation',
        title: 'Histórico Médico 📋',
        description: 'Vejo que você tem histórico conosco. Posso ajudar com informações sobre tratamentos anteriores ou agendar um retorno.',
        priority: 'medium',
        trigger: 'medical_history',
        context: ['medical_history', 'follow_up']
      }),
      priority: 7
    },
    {
      condition: (context) => this.hasPromotions(context),
      suggestion: (context) => ({
        id: `promotion-${Date.now()}`,
        type: 'recommendation',
        title: 'Promoção Especial! 🎉',
        description: 'Temos ofertas especiais disponíveis. Gostaria de conhecer nossos pacotes promocionais?',
        priority: 'medium',
        trigger: 'promotion',
        context: ['promotion', 'special_offer']
      }),
      priority: 6
    },
    {
      condition: (context) => this.isLongSession(context),
      suggestion: (context) => ({
        id: `session-help-${Date.now()}`,
        type: 'action',
        title: 'Precisa de Ajuda? 🤝',
        description: 'Estou aqui para ajudar! Posso esclarecer dúvidas sobre agendamentos, serviços ou qualquer outra informação.',
        priority: 'low',
        trigger: 'long_session',
        context: ['help', 'support']
      }),
      priority: 5
    },
    {
      condition: (context) => this.hasSpecificMedicalHistory(context),
      suggestion: (context) => {
        const conditions = this.getRelevantConditions(context.userProfile.medicalHistory);
        return {
          id: `specialized-care-${Date.now()}`,
          type: 'recommendation',
          title: 'Cuidado Especializado 🏥',
          description: `Baseado no seu histórico, posso recomendar nossos especialistas em ${conditions.join(', ')}.`,
          priority: 'medium',
          trigger: 'specialized_care',
          context: ['specialized_care', 'medical_history']
        };
      },
      priority: 8
    },
    {
      condition: (context) => this.isReturningAfterLongTime(context),
      suggestion: (context) => ({
        id: `welcome-back-${Date.now()}`,
        type: 'information',
        title: 'Bem-vindo de Volta! 👋',
        description: 'Que bom ter você de volta! Posso ajudar a atualizar suas informações ou agendar uma nova consulta.',
        priority: 'medium',
        trigger: 'returning_user',
        context: ['welcome_back', 'update_info']
      }),
      priority: 7
    }
  ];

  /**
   * Gera sugestões proativas baseadas no contexto
   */
  async generateProactiveSuggestions(
    context: UserContext
  ): Promise<ProactiveSuggestion[]> {
    try {
      const suggestions: ProactiveSuggestion[] = [];
      
      // Verificar triggers ativos
      for (const trigger of this.triggers) {
        if (trigger.condition(context)) {
          const suggestion = trigger.suggestion(context);
          
          // Verificar se já foi mostrada recentemente
          const recentlyShown = await this.checkRecentlyShown(suggestion.id, context.userId);
          if (!recentlyShown) {
            suggestions.push(suggestion);
          }
        }
      }
      
      // Ordenar por prioridade
      suggestions.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
      // Limitar a 3 sugestões por vez
      const limitedSuggestions = suggestions.slice(0, 3);
      
      // Salvar sugestões mostradas
      await this.saveShownSuggestions(limitedSuggestions, context.userId);
      
      return limitedSuggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões proativas:', error);
      return [];
    }
  }

  /**
   * Verifica se é primeiro acesso do usuário
   */
  private isFirstTimeUser(context: UserContext): boolean {
    return context.userProfile.lastVisit === undefined && 
           context.userProfile.upcomingAppointments.length === 0;
  }

  /**
   * Verifica se há consulta agendada
   */
  private hasUpcomingAppointment(context: UserContext): boolean {
    return context.userProfile.upcomingAppointments.length > 0;
  }

  /**
   * Verifica se está próximo do horário de funcionamento
   */
  private isNearBusinessHours(context: UserContext): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Domingo
    
    // Verificar se é dia útil e horário comercial
    return currentDay >= 1 && currentDay <= 5 && // Segunda a Sexta
           currentHour >= 8 && currentHour <= 18; // 8h às 18h
  }

  /**
   * Verifica se tem histórico médico
   */
  private hasMedicalHistory(context: UserContext): boolean {
    return context.userProfile.medicalHistory.length > 0;
  }

  /**
   * Verifica se há promoções ativas
   */
  private hasPromotions(context: UserContext): boolean {
    return context.clinicContext.currentPromotions.length > 0;
  }

  /**
   * Verifica se é uma sessão longa
   */
  private isLongSession(context: UserContext): boolean {
    const sessionDuration = Date.now() - context.currentSession.startTime.getTime();
    const longSessionThreshold = 5 * 60 * 1000; // 5 minutos
    return sessionDuration > longSessionThreshold && context.currentSession.messages.length > 3;
  }

  /**
   * Verifica se tem histórico médico específico
   */
  private hasSpecificMedicalHistory(context: UserContext): boolean {
    const specificConditions = ['cardiology', 'dermatology', 'orthopedics', 'pediatrics'];
    return context.userProfile.medicalHistory.some(condition => 
      specificConditions.some(specific => condition.toLowerCase().includes(specific))
    );
  }

  /**
   * Verifica se é retorno após muito tempo
   */
  private isReturningAfterLongTime(context: UserContext): boolean {
    if (!context.userProfile.lastVisit) return false;
    
    const lastVisit = new Date(context.userProfile.lastVisit);
    const now = new Date();
    const daysSinceLastVisit = (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);
    
    return daysSinceLastVisit > 90; // Mais de 3 meses
  }

  /**
   * Obtém condições relevantes do histórico médico
   */
  private getRelevantConditions(medicalHistory: string[]): string[] {
    const conditionMapping: Record<string, string> = {
      'cardiac': 'cardiologia',
      'heart': 'cardiologia',
      'skin': 'dermatologia',
      'dermatology': 'dermatologia',
      'bone': 'ortopedia',
      'orthopedic': 'ortopedia',
      'child': 'pediatria',
      'pediatric': 'pediatria'
    };
    
    const relevantConditions: string[] = [];
    
    medicalHistory.forEach(condition => {
      const lowerCondition = condition.toLowerCase();
      Object.entries(conditionMapping).forEach(([keyword, specialty]) => {
        if (lowerCondition.includes(keyword) && !relevantConditions.includes(specialty)) {
          relevantConditions.push(specialty);
        }
      });
    });
    
    return relevantConditions;
  }

  /**
   * Verifica se sugestão foi mostrada recentemente
   */
  private async checkRecentlyShown(suggestionId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('ai_proactive_suggestions')
        .select('timestamp')
        .eq('suggestion_id', suggestionId)
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Últimas 24h
        .limit(1);

      if (error || !data) return false;
      
      return data.length > 0;
    } catch (error) {
      console.error('Erro ao verificar sugestão recente:', error);
      return false;
    }
  }

  /**
   * Salva sugestões mostradas
   */
  private async saveShownSuggestions(
    suggestions: ProactiveSuggestion[],
    userId: string
  ): Promise<void> {
    try {
      const records = suggestions.map(suggestion => ({
        suggestion_id: suggestion.id,
        user_id: userId,
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        priority: suggestion.priority,
        trigger: suggestion.trigger,
        context: suggestion.context,
        timestamp: new Date().toISOString()
      }));

      await this.supabase
        .from('ai_proactive_suggestions')
        .insert(records);
    } catch (error) {
      console.error('Erro ao salvar sugestões:', error);
    }
  }

  /**
   * Gera sugestão personalizada baseada em padrões
   */
  async generatePersonalizedSuggestion(
    context: UserContext,
    conversationPattern: string[]
  ): Promise<ProactiveSuggestion | null> {
    try {
      // Analisar padrões de conversa
      const patternAnalysis = this.analyzeConversationPattern(conversationPattern);
      
      // Gerar sugestão baseada no padrão
      if (patternAnalysis.indicatesConfusion) {
        return {
          id: `help-clarification-${Date.now()}`,
          type: 'action',
          title: 'Precisa de Esclarecimento? 🤔',
          description: 'Posso explicar melhor qualquer informação ou ajudar com dúvidas específicas.',
          priority: 'high',
          trigger: 'conversation_pattern',
          context: ['help', 'clarification']
        };
      }
      
      if (patternAnalysis.indicatesUrgency) {
        return {
          id: `urgent-assistance-${Date.now()}`,
          type: 'action',
          title: 'Atendimento Prioritário ⚡',
          description: 'Vejo que você precisa de atendimento rápido. Posso ajudar a agendar uma consulta urgente.',
          priority: 'high',
          trigger: 'urgency_detected',
          context: ['urgent', 'priority']
        };
      }
      
      if (patternAnalysis.indicatesResearch) {
        return {
          id: `information-research-${Date.now()}`,
          type: 'information',
          title: 'Informações Detalhadas 📚',
          description: 'Posso fornecer informações completas sobre nossos serviços, especialidades e procedimentos.',
          priority: 'medium',
          trigger: 'information_seeking',
          context: ['information', 'research']
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao gerar sugestão personalizada:', error);
      return null;
    }
  }

  /**
   * Analisa padrões de conversa
   */
  private analyzeConversationPattern(messages: string[]): {
    indicatesConfusion: boolean;
    indicatesUrgency: boolean;
    indicatesResearch: boolean;
  } {
    const confusionKeywords = ['não entendo', 'confuso', 'dúvida', 'como assim', 'explique'];
    const urgencyKeywords = ['urgente', 'agora', 'imediatamente', 'emergência', 'rápido'];
    const researchKeywords = ['informação', 'detalhes', 'mais sobre', 'explicar', 'como funciona'];
    
    const lowerMessages = messages.map(msg => msg.toLowerCase());
    
    const indicatesConfusion = confusionKeywords.some(keyword =>
      lowerMessages.some(msg => msg.includes(keyword))
    );
    
    const indicatesUrgency = urgencyKeywords.some(keyword =>
      lowerMessages.some(msg => msg.includes(keyword))
    );
    
    const indicatesResearch = researchKeywords.some(keyword =>
      lowerMessages.some(msg => msg.includes(keyword))
    );
    
    return {
      indicatesConfusion,
      indicatesUrgency,
      indicatesResearch
    };
  }

  /**
   * Obtém estatísticas de sugestões proativas
   */
  async getProactiveStats(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSuggestions: number;
    acceptanceRate: number;
    mostEffectiveTriggers: Array<{ trigger: string; acceptanceRate: number }>;
    userEngagement: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_proactive_suggestions')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !data) {
        return {
          totalSuggestions: 0,
          acceptanceRate: 0,
          mostEffectiveTriggers: [],
          userEngagement: 0
        };
      }

      const totalSuggestions = data.length;
      const acceptedSuggestions = data.filter(s => s.accepted).length;
      const acceptanceRate = totalSuggestions > 0 ? acceptedSuggestions / totalSuggestions : 0;

      // Calcular taxa de aceitação por trigger
      const triggerStats: Record<string, { total: number; accepted: number }> = {};
      data.forEach(suggestion => {
        const trigger = suggestion.trigger;
        if (!triggerStats[trigger]) {
          triggerStats[trigger] = { total: 0, accepted: 0 };
        }
        triggerStats[trigger].total++;
        if (suggestion.accepted) {
          triggerStats[trigger].accepted++;
        }
      });

      const mostEffectiveTriggers = Object.entries(triggerStats)
        .map(([trigger, stats]) => ({
          trigger,
          acceptanceRate: stats.total > 0 ? stats.accepted / stats.total : 0
        }))
        .sort((a, b) => b.acceptanceRate - a.acceptanceRate)
        .slice(0, 5);

      // Calcular engajamento do usuário
      const uniqueUsers = new Set(data.map(s => s.user_id)).size;
      const userEngagement = uniqueUsers > 0 ? totalSuggestions / uniqueUsers : 0;

      return {
        totalSuggestions,
        acceptanceRate,
        mostEffectiveTriggers,
        userEngagement
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas proativas:', error);
      return {
        totalSuggestions: 0,
        acceptanceRate: 0,
        mostEffectiveTriggers: [],
        userEngagement: 0
      };
    }
  }

  /**
   * Registra aceitação/rejeição de sugestão
   */
  async recordSuggestionResponse(
    suggestionId: string,
    userId: string,
    accepted: boolean
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_proactive_suggestions')
        .update({ accepted, response_timestamp: new Date().toISOString() })
        .eq('suggestion_id', suggestionId)
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erro ao registrar resposta da sugestão:', error);
    }
  }
} 