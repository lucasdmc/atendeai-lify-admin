
import { ConversationState } from './conversation-state-types.ts';

export class ConversationStatePersistence {
  // Salvar estado no banco de dados para persistência real
  static async saveStateToDB(phoneNumber: string, state: ConversationState, supabase: any) {
    try {
      await supabase
        .from('whatsapp_conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: state
        });
      console.log(`💾 Estado salvo no banco para ${phoneNumber}`);
    } catch (error) {
      console.error('❌ Erro ao salvar estado no banco:', error);
    }
  }

  // Carregar estado do banco de dados
  static async loadStateFromDB(phoneNumber: string, supabase: any): Promise<ConversationState | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversation_memory')
        .select('memory_data')
        .eq('phone_number', phoneNumber)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Erro ao carregar estado do banco:', error);
        return null;
      }

      if (data?.memory_data) {
        console.log(`📂 Estado carregado do banco para ${phoneNumber}`);
        return data.memory_data as ConversationState;
      }
    } catch (error) {
      console.error('❌ Erro ao carregar estado:', error);
    }
    return null;
  }

  static createNewState(phoneNumber: string): ConversationState {
    return {
      phoneNumber,
      currentState: 'initial',
      lastActivity: Date.now(),
      attempts: 0,
      conversationStarted: false,
      messageCount: 0
    };
  }

  static isStateExpired(state: ConversationState): boolean {
    return Date.now() - state.lastActivity > 30 * 60 * 1000; // 30 minutes
  }
}
