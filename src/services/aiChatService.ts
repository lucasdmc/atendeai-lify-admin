import { supabase } from '@/integrations/supabase/client';
import { LLMOrchestratorService } from './ai/llmOrchestratorService';
import { ConversationMemoryService } from './ai/conversationMemoryService';
import { PersonalizationService } from './ai/personalizationService';
import { ToolCallingService } from './ai/toolCallingService';
import { RAGEngineService } from './ai/ragEngineService';
import { IntentRecognitionService } from './ai/intentRecognitionService';
import { SystemPromptGenerator } from './ai/systemPromptGenerator';

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
      const memory = await ConversationMemoryService.loadMemory(phoneNumber);
      
      // Processar mensagem através do orquestrador
      const response = await LLMOrchestratorService.processMessage({
        phoneNumber,
        message,
        conversationId: `conv_${phoneNumber.replace(/\D/g, '')}`
      });

      return response.response;
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
  }

  /**
   * Busca informações da clínica
   */
  private static async getClinicInfo(): Promise<any> {
    try {
      const { data: contextData } = await supabase
        .from('contextualization_data')
        .select('question, answer')
        .order('order_number');

      // Construir objeto de informações da clínica
      const clinicInfo = {
        informacoes_basicas: {
          nome: 'Clínica Médica',
          especialidade_principal: 'Medicina Geral',
          missao: 'Oferecer atendimento médico de qualidade',
          diferenciais: ['Atendimento personalizado', 'Tecnologia avançada'],
          valores: ['Ética', 'Qualidade', 'Compromisso']
        },
        localizacao: {
          endereco_principal: {
            logradouro: 'Rua Exemplo',
            numero: '123',
            bairro: 'Centro',
            cidade: 'São Paulo',
            estado: 'SP',
            cep: '01234-567'
          }
        },
        contatos: {
          telefone_principal: '(11) 1234-5678',
          whatsapp: '(11) 98765-4321',
          email_principal: 'contato@clinica.com'
        },
        horario_funcionamento: {
          segunda: { inicio: '08:00', fim: '18:00' },
          terca: { inicio: '08:00', fim: '18:00' },
          quarta: { inicio: '08:00', fim: '18:00' },
          quinta: { inicio: '08:00', fim: '18:00' },
          sexta: { inicio: '08:00', fim: '18:00' },
          sabado: { inicio: '08:00', fim: '12:00' },
          domingo: null
        }
      };

      // Adicionar informações do contexto se disponível
      if (contextData && contextData.length > 0) {
        contextData.forEach((item: any) => {
          if (item.answer) {
            // Mapear informações específicas se necessário
            if (item.question.toLowerCase().includes('nome')) {
              clinicInfo.informacoes_basicas.nome = item.answer;
            }
          }
        });
      }

      return clinicInfo;
    } catch (error) {
      console.error('Erro ao buscar informações da clínica:', error);
      return {
        informacoes_basicas: {
          nome: 'Clínica Médica',
          especialidade_principal: 'Medicina Geral',
          missao: 'Oferecer atendimento médico de qualidade',
          diferenciais: ['Atendimento personalizado'],
          valores: ['Ética', 'Qualidade']
        },
        localizacao: { endereco_principal: {} },
        contatos: {},
        horario_funcionamento: {}
      };
    }
  }

  /**
   * Busca histórico de conversas do usuário
   */
  static async getConversationHistory(phoneNumber: string): Promise<any[]> {
    try {
      const memory = await ConversationMemoryService.loadMemory(phoneNumber);
      return ConversationMemoryService.getRecentHistory(memory, 20);
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
        total_messages: memory.history.length,
        loop_count: ConversationMemoryService.getLoopCount(memory),
        frustration_level: ConversationMemoryService.getFrustrationLevel(memory),
        topics: memory.topics,
        last_interaction: memory.userProfile.lastInteraction
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

export default AIChatService;
export { SYSTEM_CONFIG };
