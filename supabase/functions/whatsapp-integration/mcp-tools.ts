
// Model Context Protocol (MCP) Tools para WhatsApp Integration
// Ferramentas especializadas para aprimorar a conversa

interface MCPTool {
  name: string;
  description: string;
  execute: (params: any, supabase: any) => Promise<any>;
}

interface AppointmentSlot {
  date: string;
  time: string;
  available: boolean;
  duration: number;
}

interface MedicalReference {
  term: string;
  definition: string;
  context: string;
}

export class MCPToolsManager {
  private static tools: Map<string, MCPTool> = new Map();

  static registerTool(tool: MCPTool) {
    this.tools.set(tool.name, tool);
  }

  static async executeTool(toolName: string, params: any, supabase: any): Promise<any> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }
    return await tool.execute(params, supabase);
  }

  static getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

// Ferramenta de Agendamento Inteligente
const smartSchedulingTool: MCPTool = {
  name: 'smart_scheduling',
  description: 'Acesso inteligente ao sistema de agendamentos com sugestões contextuais',
  execute: async (params: { specialty?: string, urgency?: string, preferredTime?: string }, supabase: any) => {
    const { specialty, urgency, preferredTime } = params;
    
    // Buscar disponibilidade real
    const { data: availability } = await supabase
      .from('clinic_availability')
      .select('*')
      .eq('is_active', true);

    // Buscar agendamentos existentes
    const { data: appointments } = await supabase
      .from('calendar_events')
      .select('start_time, end_time')
      .gte('start_time', new Date().toISOString());

    // Gerar sugestões inteligentes baseadas em contexto
    const suggestions = generateSmartSuggestions(availability, appointments, { specialty, urgency, preferredTime });
    
    return {
      availableSlots: suggestions,
      urgencyHandled: urgency === 'high',
      specialtyAvailable: specialty ? checkSpecialtyAvailability(specialty) : true,
      nextAvailableSlot: suggestions[0] || null
    };
  }
};

// Ferramenta de Base de Conhecimento Médico
const medicalKnowledgeTool: MCPTool = {
  name: 'medical_knowledge',
  description: 'Acesso à base de conhecimento médico para informações precisas',
  execute: async (params: { query: string, context?: string }, supabase: any) => {
    const { query, context } = params;
    
    // Buscar conhecimento específico da clínica
    const { data: clinicKnowledge } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .ilike('question', `%${query}%`);

    // Base de conhecimento médico geral
    const medicalTerms = getMedicalTerminology(query);
    
    return {
      clinicSpecificInfo: clinicKnowledge || [],
      medicalTerminology: medicalTerms,
      recommendations: generateMedicalRecommendations(query, context),
      requiresProfessionalConsultation: assessProfessionalConsultationNeed(query)
    };
  }
};

// Ferramenta de Follow-up Proativo
const proactiveFollowUpTool: MCPTool = {
  name: 'proactive_followup',
  description: 'Sistema de follow-up proativo baseado no histórico do paciente',
  execute: async (params: { phoneNumber: string, actionType: 'reminder' | 'checkup' | 'result_followup' }, supabase: any) => {
    const { phoneNumber, actionType } = params;
    
    // Buscar histórico de agendamentos
    const { data: pastAppointments } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('attendees', `[{"phone": "${phoneNumber}"}]`)
      .order('start_time', { ascending: false })
      .limit(5);

    // Buscar próximos agendamentos
    const { data: upcomingAppointments } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('attendees', `[{"phone": "${phoneNumber}"}]`)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(3);

    const followUpData = generateFollowUpContent(actionType, pastAppointments, upcomingAppointments);
    
    return {
      shouldFollowUp: followUpData.needed,
      followUpMessage: followUpData.message,
      followUpType: actionType,
      nextReminderTime: followUpData.nextReminder,
      personalizedContent: followUpData.personalized
    };
  }
};

// Ferramenta de Análise de Satisfação
const satisfactionAnalysisTool: MCPTool = {
  name: 'satisfaction_analysis',
  description: 'Análise de satisfação do paciente e sugestões de melhoria',
  execute: async (params: { conversationHistory: any[], sentiment: string }, supabase: any) => {
    const { conversationHistory, sentiment } = params;
    
    // Analisar padrões de satisfação
    const satisfactionMetrics = analyzeSatisfactionPatterns(conversationHistory);
    
    // Gerar insights
    const insights = generateSatisfactionInsights(satisfactionMetrics, sentiment);
    
    return {
      satisfactionLevel: satisfactionMetrics.overallSatisfaction,
      improvementAreas: insights.improvements,
      positiveAspects: insights.positives,
      actionableRecommendations: insights.actions,
      shouldEscalate: satisfactionMetrics.overallSatisfaction < 3
    };
  }
};

// Ferramenta de Contexto Temporal Inteligente
const temporalContextTool: MCPTool = {
  name: 'temporal_context',
  description: 'Análise de contexto temporal para respostas apropriadas',
  execute: async (params: { currentTime?: string, userMessage: string }, supabase: any) => {
    const now = new Date(params.currentTime || Date.now());
    const userMessage = params.userMessage;
    
    const temporalContext = {
      isBusinessHours: isBusinessHours(now),
      timeOfDay: getTimeOfDay(now),
      isWeekend: isWeekend(now),
      isHoliday: await checkHoliday(now, supabase),
      urgencyBasedOnTime: assessTimeBasedUrgency(userMessage, now),
      appropriateResponse: generateTimeAppropriateResponse(now, userMessage)
    };
    
    return temporalContext;
  }
};

