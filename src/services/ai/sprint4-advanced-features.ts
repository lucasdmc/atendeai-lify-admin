import { supabase } from '../../../integrations/supabase/client';

export interface EmotionAnalysis {
  id: string;
  text: string;
  primary_emotion: string;
  secondary_emotion?: string;
  confidence: number;
  intensity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  urgency: 'low' | 'medium' | 'high';
  triggers: string[];
  recommendations: string[];
  clinic_id: string;
  user_id: string;
  created_at: string;
}

export interface ProactiveSuggestion {
  id: string;
  suggestion_id: string;
  user_id: string;
  clinic_id: string;
  type: 'information' | 'action' | 'reminder' | 'recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  trigger: string;
  context: string[];
  action_url?: string;
  accepted: boolean;
  response_timestamp?: string;
  created_at: string;
}

export interface MultimodalAnalysis {
  id: string;
  type: 'image' | 'document' | 'audio' | 'video';
  content: string;
  extracted_text?: string;
  detected_objects?: string[];
  medical_relevance?: 'high' | 'medium' | 'low';
  confidence: number;
  suggestions: string[];
  processing_time: number;
  clinic_id: string;
  user_id: string;
  purpose?: string;
  created_at: string;
}

export interface VoiceInput {
  id: string;
  user_id: string;
  clinic_id: string;
  session_id?: string;
  audio_format: string;
  sample_rate: number;
  duration: number;
  transcribed_text: string;
  confidence: number;
  language: string;
  voice_settings: any;
  processing_time?: number;
  created_at: string;
}

export interface VoiceResponse {
  id: string;
  text: string;
  audio_format: string;
  duration: number;
  voice_settings: any;
  model_used: string;
  processing_time?: number;
  created_at: string;
}

export class AdvancedFeaturesService {
  private static instance: AdvancedFeaturesService;

  private constructor() {}

  public static getInstance(): AdvancedFeaturesService {
    if (!AdvancedFeaturesService.instance) {
      AdvancedFeaturesService.instance = new AdvancedFeaturesService();
    }
    return AdvancedFeaturesService.instance;
  }

