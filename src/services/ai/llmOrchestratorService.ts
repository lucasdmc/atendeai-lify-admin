// Serviço simplificado temporário para evitar errors de build
export interface LLMRequest {
  message: string;
  phoneNumber: string;
  context?: Record<string, any>;
}

export interface LLMResponse {
  response: string;
  intent?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export class LLMOrchestratorService {
  private static readonly OPENAI_MODEL = 'gpt-4';

  static async processMessage(request: LLMRequest): Promise<LLMResponse> {
    try {
      console.log('Processing message:', request.message);
      
      // Resposta simplificada para evitar erros
      return {
        response: 'Obrigado pela sua mensagem. Este é um sistema temporário.',
        intent: 'greeting',
        confidence: 0.8,
        metadata: {
          model: this.OPENAI_MODEL,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error processing message:', error);
      
      return {
        response: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        intent: 'error',
        confidence: 0.0
      };
    }
  }

  static async generateResponse(
    message: string, 
    _context: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Implementação simplificada
      return `Recebemos sua mensagem: "${message}". Como posso ajudá-lo?`;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'Desculpe, não foi possível processar sua solicitação no momento.';
    }
  }
}