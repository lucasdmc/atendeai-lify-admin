// src/services/ai/conversationMemoryService.ts

import { supabase } from '@/integrations/supabase/client';
import { Intent } from './types';

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
      // Buscar dados da memória persistente
      const { data: memoryData } = await supabase
        .from('conversation_memory' as any)
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      // Buscar histórico de mensagens
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('conversation_id', `conv_${phoneNumber.replace(/\D/g, '')}`)
        .order('timestamp', { ascending: true })
        .limit(this.MAX_HISTORY_SIZE);

      // Buscar dados da conversa
      const { data: conversationData } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      // Extrair nome do usuário (lidar com string JSON)
      let userName: string | undefined = undefined;
      if (memoryData?.user_name) {
        try {
          // Se user_name é uma string JSON, fazer parse
          if (typeof memoryData.user_name === 'string') {
            // Verificar se é JSON válido
            if (memoryData.user_name.startsWith('{') && memoryData.user_name.endsWith('}')) {
              const parsedUserName = JSON.parse(memoryData.user_name);
              userName = parsedUserName.name;
            } else {
              // Se não é JSON, usar como nome direto
              userName = memoryData.user_name;
            }
          } else if ((memoryData.user_name as any).name) {
            // Se já é um objeto
            userName = (memoryData.user_name as any).name;
          }
        } catch (error) {
          console.error('Error parsing user_name:', error);
          // Se falhar o parse, usar como string direta
          userName = memoryData.user_name;
        }
      } else if (conversationData?.name && conversationData.name !== phoneNumber) {
        userName = conversationData.name;
      }

      // Construir memória
      const memory: ConversationMemory = {
        phoneNumber,
        history: this.buildHistory(messages || []),
        userProfile: {
          phone: phoneNumber,
          name: userName || '',
          email: conversationData?.email || '',
          lastInteraction: memoryData?.last_interaction ? new Date(memoryData.last_interaction) : new Date()
        },
        context: memoryData?.memory_data?.context || {},
        loopCount: memoryData?.memory_data?.loopCount || 0,
        frustrationLevel: memoryData?.memory_data?.frustrationLevel || 0,
        topics: memoryData?.memory_data?.topics || []
      };

      // Atualizar cache
      this.memoryCache.set(phoneNumber, memory);
      
      console.log(`🧠 Memory loaded for ${phoneNumber}: ${userName || 'no name'}`);
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
    const memory = await this.loadMemory(phoneNumber);

    // Extrair nome se presente na mensagem
    const extractedName = this.extractUserName(userMessage);
    if (extractedName && !memory.userProfile.name) {
      memory.userProfile.name = extractedName;
      console.log(`👤 Nome extraído e salvo: ${extractedName}`);
    }

    // Adicionar mensagem do usuário
    memory.history.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      intent,
      metadata: {
        confidence: intent.confidence,
        entities: intent.entities
      }
    });

    // Adicionar resposta do assistente
    memory.history.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
      intent,
      metadata: {
        intent: intent.name,
        category: intent.category
      }
    });

    // Atualizar análise de sentimento
    this.updateSentimentAnalysis(memory, userMessage);

    // Atualizar tópicos
    this.updateTopics(memory, intent);

    // Manter apenas histórico recente
    if (memory.history.length > this.MAX_HISTORY_SIZE) {
      memory.history = memory.history.slice(-this.MAX_HISTORY_SIZE);
    }

    // Salvar no cache e banco
    this.memoryCache.set(phoneNumber, memory);
    await this.saveMemoryData(phoneNumber, memory);

    console.log(`💾 Memory saved for: ${phoneNumber}`);
  }

  /**
   * Extrai nome do usuário da mensagem
   */
  private static extractUserName(message: string): string | null {
    const namePatterns = [
      /me chamo ([^,\.!?]+)/i,
      /meu nome é ([^,\.!?]+)/i,
      /sou o ([^,\.!?]+)/i,
      /sou a ([^,\.!?]+)/i,
      /eu sou ([^,\.!?]+)/i,
      /chamo-me ([^,\.!?]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match) {
        const name = match[1].trim();
        // Verificar se o nome não é muito longo (provavelmente pegou texto extra)
        if (name.length <= 50 && !name.includes('tudo bem') && !name.includes('qual')) {
          return name;
        }
      }
    }

    return null;
  }

  /**
   * Obtém histórico recente
   */
  static getRecentHistory(memory: ConversationMemory, limit: number = 10): ConversationTurn[] {
    return memory.history.slice(-limit);
  }

  /**
   * Obtém perfil do usuário
   */
  static getUserProfile(memory: ConversationMemory): UserProfile {
    return memory.userProfile;
  }

  /**
   * Obtém contador de loops
   */
  static getLoopCount(memory: ConversationMemory): number {
    return memory.loopCount;
  }

  /**
   * Obtém nível de frustração
   */
  static getFrustrationLevel(memory: ConversationMemory): number {
    return memory.frustrationLevel;
  }

  /**
   * Reseta contador de loops
   */
  static async resetLoopCount(phoneNumber: string): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    memory.loopCount = 0;
    await this.saveMemoryData(phoneNumber, memory);
  }

  /**
   * Incrementa contador de loops
   */
  static async incrementLoopCount(phoneNumber: string): Promise<void> {
    const memory = await this.loadMemory(phoneNumber);
    memory.loopCount++;
    await this.saveMemoryData(phoneNumber, memory);
  }

  /**
   * Atualiza contexto da conversa
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
   * Constrói histórico a partir de mensagens do banco
   */
  private static buildHistory(messages: any[]): ConversationTurn[] {
    return messages.map(msg => ({
      role: msg.message_type === 'received' ? 'user' : 'assistant',
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      metadata: {
        messageId: msg.id,
        conversationId: msg.conversation_id
      }
    }));
  }

  /**
   * Verifica se cache ainda é válido
   */
  private static isCacheValid(memory: ConversationMemory): boolean {
    const now = Date.now();
    const lastInteraction = memory.userProfile.lastInteraction?.getTime() || 0;
    return (now - lastInteraction) < this.CACHE_TTL;
  }

  /**
   * Atualiza análise de sentimento
   */
  private static updateSentimentAnalysis(memory: ConversationMemory, message: string): void {
    const negativeWords = ['não', 'nunca', 'ruim', 'péssimo', 'horrível', 'irritado', 'frustrado'];
    const positiveWords = ['obrigado', 'ótimo', 'excelente', 'perfeito', 'satisfeito', 'feliz'];

    const lowerMessage = message.toLowerCase();
    let sentiment = 0;

    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) sentiment -= 0.2;
    });

    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) sentiment += 0.2;
    });

    // Atualizar nível de frustração
    if (sentiment < -0.3) {
      memory.frustrationLevel = Math.min(1.0, memory.frustrationLevel + 0.1);
    } else if (sentiment > 0.3) {
      memory.frustrationLevel = Math.max(0.0, memory.frustrationLevel - 0.1);
    }
  }

  /**
   * Atualiza tópicos da conversa
   */
  private static updateTopics(memory: ConversationMemory, intent: Intent): void {
    const topic = this.mapIntentToTopic(intent.name);
    if (topic && !memory.topics.includes(topic)) {
      memory.topics.push(topic);
    }
  }

  /**
   * Mapeia intenção para tópico
   */
  private static mapIntentToTopic(intentName: string): string | null {
    const topicMap: Record<string, string> = {
      'APPOINTMENT_CREATE': 'agendamento',
      'APPOINTMENT_RESCHEDULE': 'agendamento',
      'APPOINTMENT_CANCEL': 'agendamento',
      'INFO_HOURS': 'horários',
      'INFO_LOCATION': 'localização',
      'INFO_SERVICES': 'serviços',
      'INFO_DOCTORS': 'profissionais',
      'INFO_PRICES': 'preços'
    };

    return topicMap[intentName] || null;
  }

  /**
   * Salva dados da memória no banco
   */
  private static async saveMemoryData(phoneNumber: string, memory: ConversationMemory): Promise<void> {
    try {
      const memoryData = {
        phone_number: phoneNumber,
        user_name: memory.userProfile.name ? JSON.stringify({
          name: memory.userProfile.name,
          extracted_at: new Date().toISOString()
        }) : null,
        last_interaction: new Date().toISOString(),
        interaction_count: memory.history.length,
        memory_data: {
          context: memory.context,
          loopCount: memory.loopCount,
          frustrationLevel: memory.frustrationLevel,
          topics: memory.topics
        }
      };

      const { error } = await supabase
        .from('conversation_memory' as any)
        .upsert(memoryData, { onConflict: 'phone_number' });

      if (error) {
        console.error('Error saving memory data:', error);
      }
    } catch (error) {
      console.error('Error saving memory data:', error);
    }
  }
}