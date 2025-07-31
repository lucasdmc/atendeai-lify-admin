import { createClient } from '@supabase/supabase-js';

interface EmotionAnalysis {
  primaryEmotion: EmotionType;
  secondaryEmotion?: EmotionType;
  confidence: number;
  intensity: number; // 0-1
  triggers: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  recommendations: string[];
}

type EmotionType = 
  | 'joy' | 'satisfaction' | 'excitement' | 'gratitude'
  | 'frustration' | 'anger' | 'anxiety' | 'confusion'
  | 'sadness' | 'disappointment' | 'worry' | 'impatience'
  | 'calm' | 'neutral' | 'curiosity' | 'surprise';

interface EmotionContext {
  previousEmotions: EmotionAnalysis[];
  conversationHistory: string[];
  userProfile: {
    age?: number;
    gender?: string;
    medicalHistory?: string[];
    previousInteractions?: number;
  };
  clinicContext: {
    specialty: string;
    services: string[];
    policies: string[];
  };
}

export class EmotionDetectionService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private emotionKeywords: Record<EmotionType, string[]> = {
    joy: ['feliz', 'alegre', 'satisfeito', 'ótimo', 'maravilhoso', 'perfeito', 'gratidão', 'obrigado'],
    satisfaction: ['satisfeito', 'conforme', 'bom', 'ok', 'aceitável', 'adequado'],
    excitement: ['empolgado', 'animado', 'ansioso', 'esperançoso', 'entusiasmado'],
    gratitude: ['obrigado', 'gratidão', 'agradecido', 'valeu', 'muito obrigado'],
    
    frustration: ['frustrado', 'irritado', 'chateado', 'cansado', 'estressado'],
    anger: ['irritado', 'bravo', 'furioso', 'revoltado', 'indignado', 'péssimo'],
    anxiety: ['ansioso', 'preocupado', 'nervoso', 'tenso', 'inquieto'],
    confusion: ['confuso', 'perdido', 'não entendo', 'dúvida', 'incerto'],
    
    sadness: ['triste', 'deprimido', 'desanimado', 'melancólico', 'chateado'],
    disappointment: ['decepcionado', 'frustrado', 'insatisfeito', 'desapontado'],
    worry: ['preocupado', 'inquieto', 'nervoso', 'ansioso', 'tenso'],
    impatience: ['impaciente', 'apressado', 'urgente', 'rápido', 'agora'],
    
