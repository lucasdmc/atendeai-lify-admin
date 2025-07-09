import { supabase } from '@/integrations/supabase/client';
import { LLMOrchestratorService } from './ai/llmOrchestratorService';
import { ConversationMemoryService } from './ai/conversationMemoryService';

// Interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    tools_used?: string[];
    context_sources?: string[];
    personalization_data?: any;
  };
}

export interface ChatResponse {
  message: ChatMessage;
  context?: {
    relevant_documents?: any[];
    intent_confidence?: number;
    suggested_actions?: string[];
  };
  metadata?: {
    processing_time?: number;
    tokens_used?: number;
    model_used?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  clinicId: string;
  messages: ChatMessage[];
  context: {
    user_profile?: any;
    clinic_info?: any;
    conversation_summary?: string;
    active_intents?: string[];
  };
  metadata: {
    created_at: Date;
    last_activity: Date;
    total_messages: number;
    session_duration?: number;
  };
}

// Configuração do sistema
const SYSTEM_CONFIG = {
  model: 'gpt-4o',
  max_tokens: 2000,
  temperature: 0.7,
  enable_tool_calling: true,
  enable_rag: true,
  enable_personalization: true,
  enable_intent_recognition: true,
  context_window: 10,
  memory_retention_days: 30,
  max_conversation_length: 50,
};

class AIChatService {
  /**
   * Processa uma mensagem usando o sistema de IA refatorado
   */
  static async processMessage(phoneNumber: string, message: string): Promise<string> {
    try {
      // Carregar memória da conversa
      // const _memory = await ConversationMemoryService.loadMemory(phoneNumber);
      
      // Processar mensagem através do orquestrador
      const response = await LLMOrchestratorService.processMessage({
        phoneNumber,
        message
      });

      return response.response;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
  }

  // Removed unused _getClinicInfo function

  /**
   * Busca histórico de conversas do usuário
   */
  static async getConversationHistory(phoneNumber: string): Promise<any[]> {
    try {
      const memory = await ConversationMemoryService.loadMemory(phoneNumber);
      return memory.history || [];
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Busca estatísticas de conversa
   */
  static async getConversationStats(phoneNumber: string): Promise<any> {
    try {
      const memory = await ConversationMemoryService.loadMemory(phoneNumber);
      
      return {
        total_messages: memory.history?.length || 0,
        loop_count: 0,
        frustration_level: 0,
        topics: memory.topics || [],
        last_interaction: memory.userProfile?.lastInteraction
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return {
        total_messages: 0,
        loop_count: 0,
        frustration_level: 0,
        topics: [],
        last_interaction: null
      };
    }
  }
}

// Função para criar usuários usando a Edge Function
export const createUserDirectly = async (userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  clinicId?: string;
}) => {
  try {
    console.log('🔄 Chamando Edge Function create-user-auth...');
    
    const { data, error } = await supabase.functions.invoke('create-user-auth', {
      body: {
        name: userData.name,
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        role: userData.role,
        ...(userData.clinicId ? { clinicId: userData.clinicId } : {})
      }
    });

    if (error) {
      console.error('❌ Erro ao chamar Edge Function:', error);
      throw new Error(`Erro na Edge Function: ${error.message || 'Erro desconhecido'}`);
    }

    if (!data || !data.success) {
      console.error('❌ Edge Function retornou erro:', data);
      throw new Error(data?.error || 'Falha ao criar usuário');
    }

    console.log('✅ Usuário criado com sucesso:', data.user);
    return { success: true, user: data.user };
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    throw error;
  }
};

export default AIChatService;
export { SYSTEM_CONFIG };
