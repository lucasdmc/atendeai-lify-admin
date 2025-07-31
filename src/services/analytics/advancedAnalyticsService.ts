import { createClient } from '@supabase/supabase-js';

interface AnalyticsMetrics {
  totalInteractions: number;
  averageResponseTime: number;
  averageConfidence: number;
  totalCost: number;
  cacheHitRate: number;
  escalationRate: number;
  userSatisfaction: number;
  modelUsage: Record<string, number>;
  intentDistribution: Record<string, number>;
  errorRate: number;
}

interface QualityMetrics {
  medicalAccuracy: number;
  responseRelevance: number;
  conversationFlow: number;
  userEngagement: number;
  resolutionRate: number;
}

interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  errorRate: number;
  availability: number;
}

interface UserBehavior {
  sessionDuration: number;
  messagesPerSession: number;
  returnRate: number;
  peakUsageHours: number[];
  commonQueries: Array<{ query: string; count: number }>;
}

export class AdvancedAnalyticsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Gera relatório completo de analytics
   */
  async generateAnalyticsReport(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    metrics: AnalyticsMetrics;
    quality: QualityMetrics;
    performance: PerformanceMetrics;
    userBehavior: UserBehavior;
    recommendations: string[];
  }> {
    try {
      const [metrics, quality, performance, userBehavior] = await Promise.all([
        this.calculateMetrics(clinicId, startDate, endDate),
        this.calculateQualityMetrics(clinicId, startDate, endDate),
        this.calculatePerformanceMetrics(clinicId, startDate, endDate),
        this.calculateUserBehavior(clinicId, startDate, endDate)
      ]);

      const recommendations = this.generateRecommendations(metrics, quality, performance, userBehavior);

      return {
        metrics,
        quality,
        performance,
        userBehavior,
        recommendations
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de analytics:', error);
      throw error;
    }
  }

  /**
   * Calcula métricas principais
   */
  private async calculateMetrics(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsMetrics> {
    try {
      // Buscar dados de interações
      const { data: interactions, error: interactionsError } = await this.supabase
        .from('ai_interactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (interactionsError) {
        console.error('Erro ao buscar interações:', interactionsError);
        return this.getDefaultMetrics();
      }

      if (!interactions || interactions.length === 0) {
        return this.getDefaultMetrics();
      }

      // Buscar dados de cache
      const { data: cacheEntries, error: cacheError } = await this.supabase
        .from('ai_cache_entries')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Buscar dados de streaming
      const { data: streamingMetrics, error: streamingError } = await this.supabase
        .from('ai_streaming_metrics')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      // Calcular métricas
      const totalInteractions = interactions.length;
      const averageResponseTime = this.calculateAverageResponseTime(interactions, streamingMetrics);
      const averageConfidence = this.calculateAverageConfidence(interactions);
      const totalCost = this.calculateTotalCost(interactions, streamingMetrics);
      const cacheHitRate = this.calculateCacheHitRate(interactions, cacheEntries);
      const escalationRate = this.calculateEscalationRate(interactions);
      const userSatisfaction = this.calculateUserSatisfaction(interactions);
      const modelUsage = this.calculateModelUsage(interactions, streamingMetrics);
      const intentDistribution = this.calculateIntentDistribution(interactions);
      const errorRate = this.calculateErrorRate(interactions);

      return {
        totalInteractions,
        averageResponseTime,
        averageConfidence,
        totalCost,
        cacheHitRate,
        escalationRate,
        userSatisfaction,
        modelUsage,
        intentDistribution,
        errorRate
      };
    } catch (error) {
      console.error('Erro ao calcular métricas:', error);
      return this.getDefaultMetrics();
    }
  }

  /**
   * Calcula métricas de qualidade
   */
  private async calculateQualityMetrics(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<QualityMetrics> {
    try {
      const { data: interactions, error } = await this.supabase
        .from('ai_interactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !interactions || interactions.length === 0) {
        return this.getDefaultQualityMetrics();
      }

      const medicalAccuracy = this.calculateMedicalAccuracy(interactions);
      const responseRelevance = this.calculateResponseRelevance(interactions);
      const conversationFlow = this.calculateConversationFlow(interactions);
      const userEngagement = this.calculateUserEngagement(interactions);
      const resolutionRate = this.calculateResolutionRate(interactions);

      return {
        medicalAccuracy,
        responseRelevance,
        conversationFlow,
        userEngagement,
        resolutionRate
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de qualidade:', error);
      return this.getDefaultQualityMetrics();
    }
  }

  /**
   * Calcula métricas de performance
   */
  private async calculatePerformanceMetrics(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceMetrics> {
    try {
      const { data: interactions, error } = await this.supabase
        .from('ai_interactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !interactions || interactions.length === 0) {
        return this.getDefaultPerformanceMetrics();
      }

      const responseTimes = interactions
        .map(i => i.response_time || 0)
        .filter(time => time > 0)
        .sort((a, b) => a - b);

      const responseTime = {
        p50: this.calculatePercentile(responseTimes, 50),
        p90: this.calculatePercentile(responseTimes, 90),
        p95: this.calculatePercentile(responseTimes, 95),
        p99: this.calculatePercentile(responseTimes, 99)
      };

      const throughput = this.calculateThroughput(interactions, startDate, endDate);
      const errorRate = this.calculateErrorRate(interactions);
      const availability = this.calculateAvailability(interactions);

      return {
        responseTime,
        throughput,
        errorRate,
        availability
      };
    } catch (error) {
      console.error('Erro ao calcular métricas de performance:', error);
      return this.getDefaultPerformanceMetrics();
    }
  }

  /**
   * Calcula comportamento do usuário
   */
  private async calculateUserBehavior(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UserBehavior> {
    try {
      const { data: interactions, error } = await this.supabase
        .from('ai_interactions')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !interactions || interactions.length === 0) {
        return this.getDefaultUserBehavior();
      }

      const sessionDuration = this.calculateSessionDuration(interactions);
      const messagesPerSession = this.calculateMessagesPerSession(interactions);
      const returnRate = this.calculateReturnRate(interactions);
      const peakUsageHours = this.calculatePeakUsageHours(interactions);
      const commonQueries = this.calculateCommonQueries(interactions);

      return {
        sessionDuration,
        messagesPerSession,
        returnRate,
        peakUsageHours,
        commonQueries
      };
    } catch (error) {
      console.error('Erro ao calcular comportamento do usuário:', error);
      return this.getDefaultUserBehavior();
    }
  }

  // Métodos auxiliares para cálculos específicos

  private calculateAverageResponseTime(interactions: any[], streamingMetrics?: any[]): number {
    const allTimes = [
      ...interactions.map(i => i.response_time || 0),
      ...(streamingMetrics?.map(s => s.response_time || 0) || [])
    ].filter(time => time > 0);

    return allTimes.length > 0 ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length : 0;
  }

  private calculateAverageConfidence(interactions: any[]): number {
    const confidences = interactions.map(i => i.confidence || 0).filter(c => c > 0);
    return confidences.length > 0 ? confidences.reduce((sum, c) => sum + c, 0) / confidences.length : 0;
  }

  private calculateTotalCost(interactions: any[], streamingMetrics?: any[]): number {
    const costs = [
      ...interactions.map(i => i.cost || 0),
      ...(streamingMetrics?.map(s => s.cost || 0) || [])
    ];
    return costs.reduce((sum, cost) => sum + cost, 0);
  }

  private calculateCacheHitRate(interactions: any[], cacheEntries?: any[]): number {
    if (!cacheEntries || cacheEntries.length === 0) return 0;
    
    const cacheHits = interactions.filter(i => i.cache_hit).length;
    return interactions.length > 0 ? cacheHits / interactions.length : 0;
  }

  private calculateEscalationRate(interactions: any[]): number {
    const escalations = interactions.filter(i => i.escalated).length;
    return interactions.length > 0 ? escalations / interactions.length : 0;
  }

  private calculateUserSatisfaction(interactions: any[]): number {
    const ratings = interactions.map(i => i.user_rating || 0).filter(r => r > 0);
    return ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0;
  }

  private calculateModelUsage(interactions: any[], streamingMetrics?: any[]): Record<string, number> {
    const allModels = [
      ...interactions.map(i => i.model_used || 'unknown'),
      ...(streamingMetrics?.map(s => s.model_used || 'unknown') || [])
    ];

    const usage: Record<string, number> = {};
    allModels.forEach(model => {
      usage[model] = (usage[model] || 0) + 1;
    });

    return usage;
  }

  private calculateIntentDistribution(interactions: any[]): Record<string, number> {
    const intents = interactions.map(i => i.intent || 'unknown');
    const distribution: Record<string, number> = {};
    
    intents.forEach(intent => {
      distribution[intent] = (distribution[intent] || 0) + 1;
    });

    return distribution;
  }

  private calculateErrorRate(interactions: any[]): number {
    const errors = interactions.filter(i => i.error).length;
    return interactions.length > 0 ? errors / interactions.length : 0;
  }

  private calculateMedicalAccuracy(interactions: any[]): number {
    const medicalInteractions = interactions.filter(i => i.medical_content);
    if (medicalInteractions.length === 0) return 0;

    const accurateResponses = medicalInteractions.filter(i => i.medical_accuracy === true).length;
    return accurateResponses / medicalInteractions.length;
  }

  private calculateResponseRelevance(interactions: any[]): number {
    const relevantResponses = interactions.filter(i => i.relevance_score).map(i => i.relevance_score);
    return relevantResponses.length > 0 ? relevantResponses.reduce((sum, score) => sum + score, 0) / relevantResponses.length : 0;
  }

  private calculateConversationFlow(interactions: any[]): number {
    // Agrupar por sessão e calcular fluxo
    const sessions = this.groupBySession(interactions);
    let totalFlowScore = 0;
    let sessionCount = 0;

    for (const session of Object.values(sessions)) {
      const flowScore = this.calculateSessionFlowScore(session);
      totalFlowScore += flowScore;
      sessionCount++;
    }

    return sessionCount > 0 ? totalFlowScore / sessionCount : 0;
  }

  private calculateUserEngagement(interactions: any[]): number {
    const engagementScores = interactions.map(i => i.engagement_score || 0).filter(s => s > 0);
    return engagementScores.length > 0 ? engagementScores.reduce((sum, score) => sum + score, 0) / engagementScores.length : 0;
  }

  private calculateResolutionRate(interactions: any[]): number {
    const resolvedInteractions = interactions.filter(i => i.resolved).length;
    return interactions.length > 0 ? resolvedInteractions / interactions.length : 0;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private calculateThroughput(interactions: any[], startDate: Date, endDate: Date): number {
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    return durationHours > 0 ? interactions.length / durationHours : 0;
  }

  private calculateAvailability(interactions: any[]): number {
    const totalTime = 24 * 60 * 60 * 1000; // 24 horas em ms
    const downtime = interactions.filter(i => i.error).length * 1000; // Assumindo 1s de downtime por erro
    return Math.max(0, (totalTime - downtime) / totalTime);
  }

  private calculateSessionDuration(interactions: any[]): number {
    const sessions = this.groupBySession(interactions);
    const durations = Object.values(sessions).map(session => {
      const timestamps = session.map(i => new Date(i.timestamp).getTime()).sort((a, b) => a - b);
      return timestamps.length > 1 ? timestamps[timestamps.length - 1] - timestamps[0] : 0;
    });

    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  private calculateMessagesPerSession(interactions: any[]): number {
    const sessions = this.groupBySession(interactions);
    const messageCounts = Object.values(sessions).map(session => session.length);
    return messageCounts.length > 0 ? messageCounts.reduce((sum, count) => sum + count, 0) / messageCounts.length : 0;
  }

  private calculateReturnRate(interactions: any[]): number {
    const uniqueUsers = new Set(interactions.map(i => i.user_id));
    const returningUsers = new Set();
    
    // Agrupar por usuário e verificar retornos
    const userInteractions = this.groupByUser(interactions);
    for (const [userId, userInteractions] of Object.entries(userInteractions)) {
      const sessions = this.groupBySession(userInteractions);
      if (Object.keys(sessions).length > 1) {
        returningUsers.add(userId);
      }
    }

    return uniqueUsers.size > 0 ? returningUsers.size / uniqueUsers.size : 0;
  }

  private calculatePeakUsageHours(interactions: any[]): number[] {
    const hourCounts = new Array(24).fill(0);
    
    interactions.forEach(interaction => {
      const hour = new Date(interaction.timestamp).getHours();
      hourCounts[hour]++;
    });

    const maxCount = Math.max(...hourCounts);
    return hourCounts.map((count, hour) => count === maxCount ? hour : -1).filter(hour => hour !== -1);
  }

  private calculateCommonQueries(interactions: any[]): Array<{ query: string; count: number }> {
    const queryCounts: Record<string, number> = {};
    
    interactions.forEach(interaction => {
      const query = interaction.message || '';
      queryCounts[query] = (queryCounts[query] || 0) + 1;
    });

    return Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private groupBySession(interactions: any[]): Record<string, any[]> {
    const sessions: Record<string, any[]> = {};
    
    interactions.forEach(interaction => {
      const sessionId = interaction.session_id || interaction.user_id;
      if (!sessions[sessionId]) {
        sessions[sessionId] = [];
      }
      sessions[sessionId].push(interaction);
    });

    return sessions;
  }

  private groupByUser(interactions: any[]): Record<string, any[]> {
    const users: Record<string, any[]> = {};
    
    interactions.forEach(interaction => {
      const userId = interaction.user_id;
      if (!users[userId]) {
        users[userId] = [];
      }
      users[userId].push(interaction);
    });

    return users;
  }

  private calculateSessionFlowScore(session: any[]): number {
    // Implementar lógica de cálculo de fluxo da sessão
    // Por enquanto, retorna um valor baseado no número de interações
    return Math.min(session.length / 10, 1);
  }

  private generateRecommendations(
    metrics: AnalyticsMetrics,
    quality: QualityMetrics,
    performance: PerformanceMetrics,
    userBehavior: UserBehavior
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em métricas
    if (metrics.cacheHitRate < 0.3) {
      recommendations.push('Considere expandir o cache semântico para reduzir custos');
    }

    if (metrics.escalationRate > 0.2) {
      recommendations.push('Melhore a precisão do modelo para reduzir escalações');
    }

    if (quality.medicalAccuracy < 0.8) {
      recommendations.push('Implemente validação médica mais rigorosa');
    }

    if (performance.responseTime.p95 > 5000) {
      recommendations.push('Otimize a performance do modelo para reduzir latência');
    }

    if (userBehavior.returnRate < 0.5) {
      recommendations.push('Melhore a experiência do usuário para aumentar retenção');
    }

    if (metrics.totalCost > 100) {
      recommendations.push('Implemente rate limiting mais agressivo para controlar custos');
    }

    return recommendations;
  }

  // Métodos de fallback
  private getDefaultMetrics(): AnalyticsMetrics {
    return {
      totalInteractions: 0,
      averageResponseTime: 0,
      averageConfidence: 0,
      totalCost: 0,
      cacheHitRate: 0,
      escalationRate: 0,
      userSatisfaction: 0,
      modelUsage: {},
      intentDistribution: {},
      errorRate: 0
    };
  }

  private getDefaultQualityMetrics(): QualityMetrics {
    return {
      medicalAccuracy: 0,
      responseRelevance: 0,
      conversationFlow: 0,
      userEngagement: 0,
      resolutionRate: 0
    };
  }

  private getDefaultPerformanceMetrics(): PerformanceMetrics {
    return {
      responseTime: { p50: 0, p90: 0, p95: 0, p99: 0 },
      throughput: 0,
      errorRate: 0,
      availability: 1
    };
  }

  private getDefaultUserBehavior(): UserBehavior {
    return {
      sessionDuration: 0,
      messagesPerSession: 0,
      returnRate: 0,
      peakUsageHours: [],
      commonQueries: []
    };
  }
} 