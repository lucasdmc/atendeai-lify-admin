import { supabase } from '@/integrations/supabase/client';

export interface ConfidenceScore {
  overall: number;
  intent: number;
  quality: number;
  relevance: number;
  shouldEscalate: boolean;
  reasoning: string;
  factors: ConfidenceFactors;
}

export interface ConfidenceFactors {
  intentAccuracy: number;
  responseQuality: number;
  contextRelevance: number;
  userHistory: number;
  medicalContent: number;
  emotionalState: number;
}

export interface IntentResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  reasoning?: string;
}

export interface ConversationContext {
  userId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  userProfile?: {
    previousAppointments: number;
    totalConversations: number;
    averageSatisfaction: number;
  };
  clinicContext?: {
    services: string[];
    doctors: string[];
    policies: Record<string, any>;
  };
}

export class ConfidenceService {
  private readonly escalationThreshold = 0.7;
  private readonly qualityThreshold = 0.6;
  private readonly relevanceThreshold = 0.5;

  /**
   * Calcula confidence score completo para uma resposta
   */
  async calculateConfidence(
    response: string,
    intent: IntentResult,
    context: ConversationContext
  ): Promise<ConfidenceScore> {
    
    // 1. Avaliar confiança da intenção
    const intentConfidence = intent.confidence;

    // 2. Avaliar qualidade da resposta
    const responseQuality = await this.assessResponseQuality(response, intent);

    // 3. Avaliar relevância do contexto
    const contextRelevance = await this.assessContextRelevance(response, context);

    // 4. Avaliar histórico do usuário
    const userHistoryScore = await this.assessUserHistory(context.userId);

    // 5. Avaliar conteúdo médico
    const medicalContentScore = await this.assessMedicalContent(response);

    // 6. Avaliar estado emocional
    const emotionalStateScore = await this.assessEmotionalState(context.conversationHistory);

    // 7. Calcular confidence geral
    const overallConfidence = this.calculateOverallConfidence({
      intentAccuracy: intentConfidence,
      responseQuality,
      contextRelevance,
      userHistory: userHistoryScore,
      medicalContent: medicalContentScore,
      emotionalState: emotionalStateScore
    });

    // 8. Determinar se deve escalar
    const shouldEscalate = this.shouldEscalateBasedOnConfidence(overallConfidence, {
      intentConfidence,
      responseQuality,
      contextRelevance,
      medicalContent: medicalContentScore,
      emotionalState: emotionalStateScore
    });

    // 9. Gerar reasoning
    const reasoning = this.generateConfidenceReasoning(overallConfidence, {
      intentAccuracy: intentConfidence,
      responseQuality,
      contextRelevance,
      userHistory: userHistoryScore,
      medicalContent: medicalContentScore,
      emotionalState: emotionalStateScore
    });

    return {
      overall: overallConfidence,
      intent: intentConfidence,
      quality: responseQuality,
      relevance: contextRelevance,
      shouldEscalate,
      reasoning,
      factors: {
        intentAccuracy: intentConfidence,
        responseQuality,
        contextRelevance,
        userHistory: userHistoryScore,
        medicalContent: medicalContentScore,
        emotionalState: emotionalStateScore
      }
    };
  }

  /**
   * Avalia qualidade da resposta usando modelo secundário
   */
  private async assessResponseQuality(
    response: string,
    intent: IntentResult
  ): Promise<number> {
    try {
      // Usar modelo secundário para avaliar qualidade
      const { data, error } = await supabase.functions.invoke('ai-quality-assessment', {
        body: {
          response,
          intent: intent.intent,
          criteria: ['relevance', 'completeness', 'clarity', 'appropriateness']
        }
      });

      if (error || !data) {
        // Fallback: avaliação baseada em heurísticas
        return this.fallbackQualityAssessment(response, intent);
      }

      return data.qualityScore || 0.8;
    } catch (error) {
      console.error('❌ Erro ao avaliar qualidade da resposta:', error);
      return this.fallbackQualityAssessment(response, intent);
    }
  }

