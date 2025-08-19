// ========================================
// CLIENTE OPENAI API
// ========================================

import OpenAI from 'openai';
import { defaultAIConfig, AI_MODELS } from '../../../config/ai-config';

export class OpenAIClient {
  private static instance: OpenAIClient;
  private client: OpenAI;

  private constructor() {
    this.client = new OpenAI({
      apiKey: defaultAIConfig.openai.apiKey,
      organization: defaultAIConfig.openai.organization,
      baseURL: defaultAIConfig.openai.baseURL,
    });
  }

  public static getInstance(): OpenAIClient {
    if (!OpenAIClient.instance) {
      OpenAIClient.instance = new OpenAIClient();
    }
    return OpenAIClient.instance;
  }

  // Chat Completion
  async chatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    model: string = AI_MODELS.GPT_4O,
    options?: {
      temperature?: number;
      maxTokens?: number;
      stream?: boolean;
    }
  ) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
        stream: options?.stream ?? false,
      });

      return response;
    } catch (error) {
      console.error('OpenAI Chat Completion Error:', error);
      throw new Error(`OpenAI API Error: ${error}`);
    }
  }

  // Embeddings
  async createEmbedding(
    text: string,
    model: string = 'text-embedding-3-small'
  ) {
    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('OpenAI Embedding Error:', error);
      throw new Error(`OpenAI Embedding Error: ${error}`);
    }
  }

  // Whisper (Speech-to-Text)
  async transcribeAudio(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      prompt?: string;
      responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
    }
  ) {
    try {
      const response = await this.client.audio.transcriptions.create({
        file: audioBuffer as any,
        model: 'whisper-1',
        language: options?.language ?? 'pt',
        prompt: options?.prompt,
        response_format: options?.responseFormat ?? 'text',
      });

      return response;
    } catch (error) {
      console.error('OpenAI Whisper Error:', error);
      throw new Error(`OpenAI Whisper Error: ${error}`);
    }
  }

  // TTS (Text-to-Speech)
  async textToSpeech(
    text: string,
    options?: {
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      responseFormat?: 'mp3' | 'opus' | 'aac' | 'flac';
      speed?: number;
    }
  ) {
    try {
      const response = await this.client.audio.speech.create({
        model: 'tts-1',
        voice: options?.voice ?? 'alloy',
        input: text,
        response_format: options?.responseFormat ?? 'mp3',
        speed: options?.speed ?? 1.0,
      });

      return response;
    } catch (error) {
      console.error('OpenAI TTS Error:', error);
      throw new Error(`OpenAI TTS Error: ${error}`);
    }
  }

  // Vision (GPT-4V)
  async visionAnalysis(
    imageUrl: string,
    prompt: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ) {
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: options?.maxTokens ?? 1000,
        temperature: options?.temperature ?? 0.7,
      });

      return response;
    } catch (error) {
      console.error('OpenAI Vision Error:', error);
      throw new Error(`OpenAI Vision Error: ${error}`);
    }
  }

  // Moderation
  async moderateContent(text: string) {
    try {
      const response = await this.client.moderations.create({
        input: text,
      });

      return response.results[0];
    } catch (error) {
      console.error('OpenAI Moderation Error:', error);
      throw new Error(`OpenAI Moderation Error: ${error}`);
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await this.client.models.list();
      return {
        success: true,
        models: response.data.length,
        message: 'OpenAI connection successful',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'OpenAI connection failed',
      };
    }
  }
}

export default OpenAIClient.getInstance(); 