
export class ConversationMemoryManager {
  static async saveMemory(phoneNumber: string, memoryData: any, supabase: any): Promise<void> {
    try {
      console.log('💾 Salvando memória conversacional para:', phoneNumber);
      
      // Usar upsert corretamente - sem o .from(...).upsert
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

  static async loadMemory(phoneNumber: string, supabase: any): Promise<any> {
    try {
      console.log('📖 Carregando memória conversacional para:', phoneNumber);
      
      const { data, error } = await supabase
        .from('whatsapp_conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao carregar memória:', error);
        return {};
      }

      const memoryData = data?.memory_data || {};
      console.log('✅ Memória carregada:', Object.keys(memoryData).length, 'entradas');
      return memoryData;
    } catch (error) {
      console.error('❌ Erro crítico ao carregar memória:', error);
      return {};
    }
  }

  static async updateMemoryField(phoneNumber: string, field: string, value: any, supabase: any): Promise<void> {
    try {
      // Carregar memória atual
      const currentMemory = await this.loadMemory(phoneNumber, supabase);
      
      // Atualizar campo específico
      currentMemory[field] = value;
      
      // Salvar memória atualizada
      await this.saveMemory(phoneNumber, currentMemory, supabase);
    } catch (error) {
      console.error('❌ Erro ao atualizar campo da memória:', error);
    }
  }

  static formatMemoryForPrompt(memoryData: any): string {
    if (!memoryData || Object.keys(memoryData).length === 0) {
      return 'Nenhuma memória conversacional disponível.';
    }

    let memoryPrompt = 'MEMÓRIA CONVERSACIONAL:\n';
    
    if (memoryData.userPreferences) {
      memoryPrompt += `- Preferências: ${JSON.stringify(memoryData.userPreferences)}\n`;
    }
    
    if (memoryData.medicalHistory) {
      memoryPrompt += `- Histórico médico: ${memoryData.medicalHistory}\n`;
    }
    
    if (memoryData.conversationSummary) {
      memoryPrompt += `- Resumo das conversas: ${memoryData.conversationSummary}\n`;
    }
    
    if (memoryData.lastTopics) {
      memoryPrompt += `- Últimos assuntos: ${memoryData.lastTopics.join(', ')}\n`;
    }

    return memoryPrompt;
  }
}