  /**
   * Analisa emoções do texto
   */
  async analyzeEmotion(
    text: string,
    clinicId: string,
    userId: string
  ): Promise<EmotionAnalysis> {
    try {
      // Análise de palavras-chave emocionais
      const emotionKeywords = {
        'alegria': ['feliz', 'alegre', 'contente', 'satisfeito', 'animado'],
        'tristeza': ['triste', 'deprimido', 'melancólico', 'desanimado', 'chateado'],
        'raiva': ['irritado', 'furioso', 'nervoso', 'estressado', 'irritado'],
        'medo': ['assustado', 'preocupado', 'ansioso', 'nervoso', 'tenso'],
        'surpresa': ['surpreso', 'chocado', 'impressionado', 'admirado'],
        'nojo': ['enojado', 'repugnado', 'desgostado']
      };

      const urgencyKeywords = {
        'high': ['urgente', 'emergência', 'crítico', 'grave', 'imediato'],
        'medium': ['importante', 'preocupante', 'atenção', 'cuidado'],
        'low': ['normal', 'rotina', 'comum', 'regular']
      };

      let primaryEmotion = 'neutral';
      let secondaryEmotion: string | undefined;
      let confidence = 0.5;
      let intensity = 0.5;
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let urgency: 'low' | 'medium' | 'high' = 'low';
      const triggers: string[] = [];
      const recommendations: string[] = [];

      const textLower = text.toLowerCase();

      // Detectar emoção primária
      for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            if (primaryEmotion === 'neutral') {
              primaryEmotion = emotion;
              confidence = 0.7;
            } else {
              secondaryEmotion = emotion;
            }
            triggers.push(keyword);
          }
        }
      }

      // Detectar urgência
      for (const [level, keywords] of Object.entries(urgencyKeywords)) {
        for (const keyword of keywords) {
          if (textLower.includes(keyword)) {
            urgency = level as 'low' | 'medium' | 'high';
            break;
          }
        }
      }

      // Determinar sentimento
      const positiveWords = ['bom', 'ótimo', 'excelente', 'maravilhoso', 'feliz'];
      const negativeWords = ['ruim', 'terrível', 'horrível', 'péssimo', 'triste'];

      const positiveCount = positiveWords.filter(word => textLower.includes(word)).length;
      const negativeCount = negativeWords.filter(word => textLower.includes(word)).length;

      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        intensity = Math.min(1, 0.5 + positiveCount * 0.1);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        intensity = Math.min(1, 0.5 + negativeCount * 0.1);
      }

      // Gerar recomendações baseadas na emoção
      if (primaryEmotion === 'tristeza' || primaryEmotion === 'depressão') {
        recommendations.push('Considerar encaminhamento para psicólogo');
        recommendations.push('Oferecer suporte emocional');
      } else if (primaryEmotion === 'raiva') {
        recommendations.push('Acalmar o paciente');
        recommendations.push('Identificar causa da frustração');
      } else if (urgency === 'high') {
        recommendations.push('ATENÇÃO IMEDIATA REQUERIDA');
        recommendations.push('Considerar escalação urgente');
      }

      // Salvar análise
      const { data, error } = await supabase
        .from('ai_emotion_analysis')
        .insert({
          text,
          primary_emotion: primaryEmotion,
          secondary_emotion: secondaryEmotion,
          confidence,
          intensity,
          sentiment,
          urgency,
          triggers,
          recommendations,
          clinic_id: clinicId,
          user_id: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar análise de emoção:', error);
        throw new Error('Falha ao salvar análise de emoção');
      }

      return data;
    } catch (error) {
      console.error('Erro na análise de emoção:', error);
      throw new Error('Falha na análise de emoção');
    }
  }

  /**
   * Gera sugestões proativas
   */
  async generateProactiveSuggestions(
    userId: string,
    clinicId: string,
    trigger: string,
    context: string[] = []
  ): Promise<ProactiveSuggestion[]> {
    try {
      const suggestions: ProactiveSuggestion[] = [];

      // Sugestões baseadas no trigger
      if (trigger === 'first_interaction') {
        suggestions.push({
          suggestion_id: 'welcome_info',
          user_id: userId,
          clinic_id: clinicId,
          type: 'information',
          title: 'Bem-vindo à Clínica ESADI',
          description: 'Conheça nossos serviços e horários de atendimento',
          priority: 'medium',
          trigger,
          context,
          action_url: '/servicos',
          accepted: false,
          created_at: new Date().toISOString()
        } as ProactiveSuggestion);
      }

      if (trigger === 'medical_question') {
        suggestions.push({
          suggestion_id: 'schedule_appointment',
          user_id: userId,
          clinic_id: clinicId,
          type: 'action',
          title: 'Agendar Consulta',
          description: 'Agende uma consulta com nossos especialistas',
          priority: 'high',
          trigger,
          context,
          action_url: '/agendamento',
          accepted: false,
          created_at: new Date().toISOString()
        } as ProactiveSuggestion);
      }

      if (trigger === 'emotional_content') {
        suggestions.push({
          suggestion_id: 'psychological_support',
          user_id: userId,
          clinic_id: clinicId,
          type: 'recommendation',
          title: 'Suporte Psicológico',
          description: 'Nossa equipe de psicólogos está disponível para ajudar',
          priority: 'high',
          trigger,
          context,
          action_url: '/psicologia',
          accepted: false,
          created_at: new Date().toISOString()
        } as ProactiveSuggestion);
      }

      // Salvar sugestões no banco
      for (const suggestion of suggestions) {
        const { error } = await supabase
          .from('ai_proactive_suggestions')
          .insert(suggestion);

        if (error) {
          console.error('Erro ao salvar sugestão proativa:', error);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Erro ao gerar sugestões proativas:', error);
      throw new Error('Falha ao gerar sugestões proativas');
    }
  }

  /**
   * Analisa conteúdo multimodal
   */
  async analyzeMultimodal(
    type: 'image' | 'document' | 'audio' | 'video',
    content: string,
    clinicId: string,
    userId: string,
    purpose?: string
  ): Promise<MultimodalAnalysis> {
    try {
      const startTime = Date.now();

      let extractedText = '';
      let detectedObjects: string[] = [];
      let medicalRelevance: 'high' | 'medium' | 'low' = 'low';
      let confidence = 0.8;
      const suggestions: string[] = [];

      // Análise baseada no tipo
      if (type === 'image') {
        // Simulação de análise de imagem
        detectedObjects = ['pessoa', 'documento', 'equipamento médico'];
        extractedText = 'Imagem analisada com sucesso';
        
        if (content.includes('radiografia') || content.includes('exame')) {
          medicalRelevance = 'high';
          suggestions.push('Requer análise médica especializada');
        }
      } else if (type === 'document') {
        extractedText = 'Documento processado: ' + content.substring(0, 100);
        medicalRelevance = 'medium';
        suggestions.push('Documento arquivado no sistema');
      } else if (type === 'audio') {
        extractedText = 'Áudio transcrito: ' + content;
        if (content.includes('sintoma') || content.includes('dor')) {
          medicalRelevance = 'high';
          suggestions.push('Áudio requer atenção médica');
        }
      } else if (type === 'video') {
        extractedText = 'Vídeo analisado';
        detectedObjects = ['pessoa', 'movimento', 'ambiente'];
        suggestions.push('Vídeo processado com sucesso');
      }

      const processingTime = Date.now() - startTime;

      // Salvar análise
      const { data, error } = await supabase
        .from('ai_multimodal_analysis')
        .insert({
          type,
          content,
          extracted_text: extractedText,
          detected_objects: detectedObjects,
          medical_relevance: medicalRelevance,
          confidence,
          suggestions,
          processing_time: processingTime,
          clinic_id: clinicId,
          user_id: userId,
          purpose
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar análise multimodal:', error);
        throw new Error('Falha ao salvar análise multimodal');
      }

      return data;
    } catch (error) {
      console.error('Erro na análise multimodal:', error);
      throw new Error('Falha na análise multimodal');
    }
  }

  /**
   * Processa entrada de voz
   */
  async processVoiceInput(
    audioData: string, // Base64 ou URL
    userId: string,
    clinicId: string,
    sessionId?: string,
    audioFormat: string = 'wav',
    sampleRate: number = 16000,
    language: string = 'pt-BR'
  ): Promise<VoiceInput> {
    try {
      const startTime = Date.now();

      // Simulação de transcrição (em produção, usar Whisper API)
      const transcribedText = 'Texto transcrito do áudio: ' + audioData.substring(0, 50);
      const duration = 10.5; // Simulação
      const confidence = 0.85;
      const processingTime = Date.now() - startTime;

      const voiceSettings = {
        language,
        sample_rate: sampleRate,
        format: audioFormat
      };

      // Salvar entrada de voz
      const { data, error } = await supabase
        .from('ai_voice_inputs')
        .insert({
          user_id: userId,
          clinic_id: clinicId,
          session_id: sessionId,
          audio_format: audioFormat,
          sample_rate: sampleRate,
          duration,
          transcribed_text: transcribedText,
          confidence,
          language,
          voice_settings: voiceSettings,
          processing_time: processingTime
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar entrada de voz:', error);
        throw new Error('Falha ao salvar entrada de voz');
      }

      return data;
    } catch (error) {
      console.error('Erro no processamento de voz:', error);
      throw new Error('Falha no processamento de voz');
    }
  }

  /**
   * Gera resposta de voz
   */
  async generateVoiceResponse(
    text: string,
    modelUsed: string = 'tts-1',
    audioFormat: string = 'wav'
  ): Promise<VoiceResponse> {
    try {
      const startTime = Date.now();

      // Simulação de geração de áudio (em produção, usar TTS API)
      const duration = text.length * 0.05; // Estimativa
      const processingTime = Date.now() - startTime;

      const voiceSettings = {
        voice: 'alloy',
        speed: 1.0,
        format: audioFormat
      };

      // Salvar resposta de voz
      const { data, error } = await supabase
        .from('ai_voice_responses')
        .insert({
          text,
          audio_format: audioFormat,
          duration,
          voice_settings: voiceSettings,
          model_used: modelUsed,
          processing_time: processingTime
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar resposta de voz:', error);
        throw new Error('Falha ao salvar resposta de voz');
      }

      return data;
    } catch (error) {
      console.error('Erro na geração de voz:', error);
      throw new Error('Falha na geração de voz');
    }
  }

  /**
   * Obtém estatísticas de emoções
   */
  async getEmotionStats(clinicId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_emotion_stats', {
        clinic_id_param: clinicId,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Erro ao obter estatísticas de emoções:', error);
        throw new Error('Falha ao obter estatísticas de emoções');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de emoções:', error);
      throw new Error('Falha ao obter estatísticas de emoções');
    }
  }

  /**
   * Obtém estatísticas de sugestões proativas
   */
  async getProactiveStats(clinicId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_proactive_stats', {
        clinic_id_param: clinicId,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Erro ao obter estatísticas proativas:', error);
        throw new Error('Falha ao obter estatísticas proativas');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas proativas:', error);
      throw new Error('Falha ao obter estatísticas proativas');
    }
  }

  /**
   * Obtém estatísticas multimodais
   */
  async getMultimodalStats(clinicId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_multimodal_stats', {
        clinic_id_param: clinicId,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Erro ao obter estatísticas multimodais:', error);
        throw new Error('Falha ao obter estatísticas multimodais');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas multimodais:', error);
      throw new Error('Falha ao obter estatísticas multimodais');
    }
  }

  /**
   * Obtém estatísticas de voz
   */
  async getVoiceStats(clinicId?: string, startDate?: Date, endDate?: Date): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_voice_stats', {
        clinic_id_param: clinicId,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString()
      });

      if (error) {
        console.error('Erro ao obter estatísticas de voz:', error);
        throw new Error('Falha ao obter estatísticas de voz');
      }

      return data;
    } catch (error) {
      console.error('Erro ao obter estatísticas de voz:', error);
      throw new Error('Falha ao obter estatísticas de voz');
    }
  }
}

export default AdvancedFeaturesService.getInstance(); 