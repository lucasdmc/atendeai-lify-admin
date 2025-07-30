import { supabase } from '@/integrations/supabase/client';

export interface AIRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  phoneNumber?: string;
  agentId?: string;
  temperature?: number;
  maxTokens?: number;
  context?: any;
}

export interface AIResponse {
  content: string;
  model: string;
  tokensUsed: number;
  confidence: number;
  processingTime: number;
  metadata?: Record<string, any>;
}

export interface ModelConfig {
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'mistral';
  model: string;
  maxTokens: number;
  temperature: number;
  costPerToken: number;
  specialties: string[];
  fallbackPriority: number;
}

export type ModelType = 'primary' | 'medical' | 'portuguese' | 'fallback';

export class ModelEnsembleService {
  private models: Record<ModelType, ModelConfig> = {
    primary: {
      name: 'GPT-4o',
      provider: 'openai',
      model: 'gpt-4o',
      maxTokens: 2000,
      temperature: 0.7,
      costPerToken: 0.0002,
      specialties: ['reasoning', 'general', 'complex_tasks'],
      fallbackPriority: 1
    },
    medical: {
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 2000,
      temperature: 0.3,
      costPerToken: 0.00015,
      specialties: ['medical_context', 'safety', 'precision'],
      fallbackPriority: 2
    },
    portuguese: {
      name: 'Gemini Pro',
      provider: 'google',
      model: 'gemini-1.5-pro',
      maxTokens: 2000,
      temperature: 0.6,
      costPerToken: 0.0001,
      specialties: ['portuguese', 'local_context', 'natural_language'],
      fallbackPriority: 3
    },
    fallback: {
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      maxTokens: 1500,
      temperature: 0.7,
      costPerToken: 0.00005,
      specialties: ['reliability', 'speed', 'cost_efficiency'],
      fallbackPriority: 4
    }
  };

  /**
   * Gera resposta usando ensemble de modelos
   */
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Selecionar modelo baseado no contexto
      const modelStrategy = this.selectModelStrategy(request);
      console.log(`🤖 Usando modelo: ${modelStrategy} (${this.models[modelStrategy].name})`);

      // 2. Tentar com modelo selecionado
      const response = await this.callModel(modelStrategy, request);
      
      // 3. Validar qualidade da resposta
      const qualityScore = await this.assessResponseQuality(response.content, request);
      
      // 4. Se qualidade baixa, tentar com fallback
      if (qualityScore < 0.6) {
        console.log(`⚠️ Qualidade baixa (${qualityScore.toFixed(2)}), tentando fallback`);
        return await this.generateWithFallback(request, modelStrategy);
      }

