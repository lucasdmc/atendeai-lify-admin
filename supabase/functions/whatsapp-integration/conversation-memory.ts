
export interface ConversationMemory {
  userPreferences: Record<string, any>;
  medicalHistory: string;
  conversationSummary: string;
  lastTopics: string[];
  personalityProfile: {
    communicationStyle: 'formal' | 'casual' | 'direct' | 'empathetic';
    responsePreference: 'brief' | 'detailed' | 'step-by-step';
  };
  relationshipStage: 'first_contact' | 'getting_familiar' | 'established' | 'trusted';
  conversationContext: {
    currentTopic: string;
    followUpNeeded: boolean;
    lastInteractionSentiment: string;
    interactionHistory: Array<{
      topic: string;
      sentiment: string;
      outcome: string;
      timestamp: number;
    }>;
    relationshipLevel: number;
    personalityAdaptation: {
      communicationStyle: string;
      responseLength: string;
      formalityLevel: string;
    };
  };
}

export class ConversationMemoryManager {
  static async saveMemory(phoneNumber: string, memoryData: ConversationMemory, supabase: any): Promise<void> {
    try {
      console.log('💾 Salvando memória conversacional para:', phoneNumber);
      
      const { error } = await supabase
        .from('whatsapp_conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: memoryData
        }, {
          onConflict: 'phone_number'
        });

      if (error) {
        console.error('❌ Erro ao salvar memória:', error);
        throw error;
      }

      console.log('✅ Memória conversacional salva com sucesso');
    } catch (error) {
      console.error('❌ Erro crítico ao salvar memória:', error);
      // Não relançar o erro para não quebrar o fluxo principal
    }
  }

  static async loadMemory(phoneNumber: string, supabase: any): Promise<ConversationMemory> {
    try {
      console.log('📖 Carregando memória conversacional para:', phoneNumber);
      
      const { data, error } = await supabase
        .from('whatsapp_conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao carregar memória:', error);
        return this.createDefaultMemory();
      }

      const memoryData = data?.memory_data || this.createDefaultMemory();
      console.log('✅ Memória carregada:', Object.keys(memoryData).length, 'entradas');
      return this.ensureMemoryStructure(memoryData);
    } catch (error) {
      console.error('❌ Erro crítico ao carregar memória:', error);
      return this.createDefaultMemory();
    }
  }

  static createDefaultMemory(): ConversationMemory {
    return {
      userPreferences: {},
      medicalHistory: '',
      conversationSummary: '',
      lastTopics: [],
      personalityProfile: {
        communicationStyle: 'empathetic',
        responsePreference: 'detailed'
      },
      relationshipStage: 'first_contact',
      conversationContext: {
        currentTopic: '',
        followUpNeeded: false,
        lastInteractionSentiment: 'neutral',
        interactionHistory: [],
        relationshipLevel: 1,
        personalityAdaptation: {
          communicationStyle: 'empathetic',
          responseLength: 'medium',
          formalityLevel: 'informal'
        }
      }
    };
  }

  static ensureMemoryStructure(memoryData: any): ConversationMemory {
    const defaultMemory = this.createDefaultMemory();
    
    return {
      userPreferences: memoryData.userPreferences || defaultMemory.userPreferences,
      medicalHistory: memoryData.medicalHistory || defaultMemory.medicalHistory,
      conversationSummary: memoryData.conversationSummary || defaultMemory.conversationSummary,
      lastTopics: memoryData.lastTopics || defaultMemory.lastTopics,
      personalityProfile: {
        communicationStyle: memoryData.personalityProfile?.communicationStyle || defaultMemory.personalityProfile.communicationStyle,
        responsePreference: memoryData.personalityProfile?.responsePreference || defaultMemory.personalityProfile.responsePreference
      },
      relationshipStage: memoryData.relationshipStage || defaultMemory.relationshipStage,
      conversationContext: {
        currentTopic: memoryData.conversationContext?.currentTopic || defaultMemory.conversationContext.currentTopic,
        followUpNeeded: memoryData.conversationContext?.followUpNeeded || defaultMemory.conversationContext.followUpNeeded,
        lastInteractionSentiment: memoryData.conversationContext?.lastInteractionSentiment || defaultMemory.conversationContext.lastInteractionSentiment,
        interactionHistory: memoryData.conversationContext?.interactionHistory || defaultMemory.conversationContext.interactionHistory,
        relationshipLevel: memoryData.conversationContext?.relationshipLevel || defaultMemory.conversationContext.relationshipLevel,
        personalityAdaptation: {
          communicationStyle: memoryData.conversationContext?.personalityAdaptation?.communicationStyle || defaultMemory.conversationContext.personalityAdaptation.communicationStyle,
          responseLength: memoryData.conversationContext?.personalityAdaptation?.responseLength || defaultMemory.conversationContext.personalityAdaptation.responseLength,
          formalityLevel: memoryData.conversationContext?.personalityAdaptation?.formalityLevel || defaultMemory.conversationContext.personalityAdaptation.formalityLevel
        }
      }
    };
  }

  static async updateMemoryField(phoneNumber: string, field: string, value: any, supabase: any): Promise<void> {
    try {
      const currentMemory = await this.loadMemory(phoneNumber, supabase);
      (currentMemory as any)[field] = value;
      await this.saveMemory(phoneNumber, currentMemory, supabase);
    } catch (error) {
      console.error('❌ Erro ao atualizar campo da memória:', error);
    }
  }

  static formatMemoryForPrompt(memoryData: ConversationMemory): string {
    if (!memoryData) {
      return 'Primeira conversa com este paciente.';
    }

    let memoryPrompt = 'MEMÓRIA CONVERSACIONAL:\n';
    
    if (memoryData.userPreferences && Object.keys(memoryData.userPreferences).length > 0) {
      memoryPrompt += `- Preferências: ${JSON.stringify(memoryData.userPreferences)}\n`;
    }
    
    if (memoryData.medicalHistory) {
      memoryPrompt += `- Histórico médico: ${memoryData.medicalHistory}\n`;
    }
    
    if (memoryData.conversationSummary) {
      memoryPrompt += `- Resumo das conversas: ${memoryData.conversationSummary}\n`;
    }
    
    if (memoryData.lastTopics && memoryData.lastTopics.length > 0) {
      memoryPrompt += `- Últimos assuntos: ${memoryData.lastTopics.join(', ')}\n`;
    }

    if (memoryData.personalityProfile) {
      memoryPrompt += `- Estilo preferido: ${memoryData.personalityProfile.communicationStyle}\n`;
      memoryPrompt += `- Tipo de resposta: ${memoryData.personalityProfile.responsePreference}\n`;
    }

    if (memoryData.conversationContext?.currentTopic) {
      memoryPrompt += `- Tópico atual: ${memoryData.conversationContext.currentTopic}\n`;
    }

    memoryPrompt += `- Nível do relacionamento: ${memoryData.relationshipStage}\n`;

    return memoryPrompt;
  }

  static adaptPersonality(memory: ConversationMemory, userMessage: string): void {
    const lowerMessage = userMessage.toLowerCase();
    
    // Adaptar baseado no conteúdo da mensagem
    if (lowerMessage.includes('urgente') || lowerMessage.includes('rápido')) {
      memory.conversationContext.personalityAdaptation.responseLength = 'short';
      memory.personalityProfile.responsePreference = 'brief';
    } else if (lowerMessage.includes('explique') || lowerMessage.includes('detalhe')) {
      memory.conversationContext.personalityAdaptation.responseLength = 'long';
      memory.personalityProfile.responsePreference = 'detailed';
    }

    // Adaptar formalidade
    if (lowerMessage.includes('doutor') || lowerMessage.includes('senhor')) {
      memory.conversationContext.personalityAdaptation.formalityLevel = 'formal';
      memory.personalityProfile.communicationStyle = 'formal';
    } else if (lowerMessage.includes('oi') || lowerMessage.includes('ola')) {
      memory.conversationContext.personalityAdaptation.formalityLevel = 'informal';
      memory.personalityProfile.communicationStyle = 'casual';
    }

    // Adaptar estilo emocional
    if (lowerMessage.includes('preocupado') || lowerMessage.includes('ansioso')) {
      memory.personalityProfile.communicationStyle = 'empathetic';
    }
  }

  static updateInteractionHistory(
    memory: ConversationMemory, 
    topic: string, 
    sentiment: string, 
    outcome: string
  ): void {
    if (!memory.conversationContext.interactionHistory) {
      memory.conversationContext.interactionHistory = [];
    }

    memory.conversationContext.interactionHistory.push({
      topic,
      sentiment,
      outcome,
      timestamp: Date.now()
    });

    // Manter apenas as últimas 10 interações
    if (memory.conversationContext.interactionHistory.length > 10) {
      memory.conversationContext.interactionHistory = memory.conversationContext.interactionHistory.slice(-10);
    }
  }

  static evolveRelationship(memory: ConversationMemory): void {
    if (memory.conversationContext.interactionHistory && memory.conversationContext.interactionHistory.length > 0) {
      const positiveInteractions = memory.conversationContext.interactionHistory.filter(
        interaction => interaction.sentiment === 'positive' || interaction.outcome === 'success'
      ).length;

      const totalInteractions = memory.conversationContext.interactionHistory.length;
      const positiveRatio = positiveInteractions / totalInteractions;
      
      // Evoluir estágio do relacionamento
      if (totalInteractions >= 5 && positiveRatio > 0.7) {
        if (memory.relationshipStage === 'first_contact') {
          memory.relationshipStage = 'getting_familiar';
        } else if (memory.relationshipStage === 'getting_familiar') {
          memory.relationshipStage = 'established';
        } else if (memory.relationshipStage === 'established') {
          memory.relationshipStage = 'trusted';
        }
      }

      // Ajustar nível de relacionamento
      if (positiveRatio > 0.7 && memory.conversationContext.relationshipLevel < 5) {
        memory.conversationContext.relationshipLevel += 1;
      } else if (positiveRatio < 0.3 && memory.conversationContext.relationshipLevel > 1) {
        memory.conversationContext.relationshipLevel -= 1;
      }
    }
  }
}
