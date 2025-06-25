
import { ConversationState } from './conversation-state-types.ts';
import { ConversationStatePersistence } from './conversation-state-persistence.ts';
import { ConversationInputAnalyzer } from './conversation-input-analyzer.ts';

export class ConversationStateManager {
  private static states = new Map<string, ConversationState>();

  static async getState(phoneNumber: string, supabase?: any): Promise<ConversationState> {
    // Primeiro, tentar carregar do cache em memória
    let existing = this.states.get(phoneNumber);
    
    // Se não existe no cache ou expirou, tentar carregar do banco
    if (!existing || ConversationStatePersistence.isStateExpired(existing)) {
      if (supabase) {
        const dbState = await ConversationStatePersistence.loadStateFromDB(phoneNumber, supabase);
        if (dbState && !ConversationStatePersistence.isStateExpired(dbState)) {
          this.states.set(phoneNumber, dbState);
          console.log(`🔄 Estado restaurado do banco para ${phoneNumber}`);
          return dbState;
        }
      }
    }

    // Se ainda existe no cache e não expirou, usar ele
    if (existing && !ConversationStatePersistence.isStateExpired(existing)) {
      return existing;
    }

    // Criar novo estado
    const newState = ConversationStatePersistence.createNewState(phoneNumber);
    this.states.set(phoneNumber, newState);
    console.log(`🆕 Novo estado criado para ${phoneNumber}`);
    return newState;
  }

  static async updateState(phoneNumber: string, updates: Partial<ConversationState>, supabase?: any): Promise<ConversationState> {
    const current = await this.getState(phoneNumber, supabase);
    const updated = {
      ...current,
      ...updates,
      lastActivity: Date.now(),
      messageCount: current.messageCount + 1
    };
    
    this.states.set(phoneNumber, updated);
    
    // Salvar no banco se disponível
    if (supabase) {
      await ConversationStatePersistence.saveStateToDB(phoneNumber, updated, supabase);
    }
    
    console.log(`🔄 Estado atualizado para ${phoneNumber}:`, JSON.stringify({
      currentState: updated.currentState,
      conversationStarted: updated.conversationStarted,
      messageCount: updated.messageCount,
      selectedService: updated.selectedService,
      selectedTime: updated.selectedTime
    }, null, 2));
    
    return updated;
  }

  static clearState(phoneNumber: string) {
    this.states.delete(phoneNumber);
    console.log(`🗑️ Estado limpo para ${phoneNumber}`);
  }

  // Método estático para análise de entrada
  static analyzeUserInput(message: string): any {
    return ConversationInputAnalyzer.analyzeUserInput(message);
  }
}
