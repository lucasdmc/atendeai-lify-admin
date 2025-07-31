import { createClient } from '@supabase/supabase-js';

interface VoiceInput {
  audioBuffer: Buffer;
  sampleRate: number;
  duration: number;
  format: 'wav' | 'mp3' | 'm4a' | 'webm';
  metadata?: {
    userId: string;
    clinicId: string;
    sessionId: string;
  };
}

interface VoiceOutput {
  text: string;
  confidence: number;
  language: string;
  processingTime: number;
}

interface VoiceResponse {
  audioBuffer: Buffer;
  duration: number;
  format: 'wav' | 'mp3' | 'm4a' | 'webm';
  text: string;
  metadata: {
    modelUsed: string;
    confidence: number;
    processingTime: number;
  };
}

interface VoiceSettings {
  language: 'pt-BR' | 'en-US' | 'es-ES';
  voice: 'male' | 'female' | 'neutral';
  speed: number; // 0.5 to 2.0
  pitch: number; // -20 to 20
  volume: number; // 0 to 100
}

export class VoiceService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private defaultSettings: VoiceSettings = {
    language: 'pt-BR',
    voice: 'female',
    speed: 1.0,
    pitch: 0,
    volume: 80
  };

  /**
   * Processa entrada de voz (Speech-to-Text)
   */
  async processVoiceInput(
    input: VoiceInput,
    settings: Partial<VoiceSettings> = {}
  ): Promise<VoiceOutput> {
    try {
      const startTime = Date.now();
      const finalSettings = { ...this.defaultSettings, ...settings };
      
      // Transcrever áudio
      const transcription = await this.transcribeAudio(input.audioBuffer, finalSettings);
      
      // Detectar idioma se não especificado
      const detectedLanguage = await this.detectLanguage(transcription.text);
      
      // Salvar entrada de voz
      await this.saveVoiceInput(input, transcription, finalSettings);
      
      return {
        text: transcription.text,
        confidence: transcription.confidence,
        language: detectedLanguage,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Erro no processamento de entrada de voz:', error);
      return {
        text: '',
        confidence: 0,
        language: 'pt-BR',
        processingTime: 0
      };
    }
  }

  /**
   * Gera resposta de voz (Text-to-Speech)
   */
  async generateVoiceResponse(
    text: string,
    settings: Partial<VoiceSettings> = {}
  ): Promise<VoiceResponse> {
    try {
      const startTime = Date.now();
      const finalSettings = { ...this.defaultSettings, ...settings };
      
      // Gerar áudio
      const audioBuffer = await this.generateAudio(text, finalSettings);
      
      // Calcular duração
      const duration = this.calculateAudioDuration(audioBuffer, finalSettings);
      
      // Salvar resposta de voz
      await this.saveVoiceResponse(text, audioBuffer, finalSettings);
      
      return {
        audioBuffer,
        duration,
        format: 'wav',
        text,
        metadata: {
          modelUsed: 'gpt-4o',
          confidence: 0.9,
          processingTime: Date.now() - startTime
        }
      };
    } catch (error) {
      console.error('Erro na geração de resposta de voz:', error);
      throw error;
    }
  }

  /**
   * Transcreve áudio usando OpenAI Whisper
   */
  private async transcribeAudio(
    audioBuffer: Buffer,
    settings: VoiceSettings
  ): Promise<{ text: string; confidence: number }> {
    try {
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', settings.language);
      formData.append('response_format', 'verbose_json');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        text: data.text,
        confidence: data.segments?.[0]?.confidence || 0.8
      };
    } catch (error) {
      console.error('Erro na transcrição de áudio:', error);
      throw error;
    }
  }

  /**
   * Detecta idioma do texto
   */
  private async detectLanguage(text: string): Promise<string> {
    try {
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
              content: 'Detecte o idioma do texto e retorne apenas o código do idioma (ex: pt-BR, en-US, es-ES)'
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Erro na detecção de idioma:', error);
      return 'pt-BR';
    }
  }

  /**
   * Gera áudio usando OpenAI TTS
   */
  private async generateAudio(
    text: string,
    settings: VoiceSettings
  ): Promise<Buffer> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: this.mapVoiceSetting(settings.voice),
          speed: settings.speed,
          response_format: 'wav'
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error('Erro na geração de áudio:', error);
      throw error;
    }
  }

  /**
   * Mapeia configuração de voz para OpenAI
   */
  private mapVoiceSetting(voice: 'male' | 'female' | 'neutral'): string {
    const voiceMapping = {
      male: 'alloy',
      female: 'nova',
      neutral: 'echo'
    };
    return voiceMapping[voice];
  }

  /**
   * Calcula duração do áudio
   */
  private calculateAudioDuration(audioBuffer: Buffer, settings: VoiceSettings): number {
    // Estimativa baseada no tamanho do buffer e configurações
    const bytesPerSecond = 16000 * 2; // 16kHz, 16-bit
    const estimatedDuration = audioBuffer.length / bytesPerSecond;
    return estimatedDuration / settings.speed;
  }

  /**
   * Salva entrada de voz
   */
  private async saveVoiceInput(
    input: VoiceInput,
    transcription: { text: string; confidence: number },
    settings: VoiceSettings
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_voice_inputs')
        .insert({
          user_id: input.metadata?.userId,
          clinic_id: input.metadata?.clinicId,
          session_id: input.metadata?.sessionId,
          audio_format: input.format,
          sample_rate: input.sampleRate,
          duration: input.duration,
          transcribed_text: transcription.text,
          confidence: transcription.confidence,
          language: settings.language,
          voice_settings: settings,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar entrada de voz:', error);
    }
  }

  /**
   * Salva resposta de voz
   */
  private async saveVoiceResponse(
    text: string,
    audioBuffer: Buffer,
    settings: VoiceSettings
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_voice_responses')
        .insert({
          text,
          audio_format: 'wav',
          duration: this.calculateAudioDuration(audioBuffer, settings),
          voice_settings: settings,
          model_used: 'tts-1',
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar resposta de voz:', error);
    }
  }

  /**
   * Obtém configurações de voz do usuário
   */
  async getUserVoiceSettings(userId: string): Promise<VoiceSettings> {
    try {
      const { data, error } = await this.supabase
        .from('user_voice_preferences')
        .select('voice_settings')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return this.defaultSettings;
      }

      return { ...this.defaultSettings, ...data.voice_settings };
    } catch (error) {
      console.error('Erro ao obter configurações de voz:', error);
      return this.defaultSettings;
    }
  }

  /**
   * Salva configurações de voz do usuário
   */
  async saveUserVoiceSettings(
    userId: string,
    settings: VoiceSettings
  ): Promise<void> {
    try {
      await this.supabase
        .from('user_voice_preferences')
        .upsert({
          user_id: userId,
          voice_settings: settings,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar configurações de voz:', error);
    }
  }

  /**
   * Obtém estatísticas de uso de voz
   */
  async getVoiceUsageStats(
    clinicId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalInputs: number;
    totalResponses: number;
    averageConfidence: number;
    mostUsedLanguage: string;
    averageProcessingTime: number;
  }> {
    try {
      const { data: inputs, error: inputsError } = await this.supabase
        .from('ai_voice_inputs')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      const { data: responses, error: responsesError } = await this.supabase
        .from('ai_voice_responses')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (inputsError || responsesError) {
        return this.getDefaultVoiceStats();
      }

      const totalInputs = inputs?.length || 0;
      const totalResponses = responses?.length || 0;
      
      const averageConfidence = inputs && inputs.length > 0
        ? inputs.reduce((sum, input) => sum + (input.confidence || 0), 0) / inputs.length
        : 0;

      const languageCounts: Record<string, number> = {};
      inputs?.forEach(input => {
        const lang = input.language || 'pt-BR';
        languageCounts[lang] = (languageCounts[lang] || 0) + 1;
      });

      const mostUsedLanguage = Object.entries(languageCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'pt-BR';

      const averageProcessingTime = inputs && inputs.length > 0
        ? inputs.reduce((sum, input) => sum + (input.processing_time || 0), 0) / inputs.length
        : 0;

      return {
        totalInputs,
        totalResponses,
        averageConfidence,
        mostUsedLanguage,
        averageProcessingTime
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de voz:', error);
      return this.getDefaultVoiceStats();
    }
  }

  /**
   * Valida qualidade do áudio
   */
  validateAudioQuality(audioBuffer: Buffer, sampleRate: number): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Verificar tamanho do arquivo
    if (audioBuffer.length < 1024) {
      issues.push('Arquivo de áudio muito pequeno');
      recommendations.push('Grave pelo menos 1 segundo de áudio');
    }

    if (audioBuffer.length > 25 * 1024 * 1024) { // 25MB
      issues.push('Arquivo de áudio muito grande');
      recommendations.push('Comprima o áudio ou grave por menos tempo');
    }

    // Verificar taxa de amostragem
    if (sampleRate < 8000) {
      issues.push('Taxa de amostragem muito baixa');
      recommendations.push('Use pelo menos 8kHz para melhor qualidade');
    }

    if (sampleRate > 48000) {
      issues.push('Taxa de amostragem muito alta');
      recommendations.push('Use no máximo 48kHz para otimizar processamento');
    }

    // Verificar silêncio
    const silenceThreshold = 0.1;
    const audioData = new Float32Array(audioBuffer.buffer);
    const averageAmplitude = audioData.reduce((sum, sample) => sum + Math.abs(sample), 0) / audioData.length;
    
    if (averageAmplitude < silenceThreshold) {
      issues.push('Áudio muito silencioso');
      recommendations.push('Aumente o volume ou aproxime o microfone');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Otimiza áudio para melhor reconhecimento
   */
  async optimizeAudio(audioBuffer: Buffer): Promise<Buffer> {
    try {
      // Implementação básica de otimização
      // Em produção, usar bibliotecas como Web Audio API ou FFmpeg
      
      // Normalizar volume
      const normalizedBuffer = this.normalizeAudio(audioBuffer);
      
      // Remover ruído (implementação simplificada)
      const denoisedBuffer = this.removeNoise(normalizedBuffer);
      
      return denoisedBuffer;
    } catch (error) {
      console.error('Erro na otimização de áudio:', error);
      return audioBuffer;
    }
  }

  /**
   * Normaliza volume do áudio
   */
  private normalizeAudio(audioBuffer: Buffer): Buffer {
    // Implementação simplificada
    // Em produção, usar algoritmos mais sofisticados
    return audioBuffer;
  }

  /**
   * Remove ruído do áudio
   */
  private removeNoise(audioBuffer: Buffer): Buffer {
    // Implementação simplificada
    // Em produção, usar filtros de ruído
    return audioBuffer;
  }

  /**
   * Estatísticas padrão de voz
   */
  private getDefaultVoiceStats() {
    return {
      totalInputs: 0,
      totalResponses: 0,
      averageConfidence: 0,
      mostUsedLanguage: 'pt-BR',
      averageProcessingTime: 0
    };
  }

  /**
   * Converte texto para SSML (Speech Synthesis Markup Language)
   */
  private textToSSML(text: string, settings: VoiceSettings): string {
    return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${settings.language}">
      <voice name="${this.mapVoiceSetting(settings.voice)}">
        <prosody rate="${settings.speed}" pitch="${settings.pitch}">
          ${this.escapeSSML(text)}
        </prosody>
      </voice>
    </speak>`;
  }

  /**
   * Escapa caracteres especiais para SSML
   */
  private escapeSSML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
} 