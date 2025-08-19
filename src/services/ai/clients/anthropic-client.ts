// ========================================
// CLIENTE ANTHROPIC API (CLAUDE)
// ========================================

import Anthropic from '@anthropic-ai/sdk';
import { defaultAIConfig, AI_MODELS } from '../../../config/ai-config';

export class AnthropicClient {
  private static instance: AnthropicClient;
  private client: Anthropic;

  private constructor() {
    this.client = new Anthropic({
      apiKey: defaultAIConfig.anthropic.apiKey,
      baseURL: defaultAIConfig.anthropic.baseURL,
    });
  }

  public static getInstance(): AnthropicClient {
    if (!AnthropicClient.instance) {
      AnthropicClient.instance = new AnthropicClient();
    }
    return AnthropicClient.instance;
  }

  // Chat Completion
  async chatCompletion(
    messages: Anthropic.Messages.MessageParam[],
    model: string = AI_MODELS.CLAUDE_3_5_SONNET,
    options?: {
      temperature?: number;
      maxTokens?: number;
      system?: string;
    }
  ) {
    try {
      const requestBody: any = {
        model,
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 1000,
      };

      if (options?.system) {
        requestBody.system = options.system;
      }

      const response = await this.client.messages.create(requestBody);

      return response;
    } catch (error) {
      console.error('Anthropic Chat Completion Error:', error);
      throw new Error(`Anthropic API Error: ${error}`);
    }
  }

  // Test connection
  async testConnection() {
    try {
      const response = await this.client.messages.create({
        model: AI_MODELS.CLAUDE_3_5_SONNET,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello',
          },
        ],
      });

      const textContent = response.content.find(c => c.type === 'text');
      return {
        success: true,
        message: 'Anthropic connection successful',
        response: textContent ? (textContent as any).text : 'Response received',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Anthropic connection failed',
      };
    }
  }
}

export default AnthropicClient.getInstance(); 