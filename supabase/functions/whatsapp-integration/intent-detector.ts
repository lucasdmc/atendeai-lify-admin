
interface UserIntent {
  primary: string;
  confidence: number;
  entities: Record<string, any>;
  context: string[];
}

export class IntentDetector {
  static detectAdvancedIntent(message: string, conversationHistory: any[] = []): UserIntent {
    console.log('🎯 Detectando intenção avançada:', message);
    
    const lowerMessage = message.toLowerCase().trim();
    const entities: Record<string, any> = {};
    const context: string[] = [];
    
    // Extrair entidades específicas
    this.extractEntities(message, entities);
    
    // Analisar contexto da conversa
    this.analyzeConversationContext(conversationHistory, context);
    
    // Detecção de intenções com scores de confiança
    const intentScores = this.calculateIntentScores(lowerMessage, entities, context);
    
    // Encontrar intenção com maior score
    const primaryIntent = Object.entries(intentScores)
      .sort(([,a], [,b]) => b - a)[0];
    
    const result: UserIntent = {
      primary: primaryIntent[0],
      confidence: primaryIntent[1],
      entities,
      context
    };
    
    console.log('📊 Resultado da detecção:', result);
    return result;
  }
  
  private static extractEntities(message: string, entities: Record<string, any>) {
    // Extrair datas
    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, // DD/MM/YYYY
      /(\d{1,2})\/(\d{1,2})/g, // DD/MM
      /(hoje|amanhã|ontem)/gi,
      /(segunda|terça|quarta|quinta|sexta|sábado|domingo)/gi,
      /(próxim[ao]|nesta?)\s+(segunda|terça|quarta|quinta|sexta|sábado|domingo)/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        entities.dates = entities.dates || [];
        entities.dates.push(...matches);
      }
    });
    
    // Extrair horários
    const timePattern = /(\d{1,2}):?(\d{2})|(\d{1,2}h\d{0,2})|((manhã|tarde|noite))/gi;
    const timeMatches = message.match(timePattern);
    if (timeMatches) {
      entities.times = timeMatches;
    }
    
    // Extrair especialidades médicas
    const specialties = [
      'cardiologia', 'cardiologista', 'cardio',
      'dermatologia', 'dermatologista', 'derma',
      'ginecologia', 'ginecologista', 'gineco',
      'ortopedia', 'ortopedista', 'orto',
      'pediatria', 'pediatra',
      'clínico geral', 'clinico geral', 'geral',
      'neurologia', 'neurologista', 'neuro',
      'oftalmologia', 'oftalmologista', 'olhos'
    ];
    
    const foundSpecialties = specialties.filter(spec => 
      message.toLowerCase().includes(spec)
    );
    
    if (foundSpecialties.length > 0) {
      entities.specialties = foundSpecialties;
    }
    
    // Extrair emails
    const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const emailMatches = message.match(emailPattern);
    if (emailMatches) {
      entities.emails = emailMatches;
    }
    
    // Extrair números (possíveis seleções de menu)
    const numberPattern = /\b([1-9])\b/g;
    const numberMatches = message.match(numberPattern);
    if (numberMatches) {
      entities.numbers = numberMatches.map(Number);
    }
  }
  
  private static analyzeConversationContext(history: any[], context: string[]) {
    const recentMessages = history.slice(-5);
    
    // Verificar se está em um fluxo de agendamento
    const hasAppointmentContext = recentMessages.some(msg => 
      msg.content && (
        msg.content.includes('agendar') ||
        msg.content.includes('consulta') ||
        msg.content.includes('horário') ||
        msg.content.includes('especialidade')
      )
    );
    
    if (hasAppointmentContext) {
      context.push('appointment_flow');
    }
    
    // Verificar se está fornecendo dados pessoais
    const hasPersonalDataContext = recentMessages.some(msg =>
      msg.content && (
        msg.content.includes('nome') ||
        msg.content.includes('email') ||
        msg.content.includes('@')
      )
    );
    
    if (hasPersonalDataContext) {
      context.push('personal_data');
    }
    
    // Verificar confirmações pendentes
    const hasPendingConfirmation = recentMessages.some(msg =>
      msg.content && (
        msg.content.includes('confirme') ||
        msg.content.includes('correto') ||
        msg.content.includes('SIM') ||
        msg.content.includes('NÃO')
      )
    );
    
    if (hasPendingConfirmation) {
      context.push('confirmation_pending');
    }
  }
  
  private static calculateIntentScores(message: string, entities: any, context: string[]): Record<string, number> {
    const scores: Record<string, number> = {
      greeting: 0,
      scheduling: 0,
      cancellation: 0,
      rescheduling: 0,
      information: 0,
      confirmation: 0,
      personal_data: 0,
      menu_selection: 0,
      general: 0
    };
    
    // Palavras-chave para cada intenção com pesos
    const keywords = {
      greeting: {
        words: ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'ola'],
        weight: 0.9
      },
      scheduling: {
        words: ['agendar', 'marcar', 'consulta', 'agendamento', 'horário', 'agenda'],
        weight: 0.8
      },
      cancellation: {
        words: ['cancelar', 'desmarcar', 'cancela', 'desmarca'],
        weight: 0.9
      },
      rescheduling: {
        words: ['reagendar', 'alterar', 'mudar', 'trocar', 'remarcar'],
        weight: 0.9
      },
      information: {
        words: ['informação', 'info', 'quando', 'onde', 'como', 'qual', 'horário'],
        weight: 0.6
      },
      confirmation: {
        words: ['sim', 'não', 'nao', 'ok', 'confirmo', 'correto', 'certo'],
        weight: 0.8
      },
      personal_data: {
        words: ['nome', 'email', 'telefone', 'endereço'],
        weight: 0.7
      },
      menu_selection: {
        words: [],
        weight: 0.8
      }
    };
    
    // Calcular scores baseados em palavras-chave
    Object.entries(keywords).forEach(([intent, config]) => {
      config.words.forEach(word => {
        if (message.includes(word)) {
          scores[intent] += config.weight;
        }
      });
    });
    
    // Bonus por entidades encontradas
    if (entities.dates?.length > 0) {
      scores.scheduling += 0.3;
      scores.rescheduling += 0.2;
    }
    
    if (entities.times?.length > 0) {
      scores.scheduling += 0.3;
      scores.rescheduling += 0.2;
    }
    
    if (entities.specialties?.length > 0) {
      scores.scheduling += 0.4;
    }
    
    if (entities.emails?.length > 0) {
      scores.personal_data += 0.5;
    }
    
    if (entities.numbers?.length > 0) {
      scores.menu_selection += 0.6;
    }
    
    // Bonus por contexto
    context.forEach(ctx => {
      switch (ctx) {
        case 'appointment_flow':
          scores.scheduling += 0.2;
          scores.menu_selection += 0.2;
          break;
        case 'personal_data':
          scores.personal_data += 0.3;
          break;
        case 'confirmation_pending':
          scores.confirmation += 0.4;
          break;
      }
    });
    
    // Score mínimo para intenção geral
    scores.general = 0.1;
    
    return scores;
  }
}
