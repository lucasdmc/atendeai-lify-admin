
export interface ConversationMemory {
  userPreferences: Record<string, any>;
  medicalHistory: string;
  conversationSummary: string;
  lastTopics: string[];
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
      return memoryData;
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
      conversationContext: {
        currentTopic: '',
        followUpNeeded: false,
        lastInteractionSentiment: 'neutral',
        interactionHistory: [],
        relationshipLevel: 1,
        personalityAdaptation: {
          communicationStyle: 'friendly',
          responseLength: 'medium',
          formalityLevel: 'informal'
        }
      }
    };
  }

  static async updateMemoryField(phoneNumber: string, field: string, value: any, supabase: any): Promise<void> {
    try {
      // Carregar memória atual
      const currentMemory = await this.loadMemory(phoneNumber, supabase);
      
      // Atualizar campo específico
      (currentMemory as any)[field] = value;
      
      // Salvar memória atualizada
      await this.saveMemory(phoneNumber, currentMemory, supabase);
    } catch (error) {
      console.error('❌ Erro ao atualizar campo da memória:', error);
    }
  }

  static formatMemoryForPrompt(memoryData: ConversationMemory): string {
    if (!memoryData || Object.keys(memoryData).length === 0) {
      return 'Nenhuma memória conversacional disponível.';
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

    if (memoryData.conversationContext) {
      const context = memoryData.conversationContext;
      if (context.currentTopic) {
        memoryPrompt += `- Tópico atual: ${context.currentTopic}\n`;
      }
      if (context.personalityAdaptation) {
        memoryPrompt += `- Estilo de comunicação: ${context.personalityAdaptation.communicationStyle}\n`;
      }
    }

    return memoryPrompt;
  }

  static adaptPersonality(memory: ConversationMemory, userMessage: string): void {
    // Adaptar personalidade baseado na mensagem do usuário
    const lowerMessage = userMessage.toLowerCase();
    
    if (!memory.conversationContext) {
      memory.conversationContext = this.createDefaultMemory().conversationContext;
    }

    if (!memory.conversationContext.personalityAdaptation) {
      memory.conversationContext.personalityAdaptation = {
        communicationStyle: 'friendly',
        responseLength: 'medium',
        formalityLevel: 'informal'
      };
    }

    // Adaptar baseado no conteúdo da mensagem
    if (lowerMessage.includes('urgente') || lowerMessage.includes('rápido')) {
      memory.conversationContext.personalityAdaptation.responseLength = 'short';
    } else if (lowerMessage.includes('explique') || lowerMessage.includes('detalhe')) {
      memory.conversationContext.personalityAdaptation.responseLength = 'long';
    }

    // Adaptar formalidade
    if (lowerMessage.includes('doutor') || lowerMessage.includes('senhor')) {
      memory.conversationContext.personalityAdaptation.formalityLevel = 'formal';
    }
  }

  static updateInteractionHistory(
    memory: ConversationMemory, 
    topic: string, 
    sentiment: string, 
    outcome: string
  ): void {
    if (!memory.conversationContext) {
      memory.conversationContext = this.createDefaultMemory().conversationContext;
    }

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
    if (!memory.conversationContext) {
      memory.conversationContext = this.createDefaultMemory().conversationContext;
    }

    // Evoluir o nível de relacionamento baseado nas interações
    if (memory.conversationContext.interactionHistory) {
      const positiveInteractions = memory.conversationContext.interactionHistory.filter(
        interaction => interaction.sentiment === 'positive' || interaction.outcome === 'success'
      ).length;

      const totalInteractions = memory.conversationContext.interactionHistory.length;
      
      if (totalInteractions > 0) {
        const positiveRatio = positiveInteractions / totalInteractions;
        
        if (positiveRatio > 0.7 && memory.conversationContext.relationshipLevel < 5) {
          memory.conversationContext.relationshipLevel += 1;
        } else if (positiveRatio < 0.3 && memory.conversationContext.relationshipLevel > 1) {
          memory.conversationContext.relationshipLevel -= 1;
        }
      }
    }
  }
}
