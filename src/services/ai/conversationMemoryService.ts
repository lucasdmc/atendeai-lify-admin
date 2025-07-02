import { supabase } from '@/integrations/supabase/client';
import { Intent } from './intentRecognitionService';

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  intent?: Intent;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  phone: string;
  name?: string;
  email?: string;
  preferences?: Record<string, any>;
  appointmentHistory?: number;
  lastInteraction?: Date;
}

export interface ConversationMemory {
  phoneNumber: string;
  history: ConversationTurn[];
  userProfile: UserProfile;
  context: Record<string, any>;
  loopCount: number;
  frustrationLevel: number;
  topics: string[];
}

export class ConversationMemoryService {
  private static memoryCache: Map<string, ConversationMemory> = new Map();
  private static readonly MAX_HISTORY_SIZE = 50;
  private static readonly CACHE_TTL = 3600000; // 1 hora

  /**
   * Carrega a memória de uma conversa
   */
  static async loadMemory(phoneNumber: string): Promise<ConversationMemory> {
    // Verificar cache primeiro
    const cached = this.memoryCache.get(phoneNumber);
    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    try {
      // Buscar dados do banco
      const { data: memoryData } = await supabase
        .from('whatsapp_conversation_memory')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      // Buscar histórico recente
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', `conv_${phoneNumber.replace(/\D/g, '')}`)
        .order('timestamp', { ascending: false })
        .limit(this.MAX_HISTORY_SIZE);

      // Buscar perfil do usuário
      const { data: userData } = await supabase
        .from('whatsapp_conversations')
        .select('name, email')
        .eq('phone_number', phoneNumber)
        .single();

      // Construir memória
      const memory: ConversationMemory = {
        phoneNumber,
        history: this.buildHistory(messages || []),
        userProfile: {
          phone: phoneNumber,
          name: userData?.name,
          email: userData?.email,
          lastInteraction: new Date()
        },
        context: memoryData?.memory_data?.context || {},
        loopCount: memoryData?.memory_data?.loopCount || 0,
        frustrationLevel: memoryData?.memory_data?.frustrationLevel || 0,
        topics: memoryData?.memory_data?.topics || []
      };

      // Atualizar cache
      this.memoryCache.set(phoneNumber, memory);
      
      return memory;
    } catch (error) {
      console.error('Error loading memory:', error);
      
      // Retornar memória vazia se não existir
      return {
        phoneNumber,
        history: [],
        userProfile: { phone: phoneNumber },
        context: {},
        loopCount: 0,
        frustrationLevel: 0,
        topics: []
      };
    }
  }

  /**
   * Salva uma interação na memória
   */
  static async saveInteraction(
    phoneNumber: string,
    userMessage: string,
    assistantResponse: string,
    intent: Intent
  ): Promise<void> {
    try {
      const memory = await this.loadMemory(phoneNumber);
      
      // Adicionar ao histórico
      memory.history.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        intent
      });
      
      memory.history.push({
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      });

      // Limitar tamanho do histórico
      if (memory.history.length > this.MAX_HISTORY_SIZE) {
        memory.history = memory.history.slice(-this.MAX_HISTORY_SIZE);
      }

      // Atualizar análise de sentimento
      this.updateSentimentAnalysis(memory, userMessage);
      
      // Extrair e atualizar tópicos
      this.updateTopics(memory, intent);
      
      // Salvar no banco
      await supabase
        .from('whatsapp_conversation_memory')
        .upsert({
          phone_number: phoneNumber,
          memory_data: {
            history: memory.history,
            context: memory.context,
            loopCount: memory.loopCount,
            frustrationLevel: memory.frustrationLevel,
            topics: memory.topics,
            lastUpdate: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        });

      // Atualizar cache
      this.memoryCache.set(phoneNumber, memory);
    } catch (error) {
      console.error('Error saving interaction:', error);
    }
  }

  /**
   * Obtém o histórico recente formatado
   */
  static getRecentHistory(memory: ConversationMemory, limit: number = 10): ConversationTurn[] {
    return memory.history.slice(-limit);
  }

  /**
   * Obtém o perfil do usuário
   */
  static getUserProfile(memory: ConversationMemory): UserProfile {
    return memory.userProfile;
  }

  /**
   * Obtém a contagem de loops
   */
  static getLoopCount(memory: ConversationMemory): number {
    return memory.loopCount;
  }

  /**
   * Obtém o nível de frustração
   */
  static getFrustrationLevel(memory: ConversationMemory): number {
    return memory.frustrationLevel;
  }

  /**
   * Reseta a memória de loops
   */
  static async resetLoopCount(phoneNumber: string): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    memory.loopCount = 0;
    await this.saveMemoryData(phoneNumber, memory);
  }

  /**
   * Incrementa a contagem de loops
   */
  static async incrementLoopCount(phoneNumber: string): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    memory.loopCount += 1;
    await this.saveMemoryData(phoneNumber, memory);
  }

  /**
   * Atualiza contexto
   */
  static async updateContext(
    phoneNumber: string,
    key: string,
    value: any
  ): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    memory.context[key] = value;
    await this.saveMemoryData(phoneNumber, memory);
  }

  /**
   * Constrói histórico a partir das mensagens do banco
   */
  private static buildHistory(messages: any[]): ConversationTurn[] {
    return (messages || []).reverse().map(msg => ({
      role: msg.message_type === 'received' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      metadata: msg.metadata
    }));
  }

  /**
   * Verifica validade do cache
   */
  private static isCacheValid(memory: ConversationMemory): boolean {
    if (!memory || !memory.userProfile?.lastInteraction) return false;
    const now = Date.now();
    const last = memory.userProfile.lastInteraction.getTime();
    return now - last < this.CACHE_TTL;
  }

  /**
   * Atualiza análise de sentimento (simples)
   */
  private static updateSentimentAnalysis(memory: ConversationMemory, message: string): void {
    // Exemplo simples: aumenta frustração se mensagem contém palavras negativas
    const negativeWords = ['ruim', 'péssimo', 'demora', 'problema', 'erro', 'não gostei'];
    if (negativeWords.some(w => message.toLowerCase().includes(w))) {
      memory.frustrationLevel = Math.min(1, memory.frustrationLevel + 0.2);
    } else {
      memory.frustrationLevel = Math.max(0, memory.frustrationLevel - 0.1);
    }
  }

  /**
   * Atualiza tópicos
   */
  private static updateTopics(memory: ConversationMemory, intent: Intent): void {
    const topic = this.mapIntentToTopic(intent.name);
    if (topic && !memory.topics.includes(topic)) {
      memory.topics.push(topic);
    }
  }

  private static mapIntentToTopic(intentName: string): string | null {
    if (intentName.startsWith('APPOINTMENT_')) return 'agendamento';
    if (intentName.startsWith('INFO_')) return 'informacao';
    if (intentName === 'HUMAN_HANDOFF') return 'escalação';
    return null;
  }

  private static async saveMemoryData(phoneNumber: string, memory: ConversationMemory): Promise<void> {
    await supabase
      .from('whatsapp_conversation_memory')
      .upsert({
        phone_number: phoneNumber,
        memory_data: {
          history: memory.history,
          context: memory.context,
          loopCount: memory.loopCount,
          frustrationLevel: memory.frustrationLevel,
          topics: memory.topics,
          lastUpdate: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      });
    this.memoryCache.set(phoneNumber, memory);
  }
} 