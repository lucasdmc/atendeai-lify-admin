import { supabase } from '../../../integrations/supabase/client';

export interface CacheEntry {
  id: string;
  query: string;
  response: string;
  embedding?: number[];
  clinic_id: string;
  user_id: string;
  confidence: number;
  model_used: string;
  tokens_used: number;
  cost: number;
  created_at: string;
}

export interface StreamingMetrics {
  id: string;
  message: string;
  response: string;
  clinic_id: string;
  user_id: string;
  confidence: number;
  model_used: string;
  tokens_used: number;
  cost: number;
  response_time: number;
  created_at: string;
}

export interface InteractionEntry {
  id: string;
  message: string;
  response: string;
  clinic_id: string;
  user_id: string;
  session_id?: string;
  intent?: string;
  confidence: number;
  model_used: string;
  tokens_used: number;
  cost: number;
  response_time: number;
  cache_hit: boolean;
  escalated: boolean;
  error: boolean;
  error_message?: string;
  user_rating?: number;
  medical_content: boolean;
  medical_accuracy?: boolean;
  relevance_score?: number;
  engagement_score?: number;
  resolved: boolean;
  created_at: string;
}

export class CacheStreamingService {
  private static instance: CacheStreamingService;

  private constructor() {}

  public static getInstance(): CacheStreamingService {
    if (!CacheStreamingService.instance) {
      CacheStreamingService.instance = new CacheStreamingService();
    }
    return CacheStreamingService.instance;
  }

  /**
   * Gera embedding para busca semântica
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simulação de embedding (em produção, usar OpenAI text-embedding-3-small)
    const words = text.toLowerCase().split(' ');
    const embedding = new Array(1536).fill(0);
    
    words.forEach((word, index) => {
      if (index < 1536) {
        embedding[index] = word.length / 10; // Simulação simples
      }
    });
    
    return embedding;
  }

  /**
   * Busca resposta similar no cache
   */
  async findSimilarResponse(
    query: string,
    clinicId: string,
    userId: string,
    similarityThreshold: number = 0.85
  ): Promise<CacheEntry | null> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Buscar no cache usando função SQL
      const { data, error } = await supabase.rpc('match_cache_entries', {
        query_embedding: queryEmbedding,
        similarity_threshold: similarityThreshold,
        clinic_id_param: clinicId,
        user_id_param: userId,
        limit_count: 1
      });

      if (error) {
        console.error('Erro ao buscar cache:', error);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as CacheEntry;
      }