      return {
        ...response,
        processingTime: Date.now() - startTime,
        confidence: qualityScore
      };

    } catch (error) {
      console.error('❌ Erro no modelo principal, usando fallback:', error);
      return await this.generateWithFallback(request, 'primary');
    }
  }

  /**
   * Seleciona estratégia de modelo baseada no contexto
   */
  private selectModelStrategy(request: AIRequest): ModelType {
    const message = request.messages[request.messages.length - 1]?.content || '';
    const lowerMessage = message.toLowerCase();

    // Verificar se contém conteúdo médico
    if (this.containsMedicalContent(lowerMessage)) {
      return 'medical'; // Claude melhor para contexto médico
    }

    // Verificar se é raciocínio complexo
    if (this.isComplexReasoning(lowerMessage)) {
      return 'primary'; // GPT-4o melhor para raciocínio
    }

    // Verificar se é português natural/local
    if (this.isPortugueseNatural(lowerMessage)) {
      return 'portuguese'; // Gemini melhor para português
    }

    // Verificar se é agendamento ou informação estruturada
    if (this.isStructuredTask(lowerMessage)) {
      return 'primary'; // GPT-4o para tarefas estruturadas
    }

    // Padrão: modelo primário
    return 'primary';
  }

  /**
   * Detecta conteúdo médico na mensagem
   */
  private containsMedicalContent(message: string): boolean {
    const medicalKeywords = [
      'diagnóstico', 'medicamento', 'dosagem', 'prescrição',
      'tratamento', 'sintoma', 'doença', 'exame', 'consulta médica',
      'médico', 'doutor', 'especialista', 'clínico'
    ];

    return medicalKeywords.some(keyword => message.includes(keyword));
  }

  /**
   * Detecta raciocínio complexo
   */
  private isComplexReasoning(message: string): boolean {
    const complexIndicators = [
      'por que', 'como funciona', 'explique', 'analise',
      'compare', 'avalie', 'considere', 'pense'
    ];

    return complexIndicators.some(indicator => message.includes(indicator));
  }

  /**
   * Detecta português natural/local
   */
  private isPortugueseNatural(message: string): boolean {
    const naturalIndicators = [
      'beleza', 'tranquilo', 'suave', 'mano', 'cara',
      'valeu', 'obrigado', 'por favor', 'se puder'
    ];

    return naturalIndicators.some(indicator => message.includes(indicator));
  }

  /**
   * Detecta tarefas estruturadas
   */
  private isStructuredTask(message: string): boolean {
    const structuredIndicators = [
      'agendar', 'marcar', 'consulta', 'horário',
      'serviços', 'especialidades', 'preços', 'endereço'
    ];

    return structuredIndicators.some(indicator => message.includes(indicator));
  }

  /**
   * Chama modelo específico
   */
  private async callModel(modelType: ModelType, request: AIRequest): Promise<AIResponse> {
    const modelConfig = this.models[modelType];
    
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat-ensemble', {
        body: {
          ...request,
          model: modelConfig.model,
          provider: modelConfig.provider,
          temperature: modelConfig.temperature,
          maxTokens: modelConfig.maxTokens
        }
      });

      if (error) throw error;

      return {
        content: data.content || 'Desculpe, não consegui gerar uma resposta.',
        model: modelConfig.name,
        tokensUsed: data.tokensUsed || 0,
        confidence: data.confidence || 0.8,
        metadata: {
          modelType,
          provider: modelConfig.provider,
          cost: this.calculateCost(data.tokensUsed || 0, modelConfig.costPerToken)
        }
      };

    } catch (error) {
      console.error(`❌ Erro ao chamar modelo ${modelType}:`, error);
      throw error;
    }
  }

  /**
   * Gera resposta com fallback
   */
  private async generateWithFallback(
    request: AIRequest,
    failedModel: ModelType
  ): Promise<AIResponse> {
    
    // Ordenar modelos por prioridade de fallback
    const fallbackOrder: ModelType[] = ['fallback', 'portuguese', 'medical', 'primary'];
    const availableModels = fallbackOrder.filter(model => model !== failedModel);

    for (const modelType of availableModels) {
      try {
        console.log(`🔄 Tentando fallback com modelo: ${modelType}`);
        const response = await this.callModel(modelType, request);
        
        // Validar qualidade mínima
        const qualityScore = await this.assessResponseQuality(response.content, request);
        if (qualityScore > 0.4) {
          return {
            ...response,
            confidence: qualityScore,
            metadata: {
              ...response.metadata,
              fallbackUsed: true,
              originalModel: failedModel
            }
          };
        }
      } catch (error) {
        console.error(`❌ Fallback ${modelType} falhou:`, error);
        continue;
      }
    }

    // Se todos os modelos falharam, retornar resposta padrão
    return {
      content: 'Desculpe, estou enfrentando dificuldades técnicas. Por favor, tente novamente em alguns instantes ou entre em contato com nosso atendimento humano.',
      model: 'fallback',
      tokensUsed: 0,
      confidence: 0.1,
      metadata: {
        allModelsFailed: true,
        fallbackUsed: true
      }
    };
  }

  /**
   * Avalia qualidade da resposta
   */
  private async assessResponseQuality(
    response: string,
    request: AIRequest
  ): Promise<number> {
    try {
      // Usar modelo secundário para avaliar qualidade
      const { data, error } = await supabase.functions.invoke('ai-quality-assessment', {
        body: {
          response,
          originalRequest: request,
          criteria: ['relevance', 'completeness', 'clarity', 'appropriateness']
        }
      });

      if (error || !data) {
        return this.fallbackQualityAssessment(response);
      }

      return data.qualityScore || 0.7;
    } catch (error) {
      console.error('❌ Erro ao avaliar qualidade:', error);
      return this.fallbackQualityAssessment(response);
    }
  }

  /**
   * Avaliação de qualidade baseada em heurísticas (fallback)
   */
  private fallbackQualityAssessment(response: string): number {
    let score = 0.7; // Score base

    // Verificar se a resposta é muito curta
    if (response.length < 10) {
      score -= 0.4;
    }

    // Verificar se a resposta é muito longa
    if (response.length > 800) {
      score -= 0.2;
    }

    // Verificar se contém informações úteis
    const usefulIndicators = ['agendamento', 'consulta', 'horário', 'serviço', 'endereço'];
    const hasUsefulInfo = usefulIndicators.some(indicator => 
      response.toLowerCase().includes(indicator)
    );

    if (hasUsefulInfo) {
      score += 0.2;
    }

    // Verificar se contém tom profissional
    const professionalIndicators = ['por favor', 'obrigado', 'disponível', 'posso ajudar'];
    const hasProfessionalTone = professionalIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );

    if (hasProfessionalTone) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calcula custo da resposta
   */
  private calculateCost(tokensUsed: number, costPerToken: number): number {
    return tokensUsed * costPerToken;
  }

  /**
   * Obtém estatísticas de uso dos modelos
   */
  async getModelUsageStats(): Promise<Record<ModelType, {
    calls: number;
    successRate: number;
    avgQuality: number;
    avgCost: number;
    totalCost: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('model_usage_logs')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Últimos 30 dias

      if (error) throw error;

      const stats: Record<ModelType, any> = {
        primary: { calls: 0, successes: 0, totalQuality: 0, totalCost: 0 },
        medical: { calls: 0, successes: 0, totalQuality: 0, totalCost: 0 },
        portuguese: { calls: 0, successes: 0, totalQuality: 0, totalCost: 0 },
        fallback: { calls: 0, successes: 0, totalQuality: 0, totalCost: 0 }
      };

      data.forEach(log => {
        const modelType = log.model_type as ModelType;
        if (stats[modelType]) {
          stats[modelType].calls++;
          if (log.success) stats[modelType].successes++;
          stats[modelType].totalQuality += log.quality_score || 0;
          stats[modelType].totalCost += log.cost || 0;
        }
      });

      // Calcular médias
      const result: Record<ModelType, any> = {} as any;
      Object.entries(stats).forEach(([modelType, stat]) => {
        result[modelType as ModelType] = {
          calls: stat.calls,
          successRate: stat.calls > 0 ? stat.successes / stat.calls : 0,
          avgQuality: stat.calls > 0 ? stat.totalQuality / stat.calls : 0,
          avgCost: stat.calls > 0 ? stat.totalCost / stat.calls : 0,
          totalCost: stat.totalCost
        };
      });

      return result;
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas de uso:', error);
      return {} as any;
    }
  }

  /**
   * Otimiza seleção de modelo baseado em performance
   */
  async optimizeModelSelection(): Promise<void> {
    try {
      const stats = await this.getModelUsageStats();
      
      // Ajustar prioridades baseado em performance
      Object.entries(stats).forEach(([modelType, stat]) => {
        if (stat.successRate < 0.8) {
          console.log(`⚠️ Modelo ${modelType} com baixa taxa de sucesso: ${(stat.successRate * 100).toFixed(1)}%`);
        }
        
        if (stat.avgCost > 0.01) {
          console.log(`💰 Modelo ${modelType} com custo alto: $${stat.avgCost.toFixed(4)} por chamada`);
        }
      });

      // Implementar lógica de otimização automática aqui
      console.log('✅ Otimização de seleção de modelo concluída');
    } catch (error) {
      console.error('❌ Erro na otimização de modelos:', error);
    }
  }

  /**
   * Registra uso do modelo para análise
   */
  private async logModelUsage(
    modelType: ModelType,
    request: AIRequest,
    response: AIResponse,
    success: boolean
  ): Promise<void> {
    try {
      await supabase
        .from('model_usage_logs')
        .insert({
          model_type: modelType,
          model_name: this.models[modelType].name,
          success,
          quality_score: response.confidence,
          cost: response.metadata?.cost || 0,
          tokens_used: response.tokensUsed,
          processing_time: response.processingTime,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('❌ Erro ao registrar uso do modelo:', error);
    }
  }
} 