  /**
   * Avaliação de qualidade baseada em heurísticas (fallback)
   */
  private fallbackQualityAssessment(response: string, intent: IntentResult): number {
    let score = 0.8; // Score base

    // Verificar se a resposta é muito curta
    if (response.length < 10) {
      score -= 0.3;
    }

    // Verificar se a resposta é muito longa
    if (response.length > 500) {
      score -= 0.2;
    }

    // Verificar se contém palavras-chave relevantes para a intenção
    const relevantKeywords = this.getRelevantKeywords(intent.intent);
    const hasRelevantKeywords = relevantKeywords.some(keyword => 
      response.toLowerCase().includes(keyword)
    );

    if (hasRelevantKeywords) {
      score += 0.1;
    }

    // Verificar se contém informações específicas
    if (response.includes('agendamento') || response.includes('consulta')) {
      score += 0.1;
    }

    // Verificar se contém tom profissional
    const professionalTone = this.assessProfessionalTone(response);
    if (professionalTone) {
      score += 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Avalia relevância do contexto
   */
  private async assessContextRelevance(
    response: string,
    context: ConversationContext
  ): Promise<number> {
    let score = 0.8; // Score base

    // Verificar se a resposta menciona serviços da clínica
    if (context.clinicContext?.services) {
      const mentionsClinicServices = context.clinicContext.services.some(service =>
        response.toLowerCase().includes(service.toLowerCase())
      );
      if (mentionsClinicServices) {
        score += 0.1;
      }
    }

    // Verificar se a resposta é consistente com histórico
    if (context.conversationHistory.length > 0) {
      const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];
      const isConsistent = this.checkConversationConsistency(response, lastMessage.content);
      if (isConsistent) {
        score += 0.1;
      } else {
        score -= 0.2;
      }
    }

    // Verificar se a resposta é apropriada para o perfil do usuário
    if (context.userProfile) {
      const isAppropriateForUser = this.assessUserAppropriateness(response, context.userProfile);
      if (isAppropriateForUser) {
        score += 0.1;
      } else {
        score -= 0.1;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Avalia histórico do usuário
   */
  private async assessUserHistory(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('satisfaction_score, escalation_count, total_messages')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !data || data.length === 0) {
        return 0.5; // Score neutro para usuários novos
      }

      const avgSatisfaction = data.reduce((sum, conv) => sum + (conv.satisfaction_score || 0), 0) / data.length;
      const totalEscalations = data.reduce((sum, conv) => sum + (conv.escalation_count || 0), 0);
      const totalMessages = data.reduce((sum, conv) => sum + (conv.total_messages || 0), 0);

      let score = 0.5;

      // Ajustar baseado na satisfação média
      if (avgSatisfaction > 4) {
        score += 0.2;
      } else if (avgSatisfaction < 3) {
        score -= 0.2;
      }

      // Ajustar baseado na frequência de escalações
      const escalationRate = totalEscalations / totalMessages;
      if (escalationRate > 0.3) {
        score -= 0.3;
      } else if (escalationRate < 0.1) {
        score += 0.1;
      }

      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('❌ Erro ao avaliar histórico do usuário:', error);
      return 0.5;
    }
  }

  /**
   * Avalia conteúdo médico na resposta
   */
  private async assessMedicalContent(response: string): Promise<number> {
    const medicalKeywords = [
      'diagnóstico', 'medicamento', 'dosagem', 'prescrição',
      'tratamento', 'sintoma', 'doença', 'exame'
    ];

    const containsMedicalContent = medicalKeywords.some(keyword =>
      response.toLowerCase().includes(keyword)
    );

    // Se contém conteúdo médico, score baixo (requer validação humana)
    return containsMedicalContent ? 0.2 : 0.8;
  }

  /**
   * Avalia estado emocional do usuário
   */
  private async assessEmotionalState(
    conversationHistory: Array<{ role: string; content: string; timestamp: Date }>
  ): Promise<number> {
    if (conversationHistory.length === 0) {
      return 0.8; // Score neutro
    }

    const recentMessages = conversationHistory
      .filter(msg => msg.role === 'user')
      .slice(-3); // Últimas 3 mensagens do usuário

    let emotionalScore = 0.8;

    for (const message of recentMessages) {
      const emotionalIndicators = this.detectEmotionalIndicators(message.content);
      
      if (emotionalIndicators.frustration > 0.7 || emotionalIndicators.anger > 0.7) {
        emotionalScore -= 0.3;
      } else if (emotionalIndicators.anxiety > 0.7) {
        emotionalScore -= 0.2;
      } else if (emotionalIndicators.satisfaction > 0.7) {
        emotionalScore += 0.1;
      }
    }

    return Math.max(0, Math.min(1, emotionalScore));
  }

  /**
   * Calcula confidence geral baseado em múltiplos fatores
   */
  private calculateOverallConfidence(factors: ConfidenceFactors): number {
    const weights = {
      intentAccuracy: 0.3,
      responseQuality: 0.25,
      contextRelevance: 0.2,
      userHistory: 0.1,
      medicalContent: 0.1,
      emotionalState: 0.05
    };

    const weightedSum = Object.entries(weights).reduce((sum, [factor, weight]) => {
      return sum + (factors[factor as keyof ConfidenceFactors] * weight);
    }, 0);

    return Math.max(0, Math.min(1, weightedSum));
  }

  /**
   * Determina se deve escalar baseado no confidence
   */
  private shouldEscalateBasedOnConfidence(
    overallConfidence: number,
    factors: Partial<ConfidenceFactors>
  ): boolean {
    // Escalar se confidence geral é baixo
    if (overallConfidence < this.escalationThreshold) {
      return true;
    }

    // Escalar se conteúdo médico é detectado
    if (factors.medicalContent && factors.medicalContent < 0.3) {
      return true;
    }

    // Escalar se estado emocional indica frustração
    if (factors.emotionalState && factors.emotionalState < 0.4) {
      return true;
    }

    // Escalar se qualidade da resposta é muito baixa
    if (factors.responseQuality && factors.responseQuality < this.qualityThreshold) {
      return true;
    }

    return false;
  }

  /**
   * Gera reasoning para o confidence score
   */
  private generateConfidenceReasoning(
    overallConfidence: number,
    factors: ConfidenceFactors
  ): string {
    const reasons: string[] = [];

    if (factors.intentAccuracy < 0.6) {
      reasons.push('Intenção do usuário não clara');
    }

    if (factors.responseQuality < this.qualityThreshold) {
      reasons.push('Qualidade da resposta abaixo do esperado');
    }

    if (factors.contextRelevance < this.relevanceThreshold) {
      reasons.push('Resposta não totalmente relevante ao contexto');
    }

    if (factors.medicalContent < 0.3) {
      reasons.push('Conteúdo médico detectado - requer validação');
    }

    if (factors.emotionalState < 0.4) {
      reasons.push('Estado emocional do usuário indica necessidade de atenção especial');
    }

    if (reasons.length === 0) {
      return `Confidence alto (${(overallConfidence * 100).toFixed(1)}%) - resposta adequada`;
    }

    return `Confidence ${(overallConfidence * 100).toFixed(1)}% - ${reasons.join(', ')}`;
  }

  /**
   * Obtém palavras-chave relevantes para cada intenção
   */
  private getRelevantKeywords(intent: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'APPOINTMENT_CREATE': ['agendar', 'consulta', 'marcar', 'horário', 'data'],
      'INFO_SERVICES': ['serviços', 'especialidades', 'consultas', 'exames'],
      'INFO_HOURS': ['horário', 'funcionamento', 'aberto', 'fechado'],
      'INFO_LOCATION': ['endereço', 'localização', 'onde', 'lugar'],
      'GREETING': ['olá', 'oi', 'bom dia', 'boa tarde', 'boa noite']
    };

    return keywordMap[intent] || [];
  }

  /**
   * Avalia tom profissional da resposta
   */
  private assessProfessionalTone(response: string): boolean {
    const professionalIndicators = [
      'por favor', 'obrigado', 'agradeço', 'disponível',
      'posso ajudar', 'como posso', 'gostaria de'
    ];

    const unprofessionalIndicators = [
      'cara', 'mano', 'beleza', 'tranquilo', 'suave'
    ];

    const hasProfessional = professionalIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );

    const hasUnprofessional = unprofessionalIndicators.some(indicator =>
      response.toLowerCase().includes(indicator)
    );

    return hasProfessional && !hasUnprofessional;
  }

