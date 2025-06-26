import { ConversationState } from './conversation-state-types.ts';

export class ConversationStatePersistence {
  // Salvar estado no banco de dados para persistência real
  static async saveStateToDB(phoneNumber: string, state: ConversationState, supabase: any) {
    try {
      const { error } = await supabase
        .from('whatsapp_conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: state,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erro ao salvar estado no banco:', error);
      } else {
        console.log(`💾 Estado salvo no banco para ${phoneNumber}`);
      }
    } catch (error) {
      console.error('❌ Erro crítico ao salvar estado:', error);
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

      if (error) {
        console.log(`📝 Nenhum estado salvo encontrado para ${phoneNumber}`);
        return null;
      }

      const state = data.memory_data as ConversationState;
      console.log(`📖 Estado carregado do banco para ${phoneNumber}`);
      return state;
    } catch (error) {
      console.error('❌ Erro ao carregar estado do banco:', error);
      return null;
    }
  }

  static createNewState(phoneNumber: string, agentData?: { agentId?: string; clinicId?: string }): ConversationState {
    return {
      phoneNumber,
      currentState: 'greeting',
      conversationStarted: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      selectedService: null,
      selectedTime: null,
      selectedDate: null,
      customerName: null,
      customerEmail: null,
      bookingConfirmed: false,
      contextData: {},
      agentId: agentData?.agentId || null,
      clinicId: agentData?.clinicId || null
    };
  }

  static isStateExpired(state: ConversationState): boolean {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos
    return (now - state.lastActivity) > maxAge;
  }
}