// Registrar todas as ferramentas
MCPToolsManager.registerTool(smartSchedulingTool);
MCPToolsManager.registerTool(medicalKnowledgeTool);
MCPToolsManager.registerTool(proactiveFollowUpTool);
MCPToolsManager.registerTool(satisfactionAnalysisTool);
MCPToolsManager.registerTool(temporalContextTool);

// Funções auxiliares
function generateSmartSuggestions(availability: any[], appointments: any[], context: any): AppointmentSlot[] {
  const suggestions: AppointmentSlot[] = [];
  const now = new Date();
  
  // Implementar lógica de sugestões inteligentes
  for (let i = 0; i < 7; i++) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() + i);
    
    if (context.urgency === 'high' && i > 2) break; // Urgente: apenas próximos 2 dias
    
    // Verificar slots disponíveis para o dia
    const daySlots = findAvailableSlots(checkDate, availability, appointments);
    suggestions.push(...daySlots.slice(0, 3)); // Máximo 3 por dia
  }
  
  return suggestions.slice(0, 5); // Retornar top 5 sugestões
}

function findAvailableSlots(date: Date, availability: any[], appointments: any[]): AppointmentSlot[] {
  // Implementar lógica de busca de slots
  return [];
}

function checkSpecialtyAvailability(specialty: string): boolean {
  // Verificar se a especialidade está disponível
  const availableSpecialties = ['clínica geral', 'cardiologia', 'pediatria', 'ginecologia'];
  return availableSpecialties.some(s => specialty.toLowerCase().includes(s));
}

function getMedicalTerminology(query: string): MedicalReference[] {
  // Base de dados de terminologia médica simplificada
  const medicalDict: { [key: string]: MedicalReference } = {
    'hipertensão': {
      term: 'Hipertensão Arterial',
      definition: 'Pressão arterial elevada acima dos valores normais (140/90 mmHg)',
      context: 'Condição comum que requer acompanhamento médico regular'
    },
    'diabetes': {
      term: 'Diabetes Mellitus',
      definition: 'Doença caracterizada por níveis elevados de glicose no sangue',
      context: 'Requer monitoramento constante e mudanças no estilo de vida'
    }
  };
  
  const results: MedicalReference[] = [];
  Object.keys(medicalDict).forEach(key => {
    if (query.toLowerCase().includes(key)) {
      results.push(medicalDict[key]);
    }
  });
  
  return results;
}

function generateMedicalRecommendations(query: string, context?: string): string[] {
  const recommendations = [
    'Consulte sempre um médico para avaliação personalizada',
    'Mantenha exames de rotina em dia',
    'Siga as orientações médicas prescritas'
  ];
  
  if (query.toLowerCase().includes('dor')) {
    recommendations.push('Em caso de dor persistente, procure atendimento médico');
  }
  
  return recommendations;
}

function assessProfessionalConsultationNeed(query: string): boolean {
  const urgentTerms = ['dor intensa', 'sangramento', 'falta de ar', 'chest pain'];
  return urgentTerms.some(term => query.toLowerCase().includes(term));
}

function generateFollowUpContent(actionType: string, pastAppointments: any[], upcomingAppointments: any[]) {
  return {
    needed: true,
    message: 'Mensagem de follow-up personalizada',
    nextReminder: new Date(Date.now() + 24 * 60 * 60 * 1000),
    personalized: true
  };
}

function analyzeSatisfactionPatterns(conversationHistory: any[]) {
  return {
    overallSatisfaction: 4.2,
    responseTime: 'good',
    resolutionRate: 0.85
  };
}

function generateSatisfactionInsights(metrics: any, sentiment: string) {
  return {
    improvements: ['Reduzir tempo de resposta'],
    positives: ['Atendimento empático'],
    actions: ['Implementar follow-up automático']
  };
}

function isBusinessHours(date: Date): boolean {
  const hour = date.getHours();
  const day = date.getDay();
  return day >= 1 && day <= 5 && hour >= 8 && hour < 18;
}

function getTimeOfDay(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  if (hour < 22) return 'evening';
  return 'night';
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

async function checkHoliday(date: Date, supabase: any): Promise<boolean> {
  // Implementar verificação de feriados
  return false;
}

function assessTimeBasedUrgency(message: string, time: Date): 'low' | 'medium' | 'high' {
  const hour = time.getHours();
  const isNight = hour < 7 || hour > 22;
  const hasUrgentWords = message.toLowerCase().includes('urgente') || message.toLowerCase().includes('emergência');
  
  if (isNight && hasUrgentWords) return 'high';
  if (hasUrgentWords) return 'medium';
  return 'low';
}

function generateTimeAppropriateResponse(time: Date, message: string): string {
  const hour = time.getHours();
  
  if (hour < 7) {
    return 'Boa madrugada! Percebo que você está acordado. Em que posso ajudar?';
  } else if (hour < 12) {
    return 'Bom dia! Como posso ajudá-lo hoje?';
  } else if (hour < 18) {
    return 'Boa tarde! Em que posso ser útil?';
  } else if (hour < 22) {
    return 'Boa noite! Como posso ajudar?';
  } else {
    return 'Boa noite! Vejo que você precisa de ajuda. O que posso fazer por você?';
  }
}

export { MCPTool };
