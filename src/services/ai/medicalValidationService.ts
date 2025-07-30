import { supabase } from '@/integrations/supabase/client';

export interface ValidationResult {
  isValid: boolean;
  shouldEscalate: boolean;
  reason?: string;
  suggestedResponse?: string;
  confidence: number;
  flaggedContent?: string[];
}

export interface MedicalContentAnalysis {
  containsMedicalContent: boolean;
  medicalKeywords: string[];
  riskLevel: 'low' | 'medium' | 'high';
  requiresHumanReview: boolean;
}

export class MedicalValidationService {
  private medicalKeywords = [
    // Diagnósticos e sintomas
    'diagnóstico', 'diagnosticar', 'sintoma', 'sintomas', 'doença', 'doenças',
    'condição', 'patologia', 'distúrbio', 'transtorno', 'síndrome',
    
    // Medicamentos e tratamentos
    'medicamento', 'medicamentos', 'remédio', 'remédios', 'medicação',
    'dosagem', 'dose', 'posologia', 'prescrição', 'prescrever',
    'tratamento', 'terapia', 'cura', 'medicina',
    
    // Procedimentos médicos
    'exame', 'exames', 'teste', 'testes', 'procedimento', 'cirurgia',
    'operar', 'operado', 'anestesia', 'biópsia', 'raio-x', 'ultrassom',
    'resonância', 'tomografia', 'endoscopia',
    
    // Especialidades médicas
    'cardiologia', 'dermatologia', 'neurologia', 'psiquiatria',
    'ortopedia', 'ginecologia', 'urologia', 'oftalmologia',
    'otorrinolaringologia', 'endocrinologia',
    
    // Termos de risco
    'emergência', 'urgente', 'crítico', 'grave', 'fatal',
    'câncer', 'tumor', 'metástase', 'infarto', 'AVC',
    'diabetes', 'hipertensão', 'colesterol', 'triglicerídeos'
  ];

  private highRiskKeywords = [
    'diagnóstico', 'medicamento', 'dosagem', 'prescrição',
    'emergência', 'urgente', 'crítico', 'grave',
    'câncer', 'tumor', 'infarto', 'AVC'
  ];

  private escalationTriggers = [
    'diagnóstico', 'medicamento', 'prescrição', 'emergência',
    'câncer', 'tumor', 'infarto', 'AVC'
  ];

  /**
   * Valida resposta para conteúdo médico potencialmente perigoso
   */
  async validateMedicalResponse(response: string): Promise<ValidationResult> {
    const analysis = this.analyzeMedicalContent(response);
    
    if (analysis.containsMedicalContent) {
      return this.createEscalationResponse(analysis);
    }

    return {
      isValid: true,
      shouldEscalate: false,
      confidence: 1.0
    };
  }

  /**
   * Analisa conteúdo para detectar informações médicas
   */
  private analyzeMedicalContent(text: string): MedicalContentAnalysis {
    const lowerText = text.toLowerCase();
    const foundKeywords = this.medicalKeywords.filter(keyword => 
      lowerText.includes(keyword)
    );

    const highRiskFound = this.highRiskKeywords.filter(keyword =>
      lowerText.includes(keyword)
    );

    const escalationNeeded = this.escalationTriggers.some(trigger =>
      lowerText.includes(trigger)
    );

    const riskLevel = this.calculateRiskLevel(foundKeywords, highRiskFound);

    return {
      containsMedicalContent: foundKeywords.length > 0,
      medicalKeywords: foundKeywords,
      riskLevel,
      requiresHumanReview: escalationNeeded || riskLevel === 'high'
    };
  }

