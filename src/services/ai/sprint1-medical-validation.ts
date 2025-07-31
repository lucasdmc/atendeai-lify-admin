import { supabase } from '../../../integrations/supabase/client';

export interface MedicalValidationResult {
  id: string;
  content: string;
  validation_result: 'safe' | 'warning' | 'dangerous';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  detected_issues: string[];
  recommendations: string[];
  requires_human_review: boolean;
  clinic_id: string;
  user_id: string;
  created_at: string;
}

export interface LGPDLogEntry {
  id: string;
  action_type: string;
  data_type: string;
  user_id: string;
  clinic_id: string;
  consent_given: boolean;
  data_processed: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface ConfidenceScore {
  id: string;
  response_text: string;
  confidence_score: number;
  quality_score: number;
  relevance_score: number;
  factors: any;
  requires_escalation: boolean;
  clinic_id: string;
  user_id: string;
  created_at: string;
}

export class MedicalValidationService {
  private static instance: MedicalValidationService;

  private constructor() {}

  public static getInstance(): MedicalValidationService {
    if (!MedicalValidationService.instance) {
      MedicalValidationService.instance = new MedicalValidationService();
    }
    return MedicalValidationService.instance;
  }

  /**
   * Valida conteúdo médico usando IA
   */
  async validateMedicalContent(
    content: string,
    clinicId: string,
    userId: string
  ): Promise<MedicalValidationResult> {
    try {
      // Análise de palavras-chave médicas perigosas
      const dangerousKeywords = [
        'diagnóstico', 'tratamento', 'medicamento', 'dosagem', 'prescrição',
        'sintomas', 'doença', 'câncer', 'tumor', 'quimioterapia', 'radioterapia',
        'cirurgia', 'operar', 'intervenção', 'procedimento médico'
      ];

      const detectedIssues: string[] = [];
      const recommendations: string[] = [];
      let validationResult: 'safe' | 'warning' | 'dangerous' = 'safe';
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let requiresHumanReview = false;

      // Verificar palavras-chave perigosas
      const contentLower = content.toLowerCase();
      for (const keyword of dangerousKeywords) {
        if (contentLower.includes(keyword.toLowerCase())) {
          detectedIssues.push(`Palavra-chave médica detectada: ${keyword}`);
          validationResult = 'warning';
          riskLevel = 'medium';
          requiresHumanReview = true;
        }
      }

      // Verificar frases que sugerem diagnóstico
      const diagnosticPhrases = [
        'você tem', 'você está com', 'você sofre de', 'você apresenta',
        'diagnóstico de', 'você está doente', 'você precisa de tratamento'
      ];

      for (const phrase of diagnosticPhrases) {
        if (contentLower.includes(phrase)) {
          detectedIssues.push(`Frase diagnóstica detectada: "${phrase}"`);
          validationResult = 'dangerous';
          riskLevel = 'high';
          requiresHumanReview = true;
        }
      }

      // Verificar sugestões de medicamentos
      const medicationPhrases = [
        'tome', 'use', 'aplique', 'ingira', 'medicamento', 'remédio',
        'antibiótico', 'anti-inflamatório', 'analgésico'
      ];

      for (const phrase of medicationPhrases) {
        if (contentLower.includes(phrase)) {
          detectedIssues.push(`Sugestão de medicamento detectada: "${phrase}"`);
          validationResult = 'dangerous';
          riskLevel = 'critical';
          requiresHumanReview = true;
        }
      }

      // Gerar recomendações baseadas na análise
      if (validationResult === 'safe') {
        recommendations.push('Conteúdo seguro para uso');
      } else if (validationResult === 'warning') {
        recommendations.push('Revisar conteúdo antes de enviar');
        recommendations.push('Evitar termos médicos específicos');
      } else {
        recommendations.push('CONTEÚDO PERIGOSO - NÃO ENVIAR');
        recommendations.push('Requer revisão médica obrigatória');
        recommendations.push('Evitar qualquer sugestão de diagnóstico ou tratamento');
      }

      // Salvar validação no banco
      const { data, error } = await supabase
        .from('ai_medical_validation')
        .insert({
          content,
          validation_result: validationResult,
          risk_level: riskLevel,
          detected_issues: detectedIssues,
          recommendations,
          requires_human_review: requiresHumanReview,
          clinic_id: clinicId,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar validação médica:', error);
        throw new Error('Falha ao salvar validação médica');
      }

      return data;
    } catch (error) {
      console.error('Erro na validação médica:', error);
      throw new Error('Falha na validação médica');
    }
  }

  /**
   * Registra log de conformidade LGPD
   */
  async logLGPDCompliance(
    actionType: string,
    dataType: string,
    userId: string,
    clinicId: string,
    consentGiven: boolean,
    dataProcessed: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LGPDLogEntry> {
    try {
      const { data, error } = await supabase
        .from('ai_lgpd_logs')
        .insert({
          action_type: actionType,
          data_type: dataType,
          user_id: userId,
          clinic_id: clinicId,
          consent_given: consentGiven,
          data_processed: dataProcessed,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao registrar log LGPD:', error);
        throw new Error('Falha ao registrar log LGPD');
      }

      return data;
    } catch (error) {
      console.error('Erro no log LGPD:', error);
      throw new Error('Falha no log LGPD');
    }
  }

  /**
   * Calcula e salva score de confiança da resposta
   */
  async calculateConfidenceScore(
    responseText: string,
    clinicId: string,
    userId: string,
    factors: any = {}
  ): Promise<ConfidenceScore> {
    try {
      // Análise de qualidade do texto
      const wordCount = responseText.split(' ').length;
      const hasMedicalTerms = /(diagnóstico|tratamento|medicamento|sintoma|doença)/i.test(responseText);
      const hasPersonalInfo = /(nome|idade|endereço|telefone|email)/i.test(responseText);
      const hasEmotionalContent = /(ansiedade|estresse|depressão|tristeza|alegria)/i.test(responseText);

      // Cálculo do score de confiança (0-1)
      let confidenceScore = 0.8; // Base
      
      if (wordCount < 10) confidenceScore -= 0.2;
      if (wordCount > 200) confidenceScore += 0.1;
      if (hasMedicalTerms) confidenceScore -= 0.3;
      if (hasPersonalInfo) confidenceScore -= 0.4;
      if (hasEmotionalContent) confidenceScore += 0.1;

      confidenceScore = Math.max(0, Math.min(1, confidenceScore));

      // Cálculo do score de qualidade
      const qualityScore = Math.min(1, wordCount / 100) * 0.8 + 0.2;

      // Cálculo do score de relevância
      const relevanceScore = hasMedicalTerms ? 0.6 : 0.9;

      // Determinar se requer escalação
      const requiresEscalation = confidenceScore < 0.5 || hasMedicalTerms;

      // Salvar no banco
      const { data, error } = await supabase
        .from('ai_confidence_scores')
        .insert({
          response_text: responseText,
          confidence_score: confidenceScore,
          quality_score: qualityScore,
          relevance_score: relevanceScore,
          factors: {
            wordCount,
            hasMedicalTerms,
            hasPersonalInfo,
            hasEmotionalContent,
            ...factors
          },
          requires_escalation: requiresEscalation,
          clinic_id: clinicId,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar score de confiança:', error);
        throw new Error('Falha ao salvar score de confiança');
      }

      return data;
    } catch (error) {
      console.error('Erro no cálculo de confiança:', error);
      throw new Error('Falha no cálculo de confiança');
    }
  }

  /**
   * Obtém estatísticas de validação médica
   */
  async getValidationStats(clinicId?: string): Promise<any> {
    try {
      let query = supabase
        .from('ai_medical_validation')
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
        safe: data.filter(d => d.validation_result === 'safe').length,
        warning: data.filter(d => d.validation_result === 'warning').length,
        dangerous: data.filter(d => d.validation_result === 'dangerous').length,
        requiresReview: data.filter(d => d.requires_human_review).length
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw new Error('Falha ao obter estatísticas');
    }
  }
}

export default MedicalValidationService.getInstance(); 