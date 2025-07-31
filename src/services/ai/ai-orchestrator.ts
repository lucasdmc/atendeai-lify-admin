import MedicalValidationService from './sprint1-medical-validation';
import ModelEnsembleService from './sprint2-model-ensemble';
import CacheStreamingService from './sprint3-cache-streaming';
import AdvancedFeaturesService from './sprint4-advanced-features';

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
      const metadata: AIResponse['metadata'] = {
        confidence: 0.8,
        modelUsed: 'gpt-4o',
        tokensUsed: 0,
        cost: 0,
        responseTime: 0
      };

      // Sprint 1: Validação Médica
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

      // Sprint 2: Ensemble de Modelos
      let ensembleResponse;
      try {
        ensembleResponse = await ModelEnsembleService.processWithEnsemble(
          request.message,
          request.clinicId,
          request.userId,
          request.context
        );
        metadata.modelUsed = ensembleResponse.selected_model;
        metadata.tokensUsed = ensembleResponse.tokens_used;
        metadata.cost = ensembleResponse.cost;
      } catch (error) {
        console.error('Erro no ensemble de modelos:', error);
        // Fallback para resposta simples
        ensembleResponse = {
          final_response: 'Desculpe, ocorreu um erro no processamento. Tente novamente.'
        };
      }

      // Sprint 3: Cache e Streaming
      let cacheResponse;
      if (options.enableCache !== false) {
        try {
          cacheResponse = await CacheStreamingService.processWithCacheAndStreaming(
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

      // Sprint 4: Análise de Emoções
      if (options.enableEmotionAnalysis !== false) {
        try {
          const emotionAnalysis = await AdvancedFeaturesService.analyzeEmotion(
            request.message,
            request.clinicId,
            request.userId
          );
          metadata.emotionAnalysis = emotionAnalysis;

          // Gerar sugestões proativas baseadas na emoção
          if (options.enableProactiveSuggestions !== false) {
            const trigger = emotionAnalysis.primary_emotion !== 'neutral' ? 'emotional_content' : 'medical_question';
            const proactiveSuggestions = await AdvancedFeaturesService.generateProactiveSuggestions(
              request.userId,
              request.clinicId,
              trigger,
              [emotionAnalysis.primary_emotion]
            );
            metadata.proactiveSuggestions = proactiveSuggestions;
          }
        } catch (error) {
          console.error('Erro na análise de emoções:', error);
        }
      }

      // Sprint 4: Análise Multimodal (se aplicável)
      if (options.enableMultimodal && request.context?.multimodalContent) {
        try {
          const multimodalAnalysis = await AdvancedFeaturesService.analyzeMultimodal(
            request.context.multimodalType || 'document',
            request.context.multimodalContent,
            request.clinicId,
            request.userId,
            request.context.purpose
          );
          metadata.multimodalAnalysis = multimodalAnalysis;
        } catch (error) {
          console.error('Erro na análise multimodal:', error);
        }
      }

      // Sprint 4: Processamento de Voz (se aplicável)
      if (options.enableVoice && request.context?.voiceInput) {
        try {
          const voiceInput = await AdvancedFeaturesService.processVoiceInput(
            request.context.voiceInput,
            request.userId,
            request.clinicId,
            request.sessionId
          );

          const voiceResponse = await AdvancedFeaturesService.generateVoiceResponse(
            ensembleResponse.final_response || cacheResponse?.response || 'Resposta padrão'
          );
          metadata.voiceResponse = { input: voiceInput, response: voiceResponse };
        } catch (error) {
          console.error('Erro no processamento de voz:', error);
        }
      }

      // Registrar interação completa
      try {
        await CacheStreamingService.recordInteraction(
          request.message,
          ensembleResponse.final_response || cacheResponse?.response || 'Resposta padrão',
          request.clinicId,
          request.userId,
          request.sessionId,
          undefined,
          metadata.modelUsed,
          metadata.tokensUsed,
          metadata.cost,
          Date.now() - startTime,
          metadata.cacheHit || false,
          false,
          false
        );
      } catch (error) {
        console.error('Erro ao registrar interação:', error);
      }

      // Log de conformidade LGPD
      try {
        await MedicalValidationService.logLGPDCompliance(
          'ai_interaction',
          'text_message',
          request.userId,
          request.clinicId,
          true,
          request.message
        );
      } catch (error) {
        console.error('Erro no log LGPD:', error);
      }

      metadata.responseTime = Date.now() - startTime;

      return {
        response: ensembleResponse.final_response || cacheResponse?.response || 'Resposta padrão',
        metadata
      };

    } catch (error) {
      console.error('Erro no orquestrador AI:', error);
      
      // Resposta de erro
      return {
        response: 'Desculpe, ocorreu um erro no processamento. Tente novamente.',
        metadata: {
          confidence: 0.1,
          modelUsed: 'error',
          tokensUsed: 0,
          cost: 0,
          responseTime: Date.now() - startTime
        }
      };
    }
  }

  /**
   * Obtém estatísticas completas de todos os sprints
   */
  async getAllStats(clinicId?: string): Promise<any> {
    try {
      const [
        medicalStats,
        ensembleStats,
        cacheStats,
        streamingStats,
        analyticsStats,
        emotionStats,
        proactiveStats,
        multimodalStats,
        voiceStats
      ] = await Promise.all([
        MedicalValidationService.getValidationStats(clinicId),
        ModelEnsembleService.getEnsembleStats(clinicId),
        CacheStreamingService.getCacheStats(clinicId),
        CacheStreamingService.getStreamingStats(clinicId),
        CacheStreamingService.getAnalyticsStats(clinicId),
        AdvancedFeaturesService.getEmotionStats(clinicId),
        AdvancedFeaturesService.getProactiveStats(clinicId),
        AdvancedFeaturesService.getMultimodalStats(clinicId),
        AdvancedFeaturesService.getVoiceStats(clinicId)
      ]);

      return {
        sprint1: {
          medicalValidation: medicalStats
        },
        sprint2: {
          ensemble: ensembleStats
        },
        sprint3: {
          cache: cacheStats,
          streaming: streamingStats,
          analytics: analyticsStats
        },
        sprint4: {
          emotions: emotionStats,
          proactive: proactiveStats,
          multimodal: multimodalStats,
          voice: voiceStats
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error('Falha ao obter estatísticas');
    }
  }

  /**
   * Limpa dados antigos de todos os sprints
   */
  async cleanupOldData(): Promise<any> {
    try {
      const cacheCleanup = await CacheStreamingService.cleanupOldCache();
      
      return {
        cacheEntriesRemoved: cacheCleanup,
        message: 'Limpeza de dados antigos concluída'
      };
    } catch (error) {
      console.error('Erro na limpeza de dados:', error);
      throw new Error('Falha na limpeza de dados');
    }
  }

  /**
   * Testa conectividade de todos os serviços
   */
  async testConnectivity(): Promise<any> {
    try {
      const tests = {
        medicalValidation: false,
        ensemble: false,
        cache: false,
        streaming: false,
        analytics: false,
        emotions: false,
        proactive: false,
        multimodal: false,
        voice: false
      };

      // Testar cada serviço
      try {
        await MedicalValidationService.getValidationStats();
        tests.medicalValidation = true;
      } catch (error) {
        console.error('Erro no teste de validação médica:', error);
      }

      try {
        await ModelEnsembleService.getEnsembleStats();
        tests.ensemble = true;
      } catch (error) {
        console.error('Erro no teste de ensemble:', error);
      }

      try {
        await CacheStreamingService.getCacheStats();
        tests.cache = true;
      } catch (error) {
        console.error('Erro no teste de cache:', error);
      }

      try {
        await CacheStreamingService.getStreamingStats();
        tests.streaming = true;
      } catch (error) {
        console.error('Erro no teste de streaming:', error);
      }

      try {
        await CacheStreamingService.getAnalyticsStats();
        tests.analytics = true;
      } catch (error) {
        console.error('Erro no teste de analytics:', error);
      }

      try {
        await AdvancedFeaturesService.getEmotionStats();
        tests.emotions = true;
      } catch (error) {
        console.error('Erro no teste de emoções:', error);
      }

      try {
        await AdvancedFeaturesService.getProactiveStats();
        tests.proactive = true;
      } catch (error) {
        console.error('Erro no teste de sugestões proativas:', error);
      }

      try {
        await AdvancedFeaturesService.getMultimodalStats();
        tests.multimodal = true;
      } catch (error) {
        console.error('Erro no teste multimodal:', error);
      }

      try {
        await AdvancedFeaturesService.getVoiceStats();
        tests.voice = true;
      } catch (error) {
        console.error('Erro no teste de voz:', error);
      }

      const workingServices = Object.values(tests).filter(Boolean).length;
      const totalServices = Object.keys(tests).length;

      return {
        tests,
        summary: {
          working: workingServices,
          total: totalServices,
          percentage: Math.round((workingServices / totalServices) * 100)
        }
      };
    } catch (error) {
      console.error('Erro no teste de conectividade:', error);
      throw new Error('Falha no teste de conectividade');
    }
  }
}

export default AIOrchestrator.getInstance(); 