      return null;
    } catch (error) {
      console.error('Erro na busca de cache:', error);
      return null;
    }
  }

  /**
   * Salva resposta no cache
   */
  async saveToCache(
    query: string,
    response: string,
    clinicId: string,
    userId: string,
    modelUsed: string,
    tokensUsed: number,
    cost: number,
    confidence: number = 0.8
  ): Promise<CacheEntry> {
    try {
      const embedding = await this.generateEmbedding(query);

      const { data, error } = await supabase
        .from('ai_cache_entries')
        .insert({
          query,
          response,
          embedding,
          clinic_id: clinicId,
          user_id: userId,
          confidence,
          model_used: modelUsed,
          tokens_used: tokensUsed,
          cost
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar no cache:', error);
        throw new Error('Falha ao salvar no cache');
      }

      return data;
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
      throw new Error('Falha ao salvar cache');
    }
  }

  /**
   * Registra métricas de streaming
   */
  async recordStreamingMetrics(
    message: string,
    response: string,
    clinicId: string,
    userId: string,
    modelUsed: string,
    tokensUsed: number,
    cost: number,
    responseTime: number,
    confidence: number = 0.8
  ): Promise<StreamingMetrics> {
    try {
      const { data, error } = await supabase
        .from('ai_streaming_metrics')
        .insert({
          message,
          response,
          clinic_id: clinicId,
          user_id: userId,
          confidence,
          model_used: modelUsed,
          tokens_used: tokensUsed,
          cost,
          response_time: responseTime
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar streaming:', error);
        throw new Error('Falha ao registrar streaming');
      }

      return data;
    } catch (error) {
      console.error('Erro ao registrar streaming:', error);
      throw new Error('Falha ao registrar streaming');
    }
  }

  /**
   * Registra interação completa
   */
  async recordInteraction(
    message: string,
    response: string,
    clinicId: string,
    userId: string,
    sessionId?: string,
    intent?: string,
    modelUsed: string = 'gpt-4o',
    tokensUsed: number = 0,
    cost: number = 0,
    responseTime: number = 0,
    cacheHit: boolean = false,
    escalated: boolean = false,
    error: boolean = false,
    errorMessage?: string,
    userRating?: number,
    medicalContent: boolean = false,
    medicalAccuracy?: boolean,
    relevanceScore?: number,
    engagementScore?: number,
    resolved: boolean = false
  ): Promise<InteractionEntry> {
    try {
      const { data, error } = await supabase
        .from('ai_interactions')
        .insert({
          message,
          response,
          clinic_id: clinicId,
          user_id: userId,
          session_id: sessionId,
          intent,
          confidence: 0.8,
          model_used: modelUsed,
          tokens_used: tokensUsed,
          cost,
          response_time: responseTime,
          cache_hit: cacheHit,
          escalated,
          error,
          error_message: errorMessage,
          user_rating: userRating,
          medical_content: medicalContent,
          medical_accuracy: medicalAccuracy,
          relevance_score: relevanceScore,
          engagement_score: engagementScore,
          resolved
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar interação:', error);
        throw new Error('Falha ao registrar interação');
      }

      return data;
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
      throw new Error('Falha ao registrar interação');
    }
  }

  /**
   * Obtém estatísticas de cache
   */
  async getCacheStats(clinicId?: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_cache_stats', {
        clinic_id_param: clinicId
      });

      if (error) {
        console.error('Erro ao obter estatísticas de cache:', error);
        throw new Error('Falha ao obter estatísticas de cache');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de cache:', error);
      throw new Error('Falha ao obter estatísticas de cache');
    }
  }

  /**
   * Obtém estatísticas de streaming
   */
  async getStreamingStats(clinicId?: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_streaming_stats', {
        clinic_id_param: clinicId
      });

      if (error) {
        console.error('Erro ao obter estatísticas de streaming:', error);
        throw new Error('Falha ao obter estatísticas de streaming');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de streaming:', error);
      throw new Error('Falha ao obter estatísticas de streaming');
    }
  }

  /**
   * Obtém estatísticas de analytics
   */
  async getAnalyticsStats(
    clinicId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_analytics_stats', {
        clinic_id_param: clinicId,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Erro ao obter estatísticas de analytics:', error);
        throw new Error('Falha ao obter estatísticas de analytics');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de analytics:', error);
      throw new Error('Falha ao obter estatísticas de analytics');
    }
  }

  /**
   * Limpa cache antigo
   */
  async cleanupOldCache(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_cache_entries');

      if (error) {
        console.error('Erro ao limpar cache:', error);
        throw new Error('Falha ao limpar cache');
      }

      return data || 0;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      throw new Error('Falha ao limpar cache');
    }
  }

  /**
   * Processa query com cache e streaming
   */
  async processWithCacheAndStreaming(
    query: string,
    clinicId: string,
    userId: string,
    sessionId?: string
  ): Promise<{ response: string; cacheHit: boolean; streamingMetrics: StreamingMetrics }> {
    try {
      const startTime = Date.now();

      // Tentar encontrar resposta similar no cache
      const cachedResponse = await this.findSimilarResponse(query, clinicId, userId);
      
      if (cachedResponse) {
        // Cache hit
        const responseTime = Date.now() - startTime;
        
        const streamingMetrics = await this.recordStreamingMetrics(
          query,
          cachedResponse.response,
          clinicId,
          userId,
          cachedResponse.model_used,
          cachedResponse.tokens_used,
          cachedResponse.cost,
          responseTime,
          cachedResponse.confidence
        );

        await this.recordInteraction(
          query,
          cachedResponse.response,
          clinicId,
          userId,
          sessionId,
          undefined,
          cachedResponse.model_used,
          cachedResponse.tokens_used,
          cachedResponse.cost,
          responseTime,
          true, // cache hit
          false,
          false
        );

        return {
          response: cachedResponse.response,
          cacheHit: true,
          streamingMetrics
        };
      }

      // Cache miss - gerar nova resposta
      const modelUsed = 'gpt-4o';
      const tokensUsed = Math.floor(query.length / 4) + 100;
      const cost = tokensUsed * 0.0001;
      const response = `Resposta gerada para: ${query}`;
      
      const responseTime = Date.now() - startTime;

      // Salvar no cache
      await this.saveToCache(query, response, clinicId, userId, modelUsed, tokensUsed, cost);

      // Registrar métricas de streaming
      const streamingMetrics = await this.recordStreamingMetrics(
        query,
        response,
        clinicId,
        userId,
        modelUsed,
        tokensUsed,
        cost,
        responseTime
      );

      // Registrar interação
      await this.recordInteraction(
        query,
        response,
        clinicId,
        userId,
        sessionId,
        undefined,
        modelUsed,
        tokensUsed,
        cost,
        responseTime,
        false, // cache miss
        false,
        false
      );

      return {
        response,
        cacheHit: false,
        streamingMetrics
      };
    } catch (error) {
      console.error('Erro no processamento com cache e streaming:', error);
      throw new Error('Falha no processamento');
    }
  }
}

export default CacheStreamingService.getInstance(); 