  /**
   * Verifica consistência da conversa
   */
  private checkConversationConsistency(response: string, lastUserMessage: string): boolean {
    // Verificar se a resposta faz sentido em relação à última mensagem do usuário
    const lastMessageLower = lastUserMessage.toLowerCase();
    const responseLower = response.toLowerCase();

    // Se o usuário perguntou sobre agendamento, a resposta deve mencionar agendamento
    if (lastMessageLower.includes('agendar') || lastMessageLower.includes('consulta')) {
      return responseLower.includes('agendar') || responseLower.includes('consulta') || 
             responseLower.includes('horário') || responseLower.includes('data');
    }

    // Se o usuário perguntou sobre serviços, a resposta deve mencionar serviços
    if (lastMessageLower.includes('serviço') || lastMessageLower.includes('especialidade')) {
      return responseLower.includes('serviço') || responseLower.includes('especialidade');
    }

    // Se o usuário perguntou sobre horários, a resposta deve mencionar horários
    if (lastMessageLower.includes('horário') || lastMessageLower.includes('funcionamento')) {
      return responseLower.includes('horário') || responseLower.includes('funcionamento');
    }

    return true; // Se não há contexto específico, assume consistente
  }

  /**
   * Avalia se a resposta é apropriada para o perfil do usuário
   */
  private assessUserAppropriateness(
    response: string,
    userProfile: { previousAppointments: number; totalConversations: number; averageSatisfaction: number }
  ): boolean {
    // Usuários com mais experiência podem receber respostas mais detalhadas
    if (userProfile.previousAppointments > 5) {
      return response.length > 50; // Resposta mais detalhada
    }

    // Usuários novos devem receber respostas mais simples
    if (userProfile.previousAppointments === 0) {
      return response.length < 200 && !response.includes('especialidade'); // Resposta simples
    }

    return true;
  }

