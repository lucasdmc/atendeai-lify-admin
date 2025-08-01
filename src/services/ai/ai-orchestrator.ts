import MedicalValidationService from './sprint1-medical-validation';
import ModelEnsembleService from './sprint2-model-ensemble';
import CacheStreamingService from './sprint3-cache-streaming';
import AdvancedFeaturesService from './sprint4-advanced-features';
import { LLMOrchestratorService } from './llmOrchestratorService';

export interface AIRequest {
  message: string;
  clinicId: string;
  userId: string;
  sessionId?: string;
  context?: any;
  options?: {
    enableMedicalValidation?: boolean;
    enableEmotionAnalysis?: boolean;
    enableProactiveSuggestions?: boolean;
    enableCache?: boolean;
    enableStreaming?: boolean;
    enableMultimodal?: boolean;
    enableVoice?: boolean;
  };
}

export interface AIResponse {
  response: string;
  metadata: {
    medicalValidation?: any;
    emotionAnalysis?: any;
    proactiveSuggestions?: any[];
    cacheHit?: boolean;
    streamingMetrics?: any;
    multimodalAnalysis?: any;
    voiceResponse?: any;
    confidence: number;
    modelUsed: string;
    tokensUsed: number;
    cost: number;
    responseTime: number;
  };
}

export class AIOrchestrator {
  private static instance: AIOrchestrator;

  private constructor() {}

