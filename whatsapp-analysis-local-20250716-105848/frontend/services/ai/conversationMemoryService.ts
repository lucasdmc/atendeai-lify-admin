// Serviço simplificado temporário para evitar errors de build
export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationMemory {
  phoneNumber: string;
  history: ConversationTurn[];
  userProfile: {
    phone: string;
    name?: string;
    email?: string;
    lastInteraction: Date;
  };
  context: Record<string, any>;
  loopCount: number;
  frustrationLevel: number;
  topics: string[];
}

export class ConversationMemoryService {
  private static memoryCache = new Map<string, ConversationMemory>();

  static async loadMemory(phoneNumber: string): Promise<ConversationMemory> {
    // Versão simplificada para evitar erros de build
    return {
      phoneNumber,
      history: [],
      userProfile: {
        phone: phoneNumber,
        lastInteraction: new Date()
      },
      context: {},
      loopCount: 0,
      frustrationLevel: 0,
      topics: []
    };
  }

  static async saveMemory(phoneNumber: string, memory: ConversationMemory): Promise<void> {
    // Cache local temporário
    this.memoryCache.set(phoneNumber, memory);
    console.log('Memory saved to cache:', phoneNumber);
  }

  static async clearMemory(phoneNumber: string): Promise<void> {
    this.memoryCache.delete(phoneNumber);
    console.log('Memory cleared for:', phoneNumber);
  }

  static async addInteraction(
    phoneNumber: string,
    userMessage: string,
    botResponse: string,
    _intent?: string
  ): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    
    memory.history.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    });

    memory.history.push({
      role: 'assistant', 
      content: botResponse,
      timestamp: new Date()
    });

    await this.saveMemory(phoneNumber, memory);
  }
}