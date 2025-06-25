
import { ConversationMemory } from './conversation-memory.ts';
import { SentimentAnalysis } from './sentiment-analyzer.ts';

export interface ResponseContext {
  memory: ConversationMemory;
  sentiment: SentimentAnalysis;
  timeContext: {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    dayOfWeek: string;
    isBusinessHours: boolean;
  };
  userMessage: string;
  conversationFlow: string;
}

export class ResponseContextBuilder {
  static buildContext(
    memory: ConversationMemory,
    sentiment: SentimentAnalysis,
    timeContext: ResponseContext['timeContext'],
    userMessage: string
  ): ResponseContext {
    return {
      memory,
      sentiment,
      timeContext,
      userMessage,
      conversationFlow: 'ongoing'
    };
  }

  static getSpecificContext(memory: ConversationMemory, userMessage: string): string {
    let context = '';
    
    if (memory.conversationContext.currentTopic) {
      context += `Tópico atual da conversa: ${memory.conversationContext.currentTopic}. `;
    }
    
    if (memory.conversationContext.followUpNeeded) {
      context += 'Follow-up necessário com este paciente. ';
    }
    
    if (memory.conversationContext.lastInteractionSentiment !== 'neutral') {
      context += `Última interação teve sentimento: ${memory.conversationContext.lastInteractionSentiment}. `;
    }
    
    return context;
  }
}