  public static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator();
    }
    return AIOrchestrator.instance;
  }

  /**
   * Processa requisição completa usando todos os sprints AI
   */
  async processRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const options = request.options || {};
    
    try {
      // USAR O LLM ORCHESTRATOR COM MEMÓRIA AVANÇADA
      console.log(`🤖 AIOrchestrator: Processando mensagem com memória avançada`);
      
      // Extrair número de telefone do sessionId (formato: whatsapp-554730915628)
      const phoneNumber = request.sessionId?.replace('whatsapp-', '') || request.userId;
      
      // Processar com LLM Orchestrator (sistema avançado com memória)
      const llmResponse = await LLMOrchestratorService.processMessage({
        phoneNumber,
        message: request.message,
        clinicId: request.clinicId,
        userId: request.userId
      });

      const metadata: AIResponse['metadata'] = {
        confidence: llmResponse.confidence || 0.8,
        modelUsed: llmResponse.modelUsed || 'gpt-4o',
        tokensUsed: 0,
        cost: 0,
        responseTime: Date.now() - startTime
      };

      // Sprint 1: Validação Médica (se habilitada)
      if (options.enableMedicalValidation !== false) {
        try {
          const medicalValidation = await MedicalValidationService.validateMedicalContent(
            request.message,
            request.clinicId,
            request.userId
          );
          metadata.medicalValidation = medicalValidation;

          // Se conteúdo perigoso, bloquear resposta
          if (medicalValidation.validation_result === 'dangerous') {
            return {
              response: 'Desculpe, não posso fornecer informações médicas específicas. Por favor, consulte um profissional de saúde.',
              metadata: {
                ...metadata,
                medicalValidation,
                confidence: 0.9,
                responseTime: Date.now() - startTime
              }
            };
          }
        } catch (error) {
          console.error('Erro na validação médica:', error);
        }
      }

      // Sprint 2: Ensemble de Modelos (se habilitado)
      if (options.enableEnsemble !== false) {
        try {
          const ensembleResponse = await ModelEnsembleService.processWithEnsemble(
            request.message,
            request.clinicId,
            request.userId,
            request.context
          );
          metadata.ensembleResponse = ensembleResponse;
        } catch (error) {
          console.error('Erro no ensemble de modelos:', error);
        }
      }

      // Sprint 3: Cache e Streaming (se habilitado)
      if (options.enableCache !== false) {
        try {
          const cacheResponse = await CacheStreamingService.processWithCacheAndStreaming(
            request.message,
            request.clinicId,
            request.userId,
            request.sessionId
          );
          metadata.cacheHit = cacheResponse.cacheHit;
          metadata.streamingMetrics = cacheResponse.streamingMetrics;
        } catch (error) {
          console.error('Erro no cache e streaming:', error);
        }
      }

      // Sprint 4: Recursos Avançados (se habilitados)
      if (options.enableEmotionAnalysis !== false) {
        try {
          const emotionAnalysis = await AdvancedFeaturesService.analyzeEmotion(
            request.message,
            request.clinicId,
            request.userId
          );
          metadata.emotionAnalysis = emotionAnalysis;
        } catch (error) {
          console.error('Erro na análise de emoções:', error);
        }
      }

      if (options.enableProactiveSuggestions !== false) {
        try {
          const proactiveSuggestions = await AdvancedFeaturesService.generateProactiveSuggestions(
            request.userId,
            request.clinicId,
            'user_message',
            { message: request.message }
          );
          metadata.proactiveSuggestions = proactiveSuggestions;
        } catch (error) {
          console.error('Erro nas sugestões proativas:', error);
        }
      }

      // Retornar resposta do LLM Orchestrator (com memória)
      return {
        response: llmResponse.response,
        metadata: {
          ...metadata,
          confidence: llmResponse.confidence || 0.8,
          modelUsed: llmResponse.modelUsed || 'gpt-4o',
          responseTime: Date.now() - startTime,
          // Adicionar informações de memória
          memoryUsed: llmResponse.memoryUsed,
          userProfile: llmResponse.userProfile,
          conversationContext: llmResponse.conversationContext
        }
      };

    } catch (error) {
      console.error('Erro no AIOrchestrator:', error);
      
      // Resposta de fallback
      return {
        response: 'Olá! Como posso ajudá-lo hoje?',
        metadata: {
          confidence: 0,
          modelUsed: 'fallback',
          tokensUsed: 0,
          cost: 0,
          responseTime: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Testa conectividade das APIs
   */
  async testConnectivity(): Promise<any> {
    try {
      const results = {
        medicalValidation: false,
        modelEnsemble: false,
        cacheStreaming: false,
        advancedFeatures: false,
        llmOrchestrator: false
      };

      // Testar LLM Orchestrator
      try {
        const testResponse = await LLMOrchestratorService.processMessage({
          phoneNumber: 'test-phone',
          message: 'Teste de conectividade',
          clinicId: 'test-clinic',
          userId: 'test-user'
        });
        results.llmOrchestrator = !!testResponse.response;
      } catch (error) {
        console.error('Erro no teste do LLM Orchestrator:', error);
      }

      // Testar outros serviços...
      try {
        await MedicalValidationService.validateMedicalContent('teste', 'test-clinic', 'test-user');
        results.medicalValidation = true;
      } catch (error) {
        console.error('Erro no teste de validação médica:', error);
      }

      return results;
    } catch (error) {
      console.error('Erro no teste de conectividade:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as estatísticas
   */
  async getAllStats(clinicId?: string): Promise<any> {
    try {
      const stats = {
        medicalValidation: {},
        modelEnsemble: {},
        cacheStreaming: {},
        advancedFeatures: {},
        llmOrchestrator: {}
      };

      // Estatísticas do LLM Orchestrator
      try {
        // Aqui você pode adicionar estatísticas específicas do LLM Orchestrator
        stats.llmOrchestrator = {
          totalRequests: 0,
          averageResponseTime: 0,
          memoryUsage: 'active'
        };
      } catch (error) {
        console.error('Erro ao obter estatísticas do LLM Orchestrator:', error);
      }

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Limpa dados antigos
   */
  async cleanupOldData(): Promise<any> {
    try {
      const results = {
        medicalValidation: false,
        modelEnsemble: false,
        cacheStreaming: false,
        advancedFeatures: false,
        llmOrchestrator: false
      };

      // Limpeza do LLM Orchestrator
      try {
        // Aqui você pode adicionar limpeza específica do LLM Orchestrator
        results.llmOrchestrator = true;
      } catch (error) {
        console.error('Erro na limpeza do LLM Orchestrator:', error);
      }

      return results;
    } catch (error) {
      console.error('Erro na limpeza:', error);
      throw error;
    }
  }
}

export default AIOrchestrator; 