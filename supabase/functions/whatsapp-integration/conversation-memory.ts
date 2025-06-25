
interface ConversationMemory {
  userId: string;
  phoneNumber: string;
  personalityProfile: {
    communicationStyle: 'formal' | 'casual' | 'empathetic' | 'direct';
    preferredTopics: string[];
    medicalHistory: string[];
    lastMood: 'positive' | 'neutral' | 'anxious' | 'urgent' | 'frustrated';
    responsePreference: 'detailed' | 'brief' | 'step-by-step';
  };
  conversationContext: {
    currentTopic: string;
    lastAppointment?: string;
    nextAppointment?: string;
    recentConcerns: string[];
    followUpNeeded: boolean;
    lastInteractionSentiment: string;
  };
  relationshipStage: 'first_contact' | 'getting_familiar' | 'established' | 'trusted';
  interactionHistory: Array<{
    timestamp: number;
    topic: string;
    sentiment: string;
    outcome: string;
    satisfactionLevel?: number;
  }>;
}

export class ConversationMemoryManager {
  private static memories: Map<string, ConversationMemory> = new Map();

  static async loadMemory(phoneNumber: string, supabase: any): Promise<ConversationMemory> {
    // Primeiro, tentar carregar do cache local
    if (this.memories.has(phoneNumber)) {
      return this.memories.get(phoneNumber)!;
    }

    // Carregar do banco de dados
    const { data, error } = await supabase
      .from('whatsapp_conversation_memory')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !data) {
      // Criar nova memória
      const newMemory: ConversationMemory = {
        userId: phoneNumber,
        phoneNumber,
        personalityProfile: {
          communicationStyle: 'empathetic',
          preferredTopics: [],
          medicalHistory: [],
          lastMood: 'neutral',
          responsePreference: 'detailed'
        },
        conversationContext: {
          currentTopic: '',
          recentConcerns: [],
          followUpNeeded: false,
          lastInteractionSentiment: 'neutral'
        },
        relationshipStage: 'first_contact',
        interactionHistory: []
      };

      this.memories.set(phoneNumber, newMemory);
      return newMemory;
    }

    const memory: ConversationMemory = {
      ...data.memory_data,
      userId: phoneNumber,
      phoneNumber
    };

    this.memories.set(phoneNumber, memory);
    return memory;
  }

  static async saveMemory(phoneNumber: string, memory: ConversationMemory, supabase: any) {
    this.memories.set(phoneNumber, memory);

    // Salvar no banco
    const { error } = await supabase
      .from('whatsapp_conversation_memory')
      .upsert({
        phone_number: phoneNumber,
        memory_data: memory,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Erro ao salvar memória:', error);
    }
  }

  static updateInteractionHistory(
    memory: ConversationMemory, 
    topic: string, 
    sentiment: string, 
    outcome: string,
    satisfactionLevel?: number
  ) {
    memory.interactionHistory.push({
      timestamp: Date.now(),
      topic,
      sentiment,
      outcome,
      satisfactionLevel
    });

    // Manter apenas os últimos 20 registros
    if (memory.interactionHistory.length > 20) {
      memory.interactionHistory = memory.interactionHistory.slice(-20);
    }

    // Atualizar contexto baseado na interação
    memory.conversationContext.lastInteractionSentiment = sentiment;
    memory.conversationContext.currentTopic = topic;
  }

  static evolveRelationship(memory: ConversationMemory) {
    const interactionCount = memory.interactionHistory.length;
    const positiveInteractions = memory.interactionHistory.filter(
      h => h.sentiment === 'positive' || h.satisfactionLevel && h.satisfactionLevel >= 4
    ).length;

    const satisfactionRate = interactionCount > 0 ? positiveInteractions / interactionCount : 0;

    if (interactionCount >= 10 && satisfactionRate >= 0.8) {
      memory.relationshipStage = 'trusted';
    } else if (interactionCount >= 5 && satisfactionRate >= 0.6) {
      memory.relationshipStage = 'established';
    } else if (interactionCount >= 2) {
      memory.relationshipStage = 'getting_familiar';
    }
  }

  static adaptPersonality(memory: ConversationMemory, userMessage: string) {
    const lowerMessage = userMessage.toLowerCase();
    
    // Detectar estilo de comunicação preferido
    if (lowerMessage.includes('por favor') || lowerMessage.includes('gostaria') || lowerMessage.includes('poderia')) {
      memory.personalityProfile.communicationStyle = 'formal';
    } else if (lowerMessage.includes('oi') || lowerMessage.includes('tá') || lowerMessage.includes('blz')) {
      memory.personalityProfile.communicationStyle = 'casual';
    } else if (lowerMessage.includes('urgente') || lowerMessage.includes('rápido') || lowerMessage.includes('agora')) {
      memory.personalityProfile.communicationStyle = 'direct';
    }

    // Detectar preferência de resposta
    if (userMessage.length < 10) {
      memory.personalityProfile.responsePreference = 'brief';
    } else if (userMessage.length > 100) {
      memory.personalityProfile.responsePreference = 'detailed';
    }
  }
}
