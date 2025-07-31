import { createClient } from '@supabase/supabase-js';

interface CacheEntry {
  id: string;
  query: string;
  response: string;
  embedding: number[];
  clinicId: string;
  userId: string;
  timestamp: Date;
  confidence: number;
  modelUsed: string;
  tokensUsed: number;
  cost: number;
}

interface SemanticCacheConfig {
  similarityThreshold: number;
  maxCacheSize: number;
  ttlHours: number;
  minConfidence: number;
}

export class SemanticCacheService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private config: SemanticCacheConfig = {
    similarityThreshold: 0.85, // 85% de similaridade
    maxCacheSize: 10000, // Máximo de entradas no cache
    ttlHours: 24, // Time-to-live em horas
    minConfidence: 0.7 // Confiança mínima para cachear
  };

  /**
   * Busca resposta similar no cache
   */
  async findSimilarResponse(
    query: string,
    clinicId: string,
    userId: string
  ): Promise<CacheEntry | null> {
    try {
      // Gerar embedding da query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Buscar respostas similares no cache
      const { data: similarEntries, error } = await this.supabase
        .rpc('match_cache_entries', {
          query_embedding: queryEmbedding,
          similarity_threshold: this.config.similarityThreshold,
          clinic_id: clinicId,
          user_id: userId,
          limit_count: 5
        });

      if (error) {
        console.error('Erro ao buscar cache semântico:', error);
        return null;
      }

      if (!similarEntries || similarEntries.length === 0) {
        return null;
      }

      // Retornar a entrada mais similar
      const bestMatch = similarEntries[0];
      
      // Verificar se a entrada ainda é válida (TTL)
      if (this.isExpired(bestMatch.timestamp)) {
        await this.removeExpiredEntry(bestMatch.id);
        return null;
      }

      return {
        id: bestMatch.id,
        query: bestMatch.query,
        response: bestMatch.response,
        embedding: bestMatch.embedding,
        clinicId: bestMatch.clinic_id,
        userId: bestMatch.user_id,
        timestamp: new Date(bestMatch.timestamp),
        confidence: bestMatch.confidence,
        modelUsed: bestMatch.model_used,
        tokensUsed: bestMatch.tokens_used,
        cost: bestMatch.cost
      };
    } catch (error) {
      console.error('Erro no cache semântico:', error);
      return null;
    }
  }

  /**
   * Armazena nova resposta no cache
   */
  async cacheResponse(
    query: string,
    response: string,
    clinicId: string,
    userId: string,
    confidence: number,
    modelUsed: string,
    tokensUsed: number,
    cost: number
  ): Promise<void> {
    try {
      // Verificar se a confiança é suficiente para cachear
      if (confidence < this.config.minConfidence) {
        return;
      }

      // Gerar embedding da query
      const queryEmbedding = await this.generateEmbedding(query);
      
      // Verificar se já existe entrada muito similar
      const existingEntry = await this.findSimilarResponse(query, clinicId, userId);
      if (existingEntry && this.calculateSimilarity(queryEmbedding, existingEntry.embedding) > 0.95) {
        // Atualizar entrada existente se a nova for melhor
        if (confidence > existingEntry.confidence) {
          await this.updateCacheEntry(existingEntry.id, {
            response,
            confidence,
            modelUsed,
            tokensUsed,
            cost,
            timestamp: new Date()
          });
        }
        return;
      }

      // Inserir nova entrada
      const { error } = await this.supabase
        .from('ai_cache_entries')
        .insert({
          query,
          response,
          embedding: queryEmbedding,
          clinic_id: clinicId,
          user_id: userId,
          confidence,
          model_used: modelUsed,
          tokens_used: tokensUsed,
          cost,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao cachear resposta:', error);
        return;
      }

      // Limpar cache antigo se necessário
      await this.cleanupCache();
    } catch (error) {
      console.error('Erro ao cachear resposta:', error);
    }
  }

  /**
   * Gera embedding usando OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      // Fallback: embedding simples baseado em palavras-chave
      return this.generateSimpleEmbedding(text);
    }
  }

  /**
   * Fallback: embedding simples baseado em palavras-chave
   */
  private generateSimpleEmbedding(text: string): number[] {
    const keywords = [
      'agendamento', 'consulta', 'horário', 'médico', 'clínica',
      'exame', 'resultado', 'receita', 'medicamento', 'sintoma',
      'dor', 'febre', 'emergência', 'urgência', 'telefone',
      'endereço', 'preço', 'pagamento', 'seguro', 'documento'
    ];

    const embedding = new Array(keywords.length).fill(0);
    const lowerText = text.toLowerCase();

    keywords.forEach((keyword, index) => {
      if (lowerText.includes(keyword)) {
        embedding[index] = 1;
      }
    });

    return embedding;
  }

  /**
   * Calcula similaridade entre dois embeddings
   */
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    const dotProduct = embedding1.reduce((sum, val, i) => sum + val * embedding2[i], 0);
    const magnitude1 = Math.sqrt(embedding1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(embedding2.reduce((sum, val) => sum + val * val, 0));

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  }

  /**
   * Verifica se entrada expirou
   */
  private isExpired(timestamp: Date): boolean {
    const now = new Date();
    const ageInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
    return ageInHours > this.config.ttlHours;
  }

  /**
   * Remove entrada expirada
   */
  private async removeExpiredEntry(id: string): Promise<void> {
    try {
      await this.supabase
        .from('ai_cache_entries')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Erro ao remover entrada expirada:', error);
    }
  }

  /**
   * Atualiza entrada existente
   */
  private async updateCacheEntry(id: string, updates: Partial<CacheEntry>): Promise<void> {
    try {
      await this.supabase
        .from('ai_cache_entries')
        .update({
          response: updates.response,
          confidence: updates.confidence,
          model_used: updates.modelUsed,
          tokens_used: updates.tokensUsed,
          cost: updates.cost,
          timestamp: updates.timestamp?.toISOString()
        })
        .eq('id', id);
    } catch (error) {
      console.error('Erro ao atualizar entrada do cache:', error);
    }
  }

  /**
   * Limpa cache antigo
   */
  private async cleanupCache(): Promise<void> {
    try {
      // Remover entradas expiradas
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - this.config.ttlHours);

      await this.supabase
        .from('ai_cache_entries')
        .delete()
        .lt('timestamp', cutoffDate.toISOString());

      // Verificar tamanho do cache
      const { count } = await this.supabase
        .from('ai_cache_entries')
        .select('*', { count: 'exact', head: true });

      if (count && count > this.config.maxCacheSize) {
        // Remover entradas mais antigas
        const { data: oldestEntries } = await this.supabase
          .from('ai_cache_entries')
          .select('id')
          .order('timestamp', { ascending: true })
          .limit(count - this.config.maxCacheSize);

        if (oldestEntries && oldestEntries.length > 0) {
          const idsToDelete = oldestEntries.map(entry => entry.id);
          await this.supabase
            .from('ai_cache_entries')
            .delete()
            .in('id', idsToDelete);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getCacheStats(clinicId?: string): Promise<{
    totalEntries: number;
    hitRate: number;
    totalCost: number;
    averageConfidence: number;
    mostCachedQueries: Array<{ query: string; count: number }>;
  }> {
    try {
      let query = this.supabase
        .from('ai_cache_entries')
        .select('*');

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      const { data: entries, error } = await query;

      if (error || !entries) {
        return {
          totalEntries: 0,
          hitRate: 0,
          totalCost: 0,
          averageConfidence: 0,
          mostCachedQueries: []
        };
      }

      const totalCost = entries.reduce((sum, entry) => sum + (entry.cost || 0), 0);
      const averageConfidence = entries.reduce((sum, entry) => sum + entry.confidence, 0) / entries.length;

      // Contar queries mais frequentes
      const queryCounts: Record<string, number> = {};
      entries.forEach(entry => {
        queryCounts[entry.query] = (queryCounts[entry.query] || 0) + 1;
      });

      const mostCachedQueries = Object.entries(queryCounts)
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalEntries: entries.length,
        hitRate: 0, // Será calculado pelo analytics service
        totalCost,
        averageConfidence,
        mostCachedQueries
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas do cache:', error);
      return {
        totalEntries: 0,
        hitRate: 0,
        totalCost: 0,
        averageConfidence: 0,
        mostCachedQueries: []
      };
    }
  }

  /**
   * Limpa todo o cache
   */
  async clearCache(clinicId?: string): Promise<void> {
    try {
      let query = this.supabase
        .from('ai_cache_entries')
        .delete();

      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }

      await query;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }
} 