import { createClient } from '@supabase/supabase-js';

interface MultimodalInput {
  type: 'image' | 'document' | 'audio' | 'video';
  content: string | Buffer | File;
  metadata?: {
    filename?: string;
    mimeType?: string;
    size?: number;
    dimensions?: { width: number; height: number };
  };
}

interface MultimodalAnalysis {
  type: 'image' | 'document' | 'audio' | 'video';
  content: string;
  extractedText?: string;
  detectedObjects?: string[];
  medicalRelevance?: 'high' | 'medium' | 'low';
  confidence: number;
  suggestions: string[];
  processingTime: number;
}

interface DocumentAnalysis {
  documentType: 'prescription' | 'exam_result' | 'medical_record' | 'insurance' | 'other';
  extractedFields: Record<string, string>;
  medicalTerms: string[];
  recommendations: string[];
  confidence: number;
}

interface ImageAnalysis {
  detectedObjects: string[];
  medicalRelevance: 'high' | 'medium' | 'low';
  potentialIssues: string[];
  recommendations: string[];
  confidence: number;
}

export class MultimodalService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  private supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private supportedDocumentTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  private maxFileSize = 10 * 1024 * 1024; // 10MB

  /**
   * Processa entrada multimodal
   */
  async processMultimodalInput(
    input: MultimodalInput,
    context: {
      clinicId: string;
      userId: string;
      purpose: string;
    }
  ): Promise<MultimodalAnalysis> {
    try {
      const startTime = Date.now();
      
      // Validar entrada
      this.validateInput(input);
      
      let analysis: MultimodalAnalysis;
      
      switch (input.type) {
        case 'image':
          analysis = await this.processImage(input);
          break;
        case 'document':
          analysis = await this.processDocument(input);
          break;
        case 'audio':
          analysis = await this.processAudio(input);
          break;
        case 'video':
          analysis = await this.processVideo(input);
          break;
        default:
          throw new Error(`Tipo de entrada não suportado: ${input.type}`);
      }
      
      // Aplicar contexto médico
      analysis = this.applyMedicalContext(analysis, context);
      
      // Salvar análise
      await this.saveMultimodalAnalysis(analysis, context);
      
      analysis.processingTime = Date.now() - startTime;
      
      return analysis;
    } catch (error) {
      console.error('Erro no processamento multimodal:', error);
      return this.getDefaultAnalysis(input.type);
    }
  }

  /**
   * Processa imagem
   */
  private async processImage(input: MultimodalInput): Promise<MultimodalAnalysis> {
    try {
      // Usar OpenAI Vision API para análise de imagem
      const imageAnalysis = await this.analyzeImageWithAI(input.content as string);
      
      // Análise local adicional
      const localAnalysis = this.performLocalImageAnalysis(input);
      
      // Combinar análises
      const combinedAnalysis = this.combineImageAnalyses(imageAnalysis, localAnalysis);
      
      return {
        type: 'image',
        content: 'Análise de imagem médica',
        detectedObjects: combinedAnalysis.detectedObjects,
        medicalRelevance: combinedAnalysis.medicalRelevance,
        confidence: combinedAnalysis.confidence,
        suggestions: combinedAnalysis.recommendations,
        processingTime: 0 // Será calculado no método principal
      };
    } catch (error) {
      console.error('Erro no processamento de imagem:', error);
      return this.getDefaultImageAnalysis();
    }
  }

  /**
   * Processa documento
   */
  private async processDocument(input: MultimodalInput): Promise<MultimodalAnalysis> {
    try {
      // Extrair texto do documento
      const extractedText = await this.extractTextFromDocument(input.content);
      
      // Analisar tipo de documento
      const documentAnalysis = await this.analyzeDocumentType(extractedText);
      
      // Extrair campos relevantes
      const extractedFields = await this.extractMedicalFields(extractedText, documentAnalysis.documentType);
      
      return {
        type: 'document',
        content: 'Análise de documento médico',
        extractedText,
        medicalRelevance: this.determineMedicalRelevance(documentAnalysis.documentType),
        confidence: documentAnalysis.confidence,
        suggestions: documentAnalysis.recommendations,
        processingTime: 0
      };
    } catch (error) {
      console.error('Erro no processamento de documento:', error);
      return this.getDefaultDocumentAnalysis();
    }
  }

  /**
   * Processa áudio
   */
  private async processAudio(input: MultimodalInput): Promise<MultimodalAnalysis> {
    try {
      // Transcrever áudio
      const transcription = await this.transcribeAudio(input.content as Buffer);
      
      // Analisar conteúdo da transcrição
      const audioAnalysis = await this.analyzeAudioContent(transcription);
      
      return {
        type: 'audio',
        content: 'Análise de áudio médico',
        extractedText: transcription,
        medicalRelevance: audioAnalysis.medicalRelevance,
        confidence: audioAnalysis.confidence,
        suggestions: audioAnalysis.recommendations,
        processingTime: 0
      };
    } catch (error) {
      console.error('Erro no processamento de áudio:', error);
      return this.getDefaultAudioAnalysis();
    }
  }

  /**
   * Processa vídeo
   */
  private async processVideo(input: MultimodalInput): Promise<MultimodalAnalysis> {
    try {
      // Extrair frames do vídeo
      const frames = await this.extractVideoFrames(input.content as Buffer);
      
      // Analisar frames
      const frameAnalyses = await Promise.all(
        frames.map(frame => this.analyzeImageWithAI(frame))
      );
      
      // Combinar análises dos frames
      const combinedAnalysis = this.combineVideoFrameAnalyses(frameAnalyses);
      
      return {
        type: 'video',
        content: 'Análise de vídeo médico',
        detectedObjects: combinedAnalysis.detectedObjects,
        medicalRelevance: combinedAnalysis.medicalRelevance,
        confidence: combinedAnalysis.confidence,
        suggestions: combinedAnalysis.recommendations,
        processingTime: 0
      };
    } catch (error) {
      console.error('Erro no processamento de vídeo:', error);
      return this.getDefaultVideoAnalysis();
    }
  }

  /**
   * Analisa imagem com IA
   */
  private async analyzeImageWithAI(imageContent: string): Promise<ImageAnalysis> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Você é um especialista em análise de imagens médicas. Analise a imagem e identifique objetos, relevância médica e possíveis problemas. Retorne um JSON com: detectedObjects (array), medicalRelevance (high/medium/low), potentialIssues (array), recommendations (array), confidence (0-1)'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Analise esta imagem médica:'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageContent
                  }
                }
              ]
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      return this.parseImageAnalysisResponse(aiResponse);
    } catch (error) {
      console.error('Erro na análise de imagem com IA:', error);
      return this.getDefaultImageAnalysis();
    }
  }

  /**
   * Extrai texto de documento
   */
  private async extractTextFromDocument(content: string | Buffer | File): Promise<string> {
    try {
      // Para PDFs, usar biblioteca específica
      if (content instanceof Buffer) {
        // Implementar extração de texto baseada no tipo
        return 'Texto extraído do documento';
      }
      
      // Para outros tipos, processar como string
      return content.toString();
    } catch (error) {
      console.error('Erro na extração de texto:', error);
      return '';
    }
  }

  /**
   * Analisa tipo de documento
   */
  private async analyzeDocumentType(text: string): Promise<DocumentAnalysis> {
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
              content: 'Analise o tipo de documento médico e extraia informações relevantes. Retorne um JSON com: documentType, extractedFields (object), medicalTerms (array), recommendations (array), confidence (0-1)'
            },
            {
              role: 'user',
              content: `Analise este documento médico:\n\n${text}`
            }
          ],
          max_tokens: 300,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      return this.parseDocumentAnalysisResponse(aiResponse);
    } catch (error) {
      console.error('Erro na análise de documento:', error);
      return this.getDefaultDocumentAnalysis();
    }
  }

  /**
   * Extrai campos médicos
   */
  private async extractMedicalFields(text: string, documentType: string): Promise<Record<string, string>> {
    const fields: Record<string, string> = {};
    
    // Padrões para diferentes tipos de documentos
    const patterns = {
      prescription: {
        patient: /paciente[:\s]+([^\n]+)/i,
        medication: /medicamento[:\s]+([^\n]+)/i,
        dosage: /dosagem[:\s]+([^\n]+)/i,
        duration: /duração[:\s]+([^\n]+)/i
      },
      exam_result: {
        patient: /paciente[:\s]+([^\n]+)/i,
        exam: /exame[:\s]+([^\n]+)/i,
        result: /resultado[:\s]+([^\n]+)/i,
        date: /data[:\s]+([^\n]+)/i
      },
      medical_record: {
        patient: /paciente[:\s]+([^\n]+)/i,
        diagnosis: /diagnóstico[:\s]+([^\n]+)/i,
        treatment: /tratamento[:\s]+([^\n]+)/i,
        date: /data[:\s]+([^\n]+)/i
      }
    };
    
    const documentPatterns = patterns[documentType as keyof typeof patterns];
    if (documentPatterns) {
      Object.entries(documentPatterns).forEach(([field, pattern]) => {
        const match = text.match(pattern);
        if (match) {
          fields[field] = match[1].trim();
        }
      });
    }
    
    return fields;
  }

  /**
   * Transcreve áudio
   */
  private async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: new FormData().append('file', new Blob([audioBuffer]), 'audio.wav')
      });

      if (!response.ok) {
        throw new Error(`Erro na API OpenAI: ${response.status}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Erro na transcrição de áudio:', error);
      return '';
    }
  }

  /**
   * Analisa conteúdo de áudio
   */
  private async analyzeAudioContent(transcription: string): Promise<{
    medicalRelevance: 'high' | 'medium' | 'low';
    confidence: number;
    recommendations: string[];
  }> {
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
              content: 'Analise a relevância médica da transcrição de áudio. Retorne um JSON com: medicalRelevance (high/medium/low), confidence (0-1), recommendations (array)'
            },
            {
              role: 'user',
              content: `Analise esta transcrição médica:\n\n${transcription}`
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
      
      return this.parseAudioAnalysisResponse(aiResponse);
    } catch (error) {
      console.error('Erro na análise de áudio:', error);
      return {
        medicalRelevance: 'low',
        confidence: 0.5,
        recommendations: []
      };
    }
  }

  /**
   * Extrai frames de vídeo
   */
  private async extractVideoFrames(videoBuffer: Buffer): Promise<string[]> {
    // Implementação simplificada - em produção usar biblioteca de processamento de vídeo
    return ['frame1.jpg', 'frame2.jpg', 'frame3.jpg'];
  }

  /**
   * Combina análises de frames de vídeo
   */
  private combineVideoFrameAnalyses(frameAnalyses: ImageAnalysis[]): ImageAnalysis {
    const allDetectedObjects = frameAnalyses.flatMap(analysis => analysis.detectedObjects);
    const allPotentialIssues = frameAnalyses.flatMap(analysis => analysis.potentialIssues);
    const allRecommendations = frameAnalyses.flatMap(analysis => analysis.recommendations);
    
    const averageConfidence = frameAnalyses.reduce((sum, analysis) => sum + analysis.confidence, 0) / frameAnalyses.length;
    
    // Determinar relevância médica baseada na maioria dos frames
    const relevanceCounts = frameAnalyses.reduce((counts, analysis) => {
      counts[analysis.medicalRelevance] = (counts[analysis.medicalRelevance] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
    
    const medicalRelevance = Object.entries(relevanceCounts)
      .sort(([,a], [,b]) => b - a)[0][0] as 'high' | 'medium' | 'low';
    
    return {
      detectedObjects: [...new Set(allDetectedObjects)],
      medicalRelevance,
      potentialIssues: [...new Set(allPotentialIssues)],
      recommendations: [...new Set(allRecommendations)],
      confidence: averageConfidence
    };
  }

  /**
   * Valida entrada
   */
  private validateInput(input: MultimodalInput): void {
    if (!input.content) {
      throw new Error('Conteúdo não fornecido');
    }
    
    if (input.metadata?.size && input.metadata.size > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${this.maxFileSize / (1024 * 1024)}MB`);
    }
    
    if (input.type === 'image' && input.metadata?.mimeType) {
      if (!this.supportedImageTypes.includes(input.metadata.mimeType)) {
        throw new Error(`Tipo de imagem não suportado: ${input.metadata.mimeType}`);
      }
    }
    
    if (input.type === 'document' && input.metadata?.mimeType) {
      if (!this.supportedDocumentTypes.includes(input.metadata.mimeType)) {
        throw new Error(`Tipo de documento não suportado: ${input.metadata.mimeType}`);
      }
    }
  }

  /**
   * Aplica contexto médico
   */
  private applyMedicalContext(
    analysis: MultimodalAnalysis,
    context: { clinicId: string; userId: string; purpose: string }
  ): MultimodalAnalysis {
    const suggestions = [...analysis.suggestions];
    
    // Adicionar sugestões específicas baseadas no contexto
    if (analysis.medicalRelevance === 'high') {
      suggestions.push('Considere consultar um especialista');
      suggestions.push('Documente esta informação no prontuário');
    }
    
    if (analysis.type === 'document') {
      suggestions.push('Verifique a autenticidade do documento');
      suggestions.push('Confirme as informações com o paciente');
    }
    
    return {
      ...analysis,
      suggestions
    };
  }

  /**
   * Salva análise multimodal
   */
  private async saveMultimodalAnalysis(
    analysis: MultimodalAnalysis,
    context: { clinicId: string; userId: string; purpose: string }
  ): Promise<void> {
    try {
      await this.supabase
        .from('ai_multimodal_analysis')
        .insert({
          type: analysis.type,
          content: analysis.content,
          extracted_text: analysis.extractedText,
          detected_objects: analysis.detectedObjects,
          medical_relevance: analysis.medicalRelevance,
          confidence: analysis.confidence,
          suggestions: analysis.suggestions,
          processing_time: analysis.processingTime,
          clinic_id: context.clinicId,
          user_id: context.userId,
          purpose: context.purpose,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar análise multimodal:', error);
    }
  }

  // Métodos auxiliares de parsing
  private parseImageAnalysisResponse(response: string): ImageAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.getDefaultImageAnalysis();
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        detectedObjects: parsed.detectedObjects || [],
        medicalRelevance: parsed.medicalRelevance || 'low',
        potentialIssues: parsed.potentialIssues || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Erro ao parsear resposta de análise de imagem:', error);
      return this.getDefaultImageAnalysis();
    }
  }

  private parseDocumentAnalysisResponse(response: string): DocumentAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return this.getDefaultDocumentAnalysis();
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        documentType: parsed.documentType || 'other',
        extractedFields: parsed.extractedFields || {},
        medicalTerms: parsed.medicalTerms || [],
        recommendations: parsed.recommendations || [],
        confidence: parsed.confidence || 0.5
      };
    } catch (error) {
      console.error('Erro ao parsear resposta de análise de documento:', error);
      return this.getDefaultDocumentAnalysis();
    }
  }

  private parseAudioAnalysisResponse(response: string): {
    medicalRelevance: 'high' | 'medium' | 'low';
    confidence: number;
    recommendations: string[];
  } {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return { medicalRelevance: 'low', confidence: 0.5, recommendations: [] };
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        medicalRelevance: parsed.medicalRelevance || 'low',
        confidence: parsed.confidence || 0.5,
        recommendations: parsed.recommendations || []
      };
    } catch (error) {
      console.error('Erro ao parsear resposta de análise de áudio:', error);
      return { medicalRelevance: 'low', confidence: 0.5, recommendations: [] };
    }
  }

  // Métodos auxiliares
  private performLocalImageAnalysis(input: MultimodalInput): ImageAnalysis {
    // Análise local básica baseada em metadados
    return {
      detectedObjects: [],
      medicalRelevance: 'low',
      potentialIssues: [],
      recommendations: ['Considere enviar para análise especializada'],
      confidence: 0.3
    };
  }

  private combineImageAnalyses(ai: ImageAnalysis, local: ImageAnalysis): ImageAnalysis {
    return {
      detectedObjects: [...new Set([...ai.detectedObjects, ...local.detectedObjects])],
      medicalRelevance: ai.confidence > local.confidence ? ai.medicalRelevance : local.medicalRelevance,
      potentialIssues: [...new Set([...ai.potentialIssues, ...local.potentialIssues])],
      recommendations: [...new Set([...ai.recommendations, ...local.recommendations])],
      confidence: Math.max(ai.confidence, local.confidence)
    };
  }

  private determineMedicalRelevance(documentType: string): 'high' | 'medium' | 'low' {
    const highRelevance = ['prescription', 'exam_result', 'medical_record'];
    const mediumRelevance = ['insurance', 'consent_form'];
    
    if (highRelevance.includes(documentType)) return 'high';
    if (mediumRelevance.includes(documentType)) return 'medium';
    return 'low';
  }

  // Métodos de fallback
  private getDefaultAnalysis(type: string): MultimodalAnalysis {
    return {
      type: type as 'image' | 'document' | 'audio' | 'video',
      content: 'Análise não disponível',
      confidence: 0.5,
      suggestions: ['Tente novamente ou contate suporte'],
      processingTime: 0
    };
  }

  private getDefaultImageAnalysis(): ImageAnalysis {
    return {
      detectedObjects: [],
      medicalRelevance: 'low',
      potentialIssues: [],
      recommendations: ['Considere enviar para análise especializada'],
      confidence: 0.5
    };
  }

  private getDefaultDocumentAnalysis(): DocumentAnalysis {
    return {
      documentType: 'other',
      extractedFields: {},
      medicalTerms: [],
      recommendations: ['Verifique o formato do documento'],
      confidence: 0.5
    };
  }

  private getDefaultAudioAnalysis(): MultimodalAnalysis {
    return {
      type: 'audio',
      content: 'Análise de áudio não disponível',
      confidence: 0.5,
      suggestions: ['Verifique a qualidade do áudio'],
      processingTime: 0
    };
  }

  private getDefaultVideoAnalysis(): MultimodalAnalysis {
    return {
      type: 'video',
      content: 'Análise de vídeo não disponível',
      confidence: 0.5,
      suggestions: ['Verifique a qualidade do vídeo'],
      processingTime: 0
    };
  }
} 