import { createClient } from '@supabase/supabase-js';

interface StreamingConfig {
  chunkSize: number;
  delayMs: number;
  maxTokens: number;
  temperature: number;
}

interface StreamingResponse {
  content: string;
  isComplete: boolean;
  tokensUsed: number;
  modelUsed: string;
  confidence: number;
}

interface StreamChunk {
  type: 'content' | 'error' | 'complete';
  data: string;
  metadata?: {
    tokensUsed?: number;
    modelUsed?: string;
    confidence?: number;
  };
}

export class StreamingService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private config: StreamingConfig = {
    chunkSize: 50, // Caracteres por chunk
    delayMs: 50, // Delay entre chunks (simulação)
    maxTokens: 1000,
    temperature: 0.7
  };

  /**
   * Gera resposta streaming usando OpenAI
   */
  async streamResponse(
    message: string,
    clinicId: string,
    userId: string,
    systemPrompt: string
  ): Promise<AsyncGenerator<StreamChunk, void, unknown>> {
    const generator = async function* (this: StreamingService): AsyncGenerator<StreamChunk, void, unknown> {
      try {
        // Iniciar stream com OpenAI
        const stream = await this.startOpenAIStream(message, systemPrompt);
        
        let fullResponse = '';
        let tokensUsed = 0;
        let modelUsed = 'gpt-4o';

        for await (const chunk of stream) {
          if (chunk.type === 'content') {
            fullResponse += chunk.data;
            tokensUsed += chunk.metadata?.tokensUsed || 0;
            
            // Enviar chunk para o cliente
            yield {
              type: 'content',
              data: chunk.data,
              metadata: {
                tokensUsed,
                modelUsed,
                confidence: this.calculateConfidence(fullResponse, message)
              }
            };

            // Pequeno delay para simular digitação
            await this.delay(this.config.delayMs);
          } else if (chunk.type === 'error') {
            yield {
              type: 'error',
              data: chunk.data
            };
            return;
          }
        }

        // Resposta completa
        const finalConfidence = this.calculateConfidence(fullResponse, message);
        
        yield {
          type: 'complete',
          data: fullResponse,
          metadata: {
            tokensUsed,
            modelUsed,
            confidence: finalConfidence
          }
        };

        // Salvar no cache e analytics
        await this.saveStreamingResponse(
          message,
          fullResponse,
          clinicId,
          userId,
          finalConfidence,
          modelUsed,
          tokensUsed
        );

      } catch (error) {
        console.error('Erro no streaming:', error);
        yield {
          type: 'error',
          data: 'Erro ao gerar resposta. Tente novamente.'
        };
      }
    }.bind(this);

    return generator();
  }

  /**
   * Inicia stream com OpenAI
   */
  private async startOpenAIStream(
    message: string,
    systemPrompt: string
  ): Promise<AsyncGenerator<StreamChunk, void, unknown>> {
    const generator = async function* (): AsyncGenerator<StreamChunk, void, unknown> {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message }
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`Erro na API OpenAI: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Não foi possível ler o stream');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  yield {
                    type: 'content',
                    data: content,
                    metadata: {
                      tokensUsed: parsed.usage?.completion_tokens || 0,
                      modelUsed: 'gpt-4o'
                    }
                  };
                }
              } catch (error) {
                console.error('Erro ao parsear chunk:', error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Erro no stream OpenAI:', error);
        yield {
          type: 'error',
          data: 'Erro na comunicação com a IA'
        };
      }
    }.bind(this);

    return generator();
  }

  /**
   * Calcula confiança da resposta
   */
  private calculateConfidence(response: string, originalMessage: string): number {
    // Fatores para calcular confiança
    const factors = {
      length: Math.min(response.length / 100, 1), // Resposta não muito curta
      relevance: this.calculateRelevance(response, originalMessage),
      coherence: this.calculateCoherence(response),
      completeness: this.calculateCompleteness(response, originalMessage)
    };

    // Peso dos fatores
    const weights = {
      length: 0.2,
      relevance: 0.4,
      coherence: 0.2,
      completeness: 0.2
    };

    const confidence = Object.entries(factors).reduce(
      (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
      0
    );

    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Calcula relevância da resposta
   */
  private calculateRelevance(response: string, originalMessage: string): number {
    const originalWords = originalMessage.toLowerCase().split(/\s+/);
    const responseWords = response.toLowerCase().split(/\s+/);
    
    const commonWords = originalWords.filter(word => 
      responseWords.includes(word) && word.length > 3
    );
    
    return Math.min(commonWords.length / Math.max(originalWords.length, 1), 1);
  }

  /**
   * Calcula coerência da resposta
   */
  private calculateCoherence(response: string): number {
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 1) return 1;

    // Verificar se as frases fazem sentido juntas
    let coherenceScore = 0;
    
    for (let i = 1; i < sentences.length; i++) {
      const prev = sentences[i - 1].toLowerCase();
      const curr = sentences[i].toLowerCase();
      
      // Verificar conectores lógicos
      const connectors = ['mas', 'porém', 'entretanto', 'além disso', 'também', 'assim', 'portanto'];
      const hasConnector = connectors.some(connector => curr.includes(connector));
      
      // Verificar continuidade temática
      const prevWords = prev.split(/\s+/).filter(w => w.length > 3);
      const currWords = curr.split(/\s+/).filter(w => w.length > 3);
      const commonWords = prevWords.filter(w => currWords.includes(w));
      
      if (hasConnector || commonWords.length > 0) {
        coherenceScore += 1;
      }
    }
    
    return coherenceScore / (sentences.length - 1);
  }

  /**
   * Calcula completude da resposta
   */
  private calculateCompleteness(response: string, originalMessage: string): number {
    const originalLower = originalMessage.toLowerCase();
    const responseLower = response.toLowerCase();
    
    // Verificar se a resposta aborda palavras-chave da pergunta
    const keywords = originalLower.split(/\s+/).filter(word => word.length > 3);
    const addressedKeywords = keywords.filter(keyword => responseLower.includes(keyword));
    
    return addressedKeywords.length / Math.max(keywords.length, 1);
  }

  /**
   * Salva resposta streaming para cache e analytics
   */
  private async saveStreamingResponse(
    message: string,
    response: string,
    clinicId: string,
    userId: string,
    confidence: number,
    modelUsed: string,
    tokensUsed: number
  ): Promise<void> {
    try {
      // Salvar no cache semântico
      const { SemanticCacheService } = await import('./cache/semanticCacheService');
      const cacheService = new SemanticCacheService();
      
      const cost = this.calculateCost(tokensUsed, modelUsed);
      
      await cacheService.cacheResponse(
        message,
        response,
        clinicId,
        userId,
        confidence,
        modelUsed,
        tokensUsed,
        cost
      );

      // Salvar métricas de streaming
      await this.saveStreamingMetrics({
        message,
        response,
        clinicId,
        userId,
        confidence,
        modelUsed,
        tokensUsed,
        cost,
        responseTime: Date.now() // Será calculado pelo analytics
      });

    } catch (error) {
      console.error('Erro ao salvar resposta streaming:', error);
    }
  }

  /**
   * Calcula custo baseado em tokens e modelo
   */
  private calculateCost(tokensUsed: number, modelUsed: string): number {
    const costPerToken = {
      'gpt-4o': 0.000005, // $0.005 per 1K tokens
      'gpt-4': 0.00003,
      'gpt-3.5-turbo': 0.000002,
      'claude-3-sonnet': 0.000015
    };

    return tokensUsed * (costPerToken[modelUsed as keyof typeof costPerToken] || 0.000005);
  }

  /**
   * Salva métricas de streaming
   */
  private async saveStreamingMetrics(metrics: {
    message: string;
    response: string;
    clinicId: string;
    userId: string;
    confidence: number;
    modelUsed: string;
    tokensUsed: number;
    cost: number;
    responseTime: number;
  }): Promise<void> {
    try {
      await this.supabase
        .from('ai_streaming_metrics')
        .insert({
          message: metrics.message,
          response: metrics.response,
          clinic_id: metrics.clinicId,
          user_id: metrics.userId,
          confidence: metrics.confidence,
          model_used: metrics.modelUsed,
          tokens_used: metrics.tokensUsed,
          cost: metrics.cost,
          response_time: metrics.responseTime,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar métricas de streaming:', error);
    }
  }

  /**
   * Delay utilitário
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Obtém estatísticas de streaming
   */
  async getStreamingStats(clinicId?: string): Promise<{
    totalStreams: number;
    averageResponseTime: number;
    averageTokens: number;
    totalCost: number;
    averageConfidence: number;
  }> {
    try {
      let query = this.supabase
        .from('ai_streaming_metrics')
        .select('*');

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data: metrics, error } = await query;

      if (error || !metrics || metrics.length === 0) {
        return {
          totalStreams: 0,
          averageResponseTime: 0,
          averageTokens: 0,
          totalCost: 0,
          averageConfidence: 0
        };
      }

      const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
      const averageTokens = metrics.reduce((sum, m) => sum + (m.tokens_used || 0), 0) / metrics.length;
      const averageConfidence = metrics.reduce((sum, m) => sum + (m.confidence || 0), 0) / metrics.length;
      const averageResponseTime = metrics.reduce((sum, m) => sum + (m.response_time || 0), 0) / metrics.length;

      return {
        totalStreams: metrics.length,
        averageResponseTime,
        averageTokens,
        totalCost,
        averageConfidence
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de streaming:', error);
      return {
        totalStreams: 0,
        averageResponseTime: 0,
        averageTokens: 0,
        totalCost: 0,
        averageConfidence: 0
      };
    }
  }
} 