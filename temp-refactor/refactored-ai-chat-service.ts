// src/services/aiChatService.ts - VERSÃO REFATORADA

import { LLMOrchestratorService } from './ai/llmOrchestratorService';
import { RAGEngineService } from './ai/ragEngineService';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessMessageRequest {
  phoneNumber: string;
  message: string;
  conversationId?: string;
  messageId?: string;
}

export class AIChatService {
  private static isInitialized = false;

  /**
   * Inicializa o serviço de IA
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing AI Chat Service...');
      
      // Inicializar RAG Engine com a base de conhecimento
      await RAGEngineService.initializeKnowledgeBase();
      
      // Verificar configurações do agente IA
      await this.loadAgentConfiguration();
      
      this.isInitialized = true;
      console.log('✅ AI Chat Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AI Chat Service:', error);
      throw error;
    }
  }

  /**
   * Processa uma mensagem recebida
   */
  static async processMessage(request: ProcessMessageRequest): Promise<string> {
    try {
      // Garantir inicialização
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log('📨 Processing message:', {
        phone: request.phoneNumber,
        message: request.message.substring(0, 50) + '...'
      });

      // Obter ou criar ID da conversa
      const conversationId = request.conversationId || 
        await this.getOrCreateConversation(request.phoneNumber);

      // Chamar o orquestrador principal
      const response = await LLMOrchestratorService.processMessage({
        phoneNumber: request.phoneNumber,
        message: request.message,
        conversationId,
        userId: await this.getUserId()
      });

      // Salvar mensagem e resposta no banco
      await this.saveMessageExchange(
        conversationId,
        request.message,
        response.response,
        response.intent
      );

      // Verificar se precisa notificar equipe (escalação)
      if (response.escalateToHuman) {
        await this.notifyHumanAgent(conversationId, request.phoneNumber);
      }

      return response.response;

    } catch (error) {
      console.error('❌ Error processing message:', error);
      
      // Resposta de fallback
      return this.getFallbackResponse();
    }
  }

  /**
   * Obtém ou cria uma conversa
   */
  private static async getOrCreateConversation(phoneNumber: string): Promise<string> {
    try {
      // Buscar conversa existente
      const { data: existing } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('phone_number', phoneNumber)
        .single();

      if (existing) return existing.id;

      // Criar nova conversa
      const { data: newConversation, error } = await supabase
        .from('whatsapp_conversations')
        .insert({
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (error) throw error;

      return newConversation.id;
    } catch (error) {
      console.error('Error managing conversation:', error);
      throw error;
    }
  }

  /**
   * Salva a troca de mensagens
   */
  private static async saveMessageExchange(
    conversationId: string,
    userMessage: string,
    aiResponse: string,
    intent: any
  ): Promise<void> {
    try {
      // Salvar mensagem do usuário
      await supabase.from('whatsapp_messages').insert({
        conversation_id: conversationId,
        content: userMessage,
        message_type: 'received',
        timestamp: new Date().toISOString()
      });

      // Salvar resposta da IA
      await supabase.from('whatsapp_messages').insert({
        conversation_id: conversationId,
        content: aiResponse,
        message_type: 'sent',
        timestamp: new Date().toISOString(),
        metadata: {
          intent: intent.name,
          confidence: intent.confidence,
          toolsUsed: intent.toolsUsed
        }
      });

      // Atualizar última mensagem na conversa
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_message_preview: userMessage.substring(0, 100),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }

  /**
   * Carrega configuração do agente IA
   */
  private static async loadAgentConfiguration(): Promise<void> {
    try {
      const { data } = await supabase
        .from('clinics')
        .select('knowledge_base')
        .single();

      if (data?.knowledge_base?.agente_ia) {
        const config = data.knowledge_base.agente_ia.configuracao;
        console.log('🤖 Agent configuration loaded:', {
          name: config.nome,
          personality: config.personalidade,
          languages: config.idiomas
        });
      }
    } catch (error) {
      console.error('Error loading agent configuration:', error);
    }
  }

  /**
   * Obtém ID do usuário atual
   */
  private static async getUserId(): Promise<string | undefined> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id;
  }

  /**
   * Notifica agente humano sobre escalação
   */
  private static async notifyHumanAgent(conversationId: string, phoneNumber: string): Promise<void> {
    try {
      // Implementar notificação (webhook, email, etc.)
      console.log('🚨 Notifying human agent for escalation:', {
        conversationId,
        phoneNumber
      });

      // Aqui você pode implementar:
      // - Envio de email
      // - Notificação push
      // - Webhook para sistema externo
      // - SMS para equipe
    } catch (error) {
      console.error('Error notifying human agent:', error);
    }
  }

  /**
   * Resposta de fallback em caso de erro
   */
  private static getFallbackResponse(): string {
    return 'Desculpe, estou com dificuldades técnicas no momento. ' +
           'Por favor, tente novamente em alguns instantes ou entre em contato pelo telefone. ' +
           'Nossa equipe está sempre pronta para atendê-lo!';
  }

  /**
   * Métodos auxiliares para tipos específicos de mensagens
   */
  
  /**
   * Processa mensagem de áudio (futura implementação)
   */
  static async processAudioMessage(audioUrl: string, phoneNumber: string): Promise<string> {
    // TODO: Implementar transcrição de áudio
    // 1. Download do áudio
    // 2. Transcrição usando serviço de STT
    // 3. Processar texto transcrito
    return 'Desculpe, ainda não consigo processar mensagens de áudio. Por favor, envie sua mensagem em texto.';
  }

  /**
   * Processa imagem (futura implementação)
   */
  static async processImageMessage(imageUrl: string, phoneNumber: string): Promise<string> {
    // TODO: Implementar análise de imagem
    // 1. Análise com Vision API
    // 2. Extrair texto se houver (OCR)
    // 3. Processar conteúdo
    return 'Recebi sua imagem. No momento, consigo ajudá-lo melhor através de mensagens de texto. Como posso ajudar?';
  }

  /**
   * Processa localização (futura implementação)
   */
  static async processLocationMessage(latitude: number, longitude: number, phoneNumber: string): Promise<string> {
    // TODO: Implementar análise de localização
    // 1. Calcular distância até a clínica
    // 2. Fornecer direções
    return 'Recebi sua localização. Nossa clínica fica em [endereço]. Precisa de ajuda com direções?';
  }
}