    calm: ['tranquilo', 'calmo', 'sereno', 'paciente', 'relaxado'],
    neutral: ['ok', 'certo', 'entendi', 'beleza', 'tudo bem'],
    curiosity: ['curioso', 'interessante', 'como', 'quando', 'onde', 'por que'],
    surprise: ['surpreso', 'incrível', 'nossa', 'uau', 'impressionante']
  };

  private emotionIntensifiers: string[] = [
    'muito', 'extremamente', 'totalmente', 'completamente', 'absolutamente',
    'realmente', 'verdadeiramente', 'profundamente', 'intensamente'
  ];

  private urgencyIndicators: Record<string, number> = {
    'urgente': 0.9,
    'emergência': 0.95,
    'agora': 0.8,
    'imediatamente': 0.85,
    'rápido': 0.7,
    'preciso': 0.6,
    'importante': 0.5
  };

  /**
   * Analisa emoções do texto do usuário
   */
  async analyzeEmotion(
    text: string,
    context: EmotionContext
  ): Promise<EmotionAnalysis> {
    try {
      // Análise local com keywords
      const localAnalysis = this.performLocalAnalysis(text);
      
      // Análise com IA para maior precisão
      const aiAnalysis = await this.performAIAnalysis(text, context);
      
      // Combinar análises
      const combinedAnalysis = this.combineAnalyses(localAnalysis, aiAnalysis);
      
      // Aplicar contexto clínico
      const contextualizedAnalysis = this.applyClinicalContext(combinedAnalysis, context);
      
      // Salvar análise
      await this.saveEmotionAnalysis(text, contextualizedAnalysis, context);
      
      return contextualizedAnalysis;
    } catch (error) {
      console.error('Erro na análise de emoção:', error);
      return this.getDefaultEmotionAnalysis();
    }
  }

  /**
   * Análise local baseada em keywords
   */
  private performLocalAnalysis(text: string): EmotionAnalysis {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    const emotionScores: Record<EmotionType, number> = {} as Record<EmotionType, number>;
    
    // Inicializar scores
    Object.keys(this.emotionKeywords).forEach(emotion => {
      emotionScores[emotion as EmotionType] = 0;
    });
    
    // Calcular scores por keyword
    words.forEach(word => {
      Object.entries(this.emotionKeywords).forEach(([emotion, keywords]) => {
        if (keywords.some(keyword => word.includes(keyword))) {
          emotionScores[emotion as EmotionType] += 1;
        }
      });
    });
    
    // Verificar intensificadores
    const intensifierCount = this.emotionIntensifiers.filter(intensifier => 
      lowerText.includes(intensifier)
    ).length;
    
    // Calcular urgência
    const urgencyScore = Object.entries(this.urgencyIndicators).reduce((max, [indicator, score]) => {
      return lowerText.includes(indicator) ? Math.max(max, score) : max;
    }, 0);
    
    // Encontrar emoção principal
    const primaryEmotion = Object.entries(emotionScores).reduce((max, [emotion, score]) => {
      return score > max.score ? { emotion: emotion as EmotionType, score } : max;
    }, { emotion: 'neutral' as EmotionType, score: 0 });
    
    // Encontrar emoção secundária
    const secondaryEmotion = Object.entries(emotionScores)
      .filter(([emotion, score]) => emotion !== primaryEmotion.emotion && score > 0)
      .sort(([,a], [,b]) => b - a)[0];
    
    const intensity = Math.min(primaryEmotion.score / 3 + intensifierCount * 0.2, 1);
    const confidence = Math.min(primaryEmotion.score / 2, 0.8);
    
    return {
      primaryEmotion: primaryEmotion.emotion,
      secondaryEmotion: secondaryEmotion ? secondaryEmotion[0] as EmotionType : undefined,
      confidence,
      intensity,
      triggers: this.extractTriggers(text),
      sentiment: this.determineSentiment(primaryEmotion.emotion),
      urgency: urgencyScore > 0.7 ? 'high' : urgencyScore > 0.4 ? 'medium' : 'low',
      recommendations: this.generateRecommendations(primaryEmotion.emotion, intensity, urgencyScore)
    };
  }

  /**
   * Análise com IA para maior precisão
   */
  private async performAIAnalysis(
    text: string,
    context: EmotionContext
  ): Promise<Partial<EmotionAnalysis>> {
    try {
      const prompt = this.buildEmotionAnalysisPrompt(text, context);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de emoções para contexto médico. Analise a emoção do usuário e retorne um JSON com: primaryEmotion, confidence (0-1), intensity (0-1), sentiment (positive/negative/neutral), urgency (low/medium/high)'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 200,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      return this.parseAIResponse(aiResponse);
    } catch (error) {
      console.error('Erro na análise de IA:', error);
      return {};
    }
  }

  /**
   * Constrói prompt para análise de IA
   */
  private buildEmotionAnalysisPrompt(text: string, context: EmotionContext): string {
    return `
Analise a emoção do usuário no contexto médico:

TEXTO: "${text}"

CONTEXTO CLÍNICO:
- Especialidade: ${context.clinicContext.specialty}
- Serviços: ${context.clinicContext.services.join(', ')}
- Histórico de interações: ${context.userProfile.previousInteractions || 0}

EMOÇÕES ANTERIORES: ${context.previousEmotions.map(e => e.primaryEmotion).join(', ')}

Retorne apenas um JSON válido com:
{
  "primaryEmotion": "emotion_type",
  "confidence": 0.85,
  "intensity": 0.7,
  "sentiment": "positive|negative|neutral",
  "urgency": "low|medium|high"
}
    `.trim();
  }

  /**
   * Parse da resposta da IA
   */
  private parseAIResponse(response: string): Partial<EmotionAnalysis> {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        primaryEmotion: parsed.primaryEmotion as EmotionType,
        confidence: parsed.confidence || 0.5,
        intensity: parsed.intensity || 0.5,
        sentiment: parsed.sentiment || 'neutral',
        urgency: parsed.urgency || 'low'
      };
    } catch (error) {
      console.error('Erro ao parsear resposta da IA:', error);
      return {};
    }
  }

  /**
   * Combina análises local e IA
   */
  private combineAnalyses(
    local: EmotionAnalysis,
    ai: Partial<EmotionAnalysis>
  ): EmotionAnalysis {
    // Se IA tem alta confiança, usar ela
    if (ai.confidence && ai.confidence > 0.7) {
      return {
        ...local,
        primaryEmotion: ai.primaryEmotion || local.primaryEmotion,
        confidence: ai.confidence,
        intensity: ai.intensity || local.intensity,
        sentiment: ai.sentiment || local.sentiment,
        urgency: ai.urgency || local.urgency
      };
    }
    
    // Caso contrário, usar análise local com ajustes
    return {
      ...local,
      confidence: Math.max(local.confidence, ai.confidence || 0),
      intensity: Math.max(local.intensity, ai.intensity || 0)
    };
  }

  /**
   * Aplica contexto clínico
   */
  private applyClinicalContext(
    analysis: EmotionAnalysis,
    context: EmotionContext
  ): EmotionAnalysis {
    const recommendations = [...analysis.recommendations];
    
    // Ajustar urgência baseado no contexto médico
    if (context.clinicContext.specialty === 'emergency' && analysis.urgency === 'low') {
      analysis.urgency = 'medium';
    }
    
    // Adicionar recomendações específicas da clínica
    if (analysis.primaryEmotion === 'frustration' || analysis.primaryEmotion === 'anger') {
      recommendations.push('Oferecer atendimento prioritário');
      recommendations.push('Demonstrar empatia e paciência');
    }
    
    if (analysis.primaryEmotion === 'anxiety' || analysis.primaryEmotion === 'worry') {
      recommendations.push('Explicar procedimentos detalhadamente');
      recommendations.push('Oferecer tranquilidade e segurança');
    }
    
    if (analysis.urgency === 'high') {
      recommendations.push('Acelerar processo de atendimento');
      recommendations.push('Notificar equipe médica');
    }
    
    return {
      ...analysis,
      recommendations
    };
  }

  /**
   * Extrai triggers emocionais
   */
  private extractTriggers(text: string): string[] {
    const triggers: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Triggers específicos para contexto médico
    const medicalTriggers = [
      'dor', 'febre', 'sangramento', 'emergência', 'urgente',
      'espera', 'demora', 'fila', 'agendamento', 'consulta',
      'exame', 'resultado', 'medicamento', 'tratamento'
    ];
    
    medicalTriggers.forEach(trigger => {
      if (lowerText.includes(trigger)) {
        triggers.push(trigger);
      }
    });
    
    return triggers;
  }

  /**
   * Determina sentimento baseado na emoção
   */
  private determineSentiment(emotion: EmotionType): 'positive' | 'negative' | 'neutral' {
    const positiveEmotions: EmotionType[] = ['joy', 'satisfaction', 'excitement', 'gratitude', 'calm', 'curiosity', 'surprise'];
    const negativeEmotions: EmotionType[] = ['frustration', 'anger', 'anxiety', 'confusion', 'sadness', 'disappointment', 'worry', 'impatience'];
    
    if (positiveEmotions.includes(emotion)) return 'positive';
    if (negativeEmotions.includes(emotion)) return 'negative';
    return 'neutral';
  }

  /**
   * Gera recomendações baseadas na emoção
   */
  private generateRecommendations(
    emotion: EmotionType,
    intensity: number,
    urgency: number
  ): string[] {
    const recommendations: string[] = [];
    
    switch (emotion) {
      case 'frustration':
      case 'anger':
        recommendations.push('Demonstrar empatia e compreensão');
        recommendations.push('Oferecer soluções rápidas');
        if (intensity > 0.7) recommendations.push('Escalar para atendente humano');
        break;
        
      case 'anxiety':
      case 'worry':
        recommendations.push('Explicar procedimentos com calma');
        recommendations.push('Oferecer informações tranquilizadoras');
        recommendations.push('Demonstrar competência e segurança');
        break;
        
      case 'confusion':
        recommendations.push('Simplificar explicações');
        recommendations.push('Usar linguagem clara e direta');
        recommendations.push('Oferecer exemplos práticos');
        break;
        
      case 'joy':
      case 'satisfaction':
        recommendations.push('Manter tom positivo e acolhedor');
        recommendations.push('Reinforçar pontos positivos');
        break;
        
      case 'curiosity':
        recommendations.push('Fornecer informações detalhadas');
        recommendations.push('Antecipar perguntas');
        break;
    }
    
    if (urgency > 0.7) {
      recommendations.push('Priorizar atendimento');
      recommendations.push('Reduzir tempo de espera');
    }
    
    return recommendations;
  }

  /**
   * Salva análise de emoção
   */
  private async saveEmotionAnalysis(
    text: string,
    analysis: EmotionAnalysis,
    context: EmotionContext
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_emotion_analysis')
        .insert({
          text,
          primary_emotion: analysis.primaryEmotion,
          secondary_emotion: analysis.secondaryEmotion,
          confidence: analysis.confidence,
          intensity: analysis.intensity,
          sentiment: analysis.sentiment,
          urgency: analysis.urgency,
          triggers: analysis.triggers,
          recommendations: analysis.recommendations,
          clinic_id: context.clinicContext.specialty, // Assumindo que clinic_id está disponível
          user_id: context.userProfile.previousInteractions?.toString(), // Placeholder
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar análise de emoção:', error);
    }
  }

  /**
   * Obtém histórico de emoções do usuário
   */
  async getUserEmotionHistory(userId: string, limit: number = 10): Promise<EmotionAnalysis[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_emotion_analysis')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error || !data) return [];

      return data.map(row => ({
        primaryEmotion: row.primary_emotion as EmotionType,
        secondaryEmotion: row.secondary_emotion as EmotionType,
        confidence: row.confidence,
        intensity: row.intensity,
        triggers: row.triggers || [],
        sentiment: row.sentiment as 'positive' | 'negative' | 'neutral',
        urgency: row.urgency as 'low' | 'medium' | 'high',
        recommendations: row.recommendations || []
      }));
    } catch (error) {
      console.error('Erro ao obter histórico de emoções:', error);
      return [];
    }
  }

  /**
   * Gera relatório de tendências emocionais
   */
  async generateEmotionTrendsReport(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalInteractions: number;
    emotionDistribution: Record<EmotionType, number>;
    averageIntensity: number;
    urgencyBreakdown: Record<string, number>;
    topTriggers: string[];
    recommendations: string[];
  }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_emotion_analysis')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error || !data) {
        return this.getDefaultEmotionTrendsReport();
      }

      const emotionDistribution: Record<EmotionType, number> = {};
      const urgencyBreakdown: Record<string, number> = { low: 0, medium: 0, high: 0 };
      const triggerCounts: Record<string, number> = {};
      let totalIntensity = 0;

      data.forEach(row => {
        const emotion = row.primary_emotion as EmotionType;
        emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
        urgencyBreakdown[row.urgency] = (urgencyBreakdown[row.urgency] || 0) + 1;
        totalIntensity += row.intensity || 0;

        (row.triggers || []).forEach(trigger => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      });

      const totalInteractions = data.length;
      const averageIntensity = totalInteractions > 0 ? totalIntensity / totalInteractions : 0;
      const topTriggers = Object.entries(triggerCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([trigger]) => trigger);

      const recommendations = this.generateTrendRecommendations(emotionDistribution, urgencyBreakdown);

      return {
        totalInteractions,
        emotionDistribution,
        averageIntensity,
        urgencyBreakdown,
        topTriggers,
        recommendations
      };
    } catch (error) {
      console.error('Erro ao gerar relatório de tendências:', error);
      return this.getDefaultEmotionTrendsReport();
    }
  }

  /**
   * Gera recomendações baseadas em tendências
   */
  private generateTrendRecommendations(
    emotionDistribution: Record<EmotionType, number>,
    urgencyBreakdown: Record<string, number>
  ): string[] {
    const recommendations: string[] = [];
    const total = Object.values(emotionDistribution).reduce((sum, count) => sum + count, 0);

    if (total === 0) return recommendations;

    // Análise de emoções negativas
    const negativeEmotions = ['frustration', 'anger', 'anxiety', 'confusion', 'sadness', 'disappointment', 'worry', 'impatience'];
    const negativeCount = negativeEmotions.reduce((sum, emotion) => sum + (emotionDistribution[emotion as EmotionType] || 0), 0);
    const negativePercentage = (negativeCount / total) * 100;

    if (negativePercentage > 30) {
      recommendations.push('Implementar treinamento de empatia para equipe');
      recommendations.push('Melhorar processo de atendimento para reduzir frustrações');
    }

    if (urgencyBreakdown.high > total * 0.2) {
      recommendations.push('Otimizar fluxo de atendimento para casos urgentes');
      recommendations.push('Implementar sistema de priorização automática');
    }

    if (emotionDistribution.confusion > total * 0.15) {
      recommendations.push('Simplificar comunicação e processos');
      recommendations.push('Criar materiais explicativos mais claros');
    }

    return recommendations;
  }

  /**
   * Análise padrão de emoção
   */
  private getDefaultEmotionAnalysis(): EmotionAnalysis {
    return {
      primaryEmotion: 'neutral',
      confidence: 0.5,
      intensity: 0.3,
      triggers: [],
      sentiment: 'neutral',
      urgency: 'low',
      recommendations: ['Manter tom neutro e profissional']
    };
  }

  /**
   * Relatório padrão de tendências
   */
  private getDefaultEmotionTrendsReport() {
    return {
      totalInteractions: 0,
      emotionDistribution: {},
      averageIntensity: 0,
      urgencyBreakdown: { low: 0, medium: 0, high: 0 },
      topTriggers: [],
      recommendations: []
    };
  }
} 