  /**
   * Detecta indicadores emocionais no texto
   */
  private detectEmotionalIndicators(text: string): {
    frustration: number;
    anger: number;
    anxiety: number;
    satisfaction: number;
  } {
    const lowerText = text.toLowerCase();

    const frustrationIndicators = ['frustrado', 'irritado', 'cansado', 'chateado'];
    const angerIndicators = ['raiva', 'irritado', 'nervoso', 'pessimo'];
    const anxietyIndicators = ['ansioso', 'preocupado', 'nervoso', 'urgente'];
    const satisfactionIndicators = ['obrigado', 'valeu', 'otimo', 'perfeito'];

    const frustration = this.calculateEmotionalScore(lowerText, frustrationIndicators);
    const anger = this.calculateEmotionalScore(lowerText, angerIndicators);
    const anxiety = this.calculateEmotionalScore(lowerText, anxietyIndicators);
    const satisfaction = this.calculateEmotionalScore(lowerText, satisfactionIndicators);

    return { frustration, anger, anxiety, satisfaction };
  }

  /**
   * Calcula score emocional baseado em indicadores
   */
  private calculateEmotionalScore(text: string, indicators: string[]): number {
    const matches = indicators.filter(indicator => text.includes(indicator));
    return Math.min(1, matches.length / indicators.length);
  }
} 