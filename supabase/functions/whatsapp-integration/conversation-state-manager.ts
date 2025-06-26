
import { ConversationState } from './conversation-state-types.ts';
import { ConversationStatePersistence } from './conversation-state-persistence.ts';
import { ConversationInputAnalyzer } from './conversation-input-analyzer.ts';
import { AgentContextManager } from './agent-context-manager.ts';

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

    // Criar novo estado com agente específico
    const newState = await this.createNewStateWithAgent(phoneNumber, supabase);
    this.states.set(phoneNumber, newState);
    console.log(`🆕 Novo estado criado para ${phoneNumber} com agente`);
    return newState;
  }

  static async createNewStateWithAgent(phoneNumber: string, supabase?: any): Promise<ConversationState> {
    let agentId = null;
    let clinicId = null;

    if (supabase) {
      try {
        // Buscar agente específico para este número
        const agent = await AgentContextManager.getAgentByPhone(phoneNumber, supabase);
        if (agent) {
          agentId = agent.id;
          const clinic = await AgentContextManager.getClinicByAgent(agent.id, supabase);
          if (clinic) {
            clinicId = clinic.id;
          }
        }
      } catch (error) {
        console.error('❌ Erro ao buscar agente:', error);
      }
    }

    return ConversationStatePersistence.createNewState(phoneNumber, {
      agentId,
      clinicId
    });
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
      selectedTime: updated.selectedTime,
      agentId: updated.agentId,
      clinicId: updated.clinicId
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

  static async getAgentContextForConversation(phoneNumber: string, supabase?: any): Promise<string> {
    if (!supabase) {
      return "Você é um assistente virtual de uma clínica médica. Seja prestativo e profissional.";
    }

    try {
      const state = await this.getState(phoneNumber, supabase);
      
      let agent = null;
      if (state.agentId) {
        const { data: agentData } = await supabase
          .from('agents')
          .select('*')
          .eq('id', state.agentId)
          .single();
        agent = agentData;
      }

      if (!agent) {
        agent = await AgentContextManager.getDefaultAgent(supabase);
      }

      if (!agent) {
        return "Você é um assistente virtual de uma clínica médica. Seja prestativo e profissional.";
      }

      const contexts = await AgentContextManager.getAgentContexts(agent.id, supabase);
      const clinic = await AgentContextManager.getClinicByAgent(agent.id, supabase);

      return AgentContextManager.buildContextPrompt(agent, contexts, clinic);
    } catch (error) {
      console.error('❌ Erro ao construir contexto do agente:', error);
      return "Você é um assistente virtual de uma clínica médica. Seja prestativo e profissional.";
    }
  }
}
