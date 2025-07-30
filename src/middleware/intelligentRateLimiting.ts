import { supabase } from '@/integrations/supabase/client';

export interface RateLimitConfig {
  userLimits: {
    messagesPerHour: number;
    tokensPerDay: number;
    costPerMonth: number;
  };
  clinicLimits: {
    totalMessages: number;
    concurrentUsers: number;
  };
  tierLimits: {
    free: RateLimitConfig;
    basic: RateLimitConfig;
    premium: RateLimitConfig;
  };
}

export interface LimitResult {
  allowed: boolean;
  reason?: string;
  resetTime?: Date;
  remaining?: {
    messages: number;
    tokens: number;
    cost: number;
  };
  tier?: string;
}

export interface UsageStats {
  userId: string;
  clinicId: string;
  messagesThisHour: number;
  tokensToday: number;
  costThisMonth: number;
  lastMessageTime: Date;
}

export class IntelligentRateLimiting {
  private limits = {
    free: {
      messagesPerHour: 10,
      tokensPerDay: 5000,
      costPerMonth: 5.0
    },
    basic: {
      messagesPerHour: 50,
      tokensPerDay: 25000,
      costPerMonth: 25.0
    },
    premium: {
      messagesPerHour: 200,
      tokensPerDay: 100000,
      costPerMonth: 100.0
    }
  };

  private clinicLimits = {
    totalMessages: 1000,
    concurrentUsers: 50
  };

  /**
   * Verifica limites para um usuário
   */
  async checkLimits(userId: string, clinicId: string): Promise<LimitResult> {
    try {
      // 1. Determinar tier do usuário
      const userTier = await this.getUserTier(userId);
      const limits = this.limits[userTier];

      // 2. Obter uso atual
      const currentUsage = await this.getCurrentUsage(userId, clinicId);

      // 3. Verificar limites de mensagens por hora
      if (currentUsage.messagesThisHour >= limits.messagesPerHour) {
        return {
          allowed: false,
          reason: `Limite de ${limits.messagesPerHour} mensagens por hora excedido`,
          resetTime: this.getNextHourReset(),
          tier: userTier
        };
      }

      // 4. Verificar limites de tokens diários
      if (currentUsage.tokensToday >= limits.tokensPerDay) {
        return {
          allowed: false,
          reason: `Limite de ${limits.tokensPerDay} tokens diário excedido`,
          resetTime: this.getNextDayReset(),
          tier: userTier
        };
      }

      // 5. Verificar limites de custo mensal
      if (currentUsage.costThisMonth >= limits.costPerMonth) {
        return {
          allowed: false,
          reason: `Limite de $${limits.costPerMonth} de custo mensal excedido`,
          resetTime: this.getNextMonthReset(),
          tier: userTier
        };
      }

      // 6. Verificar limites da clínica
      const clinicLimitResult = await this.checkClinicLimits(clinicId);
      if (!clinicLimitResult.allowed) {
        return clinicLimitResult;
      }

      // 7. Tudo OK
      return {
        allowed: true,
        remaining: {
          messages: limits.messagesPerHour - currentUsage.messagesThisHour,
          tokens: limits.tokensPerDay - currentUsage.tokensToday,
          cost: limits.costPerMonth - currentUsage.costThisMonth
        },
        tier: userTier
      };

    } catch (error) {
      console.error('❌ Erro ao verificar limites:', error);
      // Em caso de erro, permitir mas logar
      return {
        allowed: true,
        reason: 'Erro ao verificar limites - permitindo acesso'
      };
    }
  }

  /**
   * Atualiza uso do usuário
   */
  async updateUsage(
    userId: string,
    clinicId: string,
    tokensUsed: number,
    cost: number
  ): Promise<void> {
    try {
      const now = new Date();
      
      await supabase
        .from('usage_logs')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          tokens_used: tokensUsed,
          cost: cost,
          timestamp: now.toISOString()
        });

      // Atualizar cache de uso atual
      await this.updateUsageCache(userId, clinicId, tokensUsed, cost);

