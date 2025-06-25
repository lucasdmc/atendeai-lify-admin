
import { ConversationMemoryManager } from './conversation-memory.ts';
import { SentimentAnalyzer } from './sentiment-analyzer.ts';
import { ResponseContextBuilder } from './response-context-builder.ts';
import { TimeContextManager } from './time-context-manager.ts';
import { ResponsePromptGenerator } from './response-prompt-generator.ts';

export class HumanizedResponseGenerator {
  static async generateHumanizedResponse(
    userMessage: string,
    phoneNumber: string,
    supabase: any,
    contextData: any[],
    conversationHistory: any[]
  ): Promise<string> {
    // Carregar memória do usuário
    const memory = await ConversationMemoryManager.loadMemory(phoneNumber, supabase);
    
    // Analisar sentimento da mensagem
    const sentiment = SentimentAnalyzer.analyzeSentiment(userMessage);
    
    // Adaptar personalidade baseado na mensagem
    ConversationMemoryManager.adaptPersonality(memory, userMessage);
    
    // Obter contexto temporal
    const timeContext = TimeContextManager.getCurrentTimeContext();
    
    // Gerar contexto de resposta
    const responseContext = ResponseContextBuilder.buildContext(
      memory,
      sentiment,
      timeContext,
      userMessage
    );
    
    // Gerar prompt contextualizado
    const contextualPrompt = ResponsePromptGenerator.generateContextualPrompt(responseContext);
    
    // Atualizar histórico de interação
    ConversationMemoryManager.updateInteractionHistory(
      memory, 
      memory.conversationContext.currentTopic || 'general',
      sentiment.primaryEmotion,
      'in_progress'
    );
    
    // Evoluir relacionamento baseado nas interações
    ConversationMemoryManager.evolveRelationship(memory);
    
    // Salvar memória atualizada
    await ConversationMemoryManager.saveMemory(phoneNumber, memory, supabase);
    
    return contextualPrompt;
  }
}
