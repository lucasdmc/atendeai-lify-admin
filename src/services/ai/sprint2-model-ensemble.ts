import { supabase } from '../../../integrations/supabase/client';

export interface ModelEnsembleEntry {
  id: string;
  query: string;
  selected_model: string;
  fallback_model?: string;
  model_scores: any;
  final_response: string;
  tokens_used: number;
  cost: number;
  clinic_id: string;
  user_id: string;
  created_at: string;
}

export interface PromptEntry {
  id: string;
  prompt_type: string;
  base_prompt: string;
  context_prompt?: string;
  constraints: string[];
  examples: any;
  performance_score?: number;
  usage_count: number;
  clinic_id: string;
  created_at: string;
}

export interface RateLimitEntry {
  id: string;
  user_id: string;
  clinic_id: string;
  tier: string;
  daily_usage: number;
  monthly_usage: number;
  last_reset_date: string;
  created_at: string;
}

export class ModelEnsembleService {
  private static instance: ModelEnsembleService;
  private models = ['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro', 'gpt-3.5-turbo'];

  private constructor() {}

  public static getInstance(): ModelEnsembleService {
    if (!ModelEnsembleService.instance) {
      ModelEnsembleService.instance = new ModelEnsembleService();
    }
    return ModelEnsembleService.instance;
  }

  /**
   * Seleciona o melhor modelo baseado no contexto
   */
  private selectBestModel(query: string, clinicId: string): string {
    const queryLower = query.toLowerCase();
    
    // Lógica de seleção baseada no conteúdo
    if (queryLower.includes('médico') || queryLower.includes('saúde') || queryLower.includes('tratamento')) {
      return 'gpt-4o'; // Melhor para conteúdo médico
    }
    
    if (queryLower.includes('criativo') || queryLower.includes('história') || queryLower.includes('narrativa')) {
      return 'claude-3-5-sonnet'; // Melhor para criatividade
    }
    
    if (queryLower.includes('análise') || queryLower.includes('dados') || queryLower.includes('estatística')) {
      return 'gemini-pro'; // Melhor para análise
    }
    
    return 'gpt-3.5-turbo'; // Padrão
  }

  /**
   * Gera prompt avançado baseado no contexto
   */
  async generateAdvancedPrompt(
    promptType: string,
    basePrompt: string,
    context?: string,
    constraints: string[] = [],
    examples: any = {}
  ): Promise<PromptEntry> {
    try {
      const { data, error } = await supabase
        .from('ai_prompts')
        .insert({
          prompt_type: promptType,
          base_prompt: basePrompt,
          context_prompt: context,
          constraints,
          examples,
          usage_count: 0,
          clinic_id: 'default' // Será atualizado quando usado
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar prompt:', error);
        throw new Error('Falha ao criar prompt');
      }

      return data;
    } catch (error) {
      console.error('Erro ao gerar prompt:', error);
      throw new Error('Falha ao gerar prompt');
    }
  }

  /**
   * Verifica rate limiting do usuário
   */
  async checkRateLimit(userId: string, clinicId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ai_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao verificar rate limit:', error);
        throw new Error('Falha ao verificar rate limit');
      }

      if (!data) {
        // Criar novo registro
        await supabase
          .from('ai_rate_limits')
          .insert({
            user_id: userId,
            clinic_id: clinicId,
            tier: 'basic',
            daily_usage: 0,
            monthly_usage: 0
          });
        return true;
      }

      // Verificar limites baseados no tier
      const limits = {
        basic: { daily: 100, monthly: 1000 },
        premium: { daily: 500, monthly: 5000 },
        enterprise: { daily: 2000, monthly: 20000 }
      };

      const tier = data.tier as keyof typeof limits;
      const limit = limits[tier] || limits.basic;

      return data.daily_usage < limit.daily && data.monthly_usage < limit.monthly;
    } catch (error) {
      console.error('Erro no rate limiting:', error);
      return false;
    }
  }

  /**
   * Atualiza uso do rate limiting
   */
  async updateRateLimit(userId: string, clinicId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('ai_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .single();

      if (error) {
        console.error('Erro ao atualizar rate limit:', error);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const isNewDay = data.last_reset_date !== today;

      await supabase
        .from('ai_rate_limits')
        .update({
          daily_usage: isNewDay ? 1 : data.daily_usage + 1,
          monthly_usage: data.monthly_usage + 1,
          last_reset_date: today
        })
        .eq('user_id', userId)
        .eq('clinic_id', clinicId);
    } catch (error) {
      console.error('Erro ao atualizar rate limit:', error);
    }
  }

  /**
   * Processa query usando ensemble de modelos
   */
  async processWithEnsemble(
    query: string,
    clinicId: string,
    userId: string,
    context?: string
  ): Promise<ModelEnsembleEntry> {
    try {
      // Verificar rate limit
      const canProcess = await this.checkRateLimit(userId, clinicId);
      if (!canProcess) {
        throw new Error('Rate limit excedido');
      }

      // Selecionar modelo principal
      const selectedModel = this.selectBestModel(query, clinicId);
      
      // Selecionar modelo de fallback
      const fallbackModel = this.models.find(m => m !== selectedModel) || 'gpt-3.5-turbo';

      // Simular scores dos modelos (em produção, seria baseado em performance real)
      const modelScores = {
        [selectedModel]: 0.85,
        [fallbackModel]: 0.75,
        'gpt-4o': 0.80,
        'claude-3-5-sonnet': 0.78,
        'gemini-pro': 0.82,
        'gpt-3.5-turbo': 0.70
      };

      // Gerar resposta (simulação)
      const finalResponse = `Resposta gerada pelo modelo ${selectedModel}: ${query}`;
      const tokensUsed = Math.floor(query.length / 4) + Math.floor(finalResponse.length / 4);
      const cost = tokensUsed * 0.0001; // Simulação de custo

      // Salvar no banco
      const { data, error } = await supabase
        .from('ai_model_ensemble')
        .insert({
          query,
          selected_model: selectedModel,
          fallback_model: fallbackModel,
          model_scores: modelScores,
          final_response: finalResponse,
          tokens_used: tokensUsed,
          cost,
          clinic_id: clinicId,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar ensemble:', error);
        throw new Error('Falha ao salvar ensemble');
      }

      // Atualizar rate limit
      await this.updateRateLimit(userId, clinicId);

      return data;
    } catch (error) {
      console.error('Erro no ensemble de modelos:', error);
      throw new Error('Falha no ensemble de modelos');
    }
  }

  /**
   * Obtém estatísticas de ensemble
   */
  async getEnsembleStats(clinicId?: string): Promise<any> {
    try {
      let query = supabase
        .from('ai_model_ensemble')
        .select('*');

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao obter estatísticas:', error);
        throw new Error('Falha ao obter estatísticas');
      }

      const stats = {
        total: data.length,
        totalCost: data.reduce((sum, item) => sum + item.cost, 0),
        totalTokens: data.reduce((sum, item) => sum + item.tokens_used, 0),
        modelUsage: data.reduce((acc, item) => {
          acc[item.selected_model] = (acc[item.selected_model] || 0) + 1;
          return acc;
        }, {} as any)
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error('Falha ao obter estatísticas');
    }
  }

  /**
   * Obtém prompts mais usados
   */
  async getTopPrompts(clinicId?: string, limit: number = 10): Promise<PromptEntry[]> {
    try {
      let query = supabase
        .from('ai_prompts')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao obter prompts:', error);
        throw new Error('Falha ao obter prompts');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter prompts:', error);
      throw new Error('Falha ao obter prompts');
    }
  }
}

export default ModelEnsembleService.getInstance(); 