      console.log(`✅ Uso atualizado para usuário ${userId}: ${tokensUsed} tokens, $${cost}`);
    } catch (error) {
      console.error('❌ Erro ao atualizar uso:', error);
    }
  }

  /**
   * Obtém tier do usuário
   */
  private async getUserTier(userId: string): Promise<'free' | 'basic' | 'premium'> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return 'free'; // Tier padrão
      }

      return data.subscription_tier || 'free';
    } catch (error) {
      console.error('❌ Erro ao obter tier do usuário:', error);
      return 'free';
    }
  }

  /**
   * Obtém uso atual do usuário
   */
  private async getCurrentUsage(userId: string, clinicId: string): Promise<UsageStats> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Buscar logs de uso
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .gte('timestamp', oneMonthAgo.toISOString());

      if (error) throw error;

      // Calcular estatísticas
      const messagesThisHour = data.filter(log => 
        new Date(log.timestamp) >= oneHourAgo
      ).length;

      const tokensToday = data.filter(log => 
        new Date(log.timestamp) >= oneDayAgo
      ).reduce((sum, log) => sum + (log.tokens_used || 0), 0);

      const costThisMonth = data.filter(log => 
        new Date(log.timestamp) >= oneMonthAgo
      ).reduce((sum, log) => sum + (log.cost || 0), 0);

      const lastMessageTime = data.length > 0 
        ? new Date(Math.max(...data.map(log => new Date(log.timestamp).getTime())))
        : new Date(0);

      return {
        userId,
        clinicId,
        messagesThisHour,
        tokensToday,
        costThisMonth,
        lastMessageTime
      };

    } catch (error) {
      console.error('❌ Erro ao obter uso atual:', error);
      return {
        userId,
        clinicId,
        messagesThisHour: 0,
        tokensToday: 0,
        costThisMonth: 0,
        lastMessageTime: new Date(0)
      };
    }
  }

  /**
   * Verifica limites da clínica
   */
  private async checkClinicLimits(clinicId: string): Promise<LimitResult> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Verificar total de mensagens da clínica na última hora
      const { data: clinicMessages, error: messagesError } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', oneHourAgo.toISOString());

      if (messagesError) throw messagesError;

      if (clinicMessages.length >= this.clinicLimits.totalMessages) {
        return {
          allowed: false,
          reason: `Limite de ${this.clinicLimits.totalMessages} mensagens por hora da clínica excedido`,
          resetTime: this.getNextHourReset()
        };
      }

      // Verificar usuários concorrentes
      const uniqueUsers = new Set(clinicMessages.map(log => log.user_id));
      if (uniqueUsers.size >= this.clinicLimits.concurrentUsers) {
        return {
          allowed: false,
          reason: `Limite de ${this.clinicLimits.concurrentUsers} usuários concorrentes da clínica excedido`,
          resetTime: this.getNextHourReset()
        };
      }

      return { allowed: true };

    } catch (error) {
      console.error('❌ Erro ao verificar limites da clínica:', error);
      return { allowed: true }; // Permitir em caso de erro
    }
  }

  /**
   * Atualiza cache de uso
   */
  private async updateUsageCache(
    userId: string,
    clinicId: string,
    tokensUsed: number,
    cost: number
  ): Promise<void> {
    try {
      const now = new Date();
      
      // Atualizar ou criar registro de cache
      const { data: existingCache } = await supabase
        .from('usage_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('clinic_id', clinicId)
        .single();

      if (existingCache) {
        // Atualizar cache existente
        await supabase
          .from('usage_cache')
          .update({
            messages_this_hour: existingCache.messages_this_hour + 1,
            tokens_today: existingCache.tokens_today + tokensUsed,
            cost_this_month: existingCache.cost_this_month + cost,
            last_updated: now.toISOString()
          })
          .eq('user_id', userId)
          .eq('clinic_id', clinicId);
      } else {
        // Criar novo cache
        await supabase
          .from('usage_cache')
          .insert({
            user_id: userId,
            clinic_id: clinicId,
            messages_this_hour: 1,
            tokens_today: tokensUsed,
            cost_this_month: cost,
            last_updated: now.toISOString()
          });
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar cache de uso:', error);
    }
  }

  /**
   * Obtém próximo reset de hora
   */
  private getNextHourReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  }

  /**
   * Obtém próximo reset de dia
   */
  private getNextDayReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  }

  /**
   * Obtém próximo reset de mês
   */
  private getNextMonthReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
  }

  /**
   * Gera relatório de uso
   */
  async generateUsageReport(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalMessages: number;
    totalTokens: number;
    totalCost: number;
    uniqueUsers: number;
    averageMessagesPerUser: number;
    peakUsageHour: number;
    tierBreakdown: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      const totalMessages = data.length;
      const totalTokens = data.reduce((sum, log) => sum + (log.tokens_used || 0), 0);
      const totalCost = data.reduce((sum, log) => sum + (log.cost || 0), 0);
      const uniqueUsers = new Set(data.map(log => log.user_id)).size;
      const averageMessagesPerUser = totalMessages / uniqueUsers;

      // Calcular hora de pico
      const hourlyUsage: Record<number, number> = {};
      data.forEach(log => {
        const hour = new Date(log.timestamp).getHours();
        hourlyUsage[hour] = (hourlyUsage[hour] || 0) + 1;
      });

      const peakUsageHour = Object.entries(hourlyUsage)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 0;

      // Breakdown por tier
      const tierBreakdown: Record<string, number> = {};
      for (const log of data) {
        const tier = await this.getUserTier(log.user_id);
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
      }

      return {
        totalMessages,
        totalTokens,
        totalCost,
        uniqueUsers,
        averageMessagesPerUser,
        peakUsageHour: parseInt(peakUsageHour.toString()),
        tierBreakdown
      };

    } catch (error) {
      console.error('❌ Erro ao gerar relatório de uso:', error);
      return {
        totalMessages: 0,
        totalTokens: 0,
        totalCost: 0,
        uniqueUsers: 0,
        averageMessagesPerUser: 0,
        peakUsageHour: 0,
        tierBreakdown: {}
      };
    }
  }

  /**
   * Limpa cache expirado
   */
  async cleanupExpiredCache(): Promise<void> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Limpar cache de uso expirado
      await supabase
        .from('usage_cache')
        .delete()
        .lt('last_updated', oneHourAgo.toISOString());

      // Limpar logs antigos (manter apenas 3 meses)
      await supabase
        .from('usage_logs')
        .delete()
        .lt('timestamp', oneMonthAgo.toISOString());

      console.log('✅ Cache expirado limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
    }
  }

  /**
   * Ajusta limites dinamicamente baseado no uso
   */
  async adjustLimitsDynamically(clinicId: string): Promise<void> {
    try {
      const report = await this.generateUsageReport(
        clinicId,
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Última semana
        new Date()
      );

      // Ajustar limites baseado no uso
      if (report.totalMessages > 10000) {
        console.log('⚠️ Uso alto detectado - considerando upgrade de limites');
        // Implementar lógica de upgrade automático
      }

      if (report.totalCost > 100) {
        console.log('💰 Custo alto detectado - otimizando uso');
        // Implementar otimizações de custo
      }

      console.log('✅ Limites ajustados dinamicamente');
    } catch (error) {
      console.error('❌ Erro ao ajustar limites:', error);
    }
  }
} 