  /**
   * Calcula nível de risco baseado nos termos encontrados
   */
  private calculateRiskLevel(
    allKeywords: string[],
    highRiskKeywords: string[]
  ): 'low' | 'medium' | 'high' {
    
    if (highRiskKeywords.length > 0) {
      return 'high';
    }
    
    if (allKeywords.length > 3) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Cria resposta de escalação quando conteúdo médico é detectado
   */
  private createEscalationResponse(analysis: MedicalContentAnalysis): ValidationResult {
    const suggestedResponse = this.generateSafeResponse(analysis);
    
    return {
      isValid: false,
      shouldEscalate: true,
      reason: `Conteúdo médico detectado (${analysis.riskLevel} risk) - requer validação humana`,
      suggestedResponse,
      confidence: 0.95,
      flaggedContent: analysis.medicalKeywords
    };
  }

  /**
   * Gera resposta segura baseada no nível de risco
   */
  private generateSafeResponse(analysis: MedicalContentAnalysis): string {
    const responses = {
      low: `Entendo sua preocupação. Para questões médicas específicas, 
      recomendo que converse diretamente com um de nossos profissionais. 
      Posso ajudar a agendar uma consulta para você?`,
      
      medium: `Para questões médicas como essa, é importante que você 
      converse com um de nossos profissionais. Posso agendar uma consulta 
      para você falar diretamente com um médico?`,
      
      high: `Para questões médicas importantes como essa, é fundamental 
      que você converse com um de nossos profissionais imediatamente. 
      Vou transferir você para um atendente humano agora mesmo.`
    };

    return responses[analysis.riskLevel];
  }

  /**
   * Valida se uma intenção requer escalação médica
   */
  async validateIntentForMedicalEscalation(intent: string): Promise<boolean> {
    const medicalIntents = [
      'MEDICAL_DIAGNOSIS',
      'MEDICATION_ADVICE',
      'TREATMENT_RECOMMENDATION',
      'SYMPTOM_ANALYSIS'
    ];

    return medicalIntents.includes(intent);
  }

  /**
   * Registra tentativa de acesso a conteúdo médico
   */
  async logMedicalContentAttempt(
    userId: string,
    content: string,
    analysis: MedicalContentAnalysis
  ): Promise<void> {
    try {
      await supabase
        .from('medical_content_logs')
        .insert({
          user_id: userId,
          content: content.substring(0, 500), // Limitar tamanho
          medical_keywords: analysis.medicalKeywords,
          risk_level: analysis.riskLevel,
          requires_review: analysis.requiresHumanReview,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao registrar tentativa de conteúdo médico:', error);
    }
  }

  /**
   * Verifica se o usuário tem histórico de tentativas médicas
   */
  async checkUserMedicalHistory(userId: string): Promise<{
    hasHistory: boolean;
    attemptCount: number;
    lastAttempt: Date | null;
  }> {
    try {
      const { data, error } = await supabase
        .from('medical_content_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        hasHistory: data.length > 0,
        attemptCount: data.length,
        lastAttempt: data.length > 0 ? new Date(data[0].timestamp) : null
      };
    } catch (error) {
      console.error('Erro ao verificar histórico médico:', error);
      return { hasHistory: false, attemptCount: 0, lastAttempt: null };
    }
  }

  /**
   * Gera relatório de tentativas médicas para auditoria
   */
  async generateMedicalAuditReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalAttempts: number;
    highRiskAttempts: number;
    usersWithAttempts: number;
    commonKeywords: string[];
  }> {
    try {
      const { data, error } = await supabase
        .from('medical_content_logs')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) throw error;

      const highRiskAttempts = data.filter(log => log.risk_level === 'high').length;
      const uniqueUsers = new Set(data.map(log => log.user_id)).size;
      
      // Contar keywords mais comuns
      const keywordCounts: Record<string, number> = {};
      data.forEach(log => {
        log.medical_keywords.forEach((keyword: string) => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });
      });

      const commonKeywords = Object.entries(keywordCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([keyword]) => keyword);

      return {
        totalAttempts: data.length,
        highRiskAttempts,
        usersWithAttempts: uniqueUsers,
        commonKeywords
      };
    } catch (error) {
      console.error('Erro ao gerar relatório médico:', error);
      return {
        totalAttempts: 0,
        highRiskAttempts: 0,
        usersWithAttempts: 0,
        commonKeywords: []
      };
    }
  }
} 