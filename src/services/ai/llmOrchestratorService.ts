// src/services/ai/llmOrchestratorService.ts

import { IntentRecognitionService, Intent } from './intentRecognitionService';
import { RAGEngineService } from './ragEngineService';
import { ConversationMemoryService } from './conversationMemoryService';
import { ToolCallingService } from './toolCallingService';
import { PersonalizationService } from './personalizationService';
import { EnhancedClinicContextService } from './enhancedClinicContextService';
import { supabase } from '@/integrations/supabase/client';

export interface OrchestratorRequest {
  phoneNumber: string;
  message: string;
  conversationId: string;
  userId?: string;
}

export interface OrchestratorResponse {
  response: string;
  intent: Intent;
  toolsUsed?: string[];
  escalateToHuman?: boolean;
  metadata?: Record<string, any>;
}

export class LLMOrchestratorService {
  private static readonly SYSTEM_PROMPT = `Você é uma recepcionista virtual de uma clínica médica chamada {clinic_name}.
Sua personalidade é: {personality}

DIRETRIZES FUNDAMENTAIS:
1. Use EXCLUSIVAMENTE as informações fornecidas no contexto da clínica
2. Seja sempre cordial, profissional e empática
3. Para agendamentos, use as ferramentas disponíveis
4. Se não souber uma informação, diga educadamente que não possui essa informação
5. NUNCA invente informações ou dê conselhos médicos
6. Mantenha respostas concisas e objetivas (máximo 3 parágrafos)
7. Use o nome do usuário quando disponível para personalizar a conversa

FERRAMENTAS DISPONÍVEIS:
- create_appointment: Criar novo agendamento
- list_appointments: Listar agendamentos existentes
- cancel_appointment: Cancelar agendamento
- reschedule_appointment: Reagendar consulta
- check_availability: Verificar disponibilidade
- escalate_to_human: Transferir para atendente humano

Use as ferramentas quando necessário para executar ações no sistema.`;

  static async processMessage(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    try {
      console.log('🤖 Orchestrator processing:', request);

      // 1. Carregar memória da conversa
      const memory = await ConversationMemoryService.loadMemory(request.phoneNumber);
      const conversationHistory = ConversationMemoryService.getRecentHistory(memory, 10);
      const userProfile = ConversationMemoryService.getUserProfile(memory);

      console.log(`👤 Usuário: ${userProfile.name || 'Sem nome'} (${request.phoneNumber})`);
      console.log(`📝 Histórico: ${conversationHistory.length} mensagens`);

      // 1.5. Carregar contexto de personalização
      const personalization = await PersonalizationService.loadPersonalizationContext(request.phoneNumber);
      console.log('👤 Personalization loaded:', personalization.patientProfile.name);

      // 2. Reconhecer intenção com contexto avançado
      const enhancedContextService = new EnhancedClinicContextService();
      const userIntent = enhancedContextService.identifyIntent(request.message);
      
      const intent = await IntentRecognitionService.recognizeIntent({
        message: request.message,
        conversationHistory,
        clinicContext: await this.getClinicContext(),
        userProfile
      });

      // Usar intenção identificada pelo EnhancedClinicContextService se disponível
      if (userIntent && userIntent !== 'general') {
        intent.name = userIntent;
        console.log('🎯 [LLMOrchestrator] Intenção identificada:', userIntent);
      }

      console.log('📊 Intent recognized:', intent);

      // 3. Verificar se precisa escalar para humano
      if (this.shouldEscalateToHuman(intent, memory)) {
        await this.escalateToHuman(request.conversationId, 'Solicitação do usuário');
        return {
          response: 'Entendi que você precisa de um atendimento mais personalizado. Vou transferir você para um de nossos atendentes. Por favor, aguarde um momento.',
          intent,
          escalateToHuman: true
        };
      }

      // 4. Executar busca RAG
      const ragResponse = await RAGEngineService.retrieve({
        query: request.message,
        intent: intent.name,
        entities: intent.entities
      });

      console.log('📚 RAG retrieval complete:', ragResponse.sources);

      // 5. Preparar contexto para o LLM
      const systemPrompt = await this.prepareSystemPrompt();
      const messages = this.buildMessages(systemPrompt, conversationHistory, ragResponse.augmentedPrompt, userProfile);

      // 6. Decidir se precisa usar ferramentas
      let response: string;
      let toolsUsed: string[] = [];

      if (intent.requiresAction) {
        // Usar ferramentas para executar ações
        const toolResponse = await ToolCallingService.executeTools(intent, request);
        response = toolResponse.response;
        toolsUsed = toolResponse.toolsUsed;
      } else {
        // Gerar resposta direta via LLM
        const { data, error } = await supabase.functions.invoke('ai-chat-gpt4', {
          body: { messages }
        });

        if (error) throw error;
        response = data?.response || 'Desculpe, não consegui processar sua mensagem.';
      }

      // 6.5. Aplicar personalização na resposta
      response = PersonalizationService.generatePersonalizedMessage(
        response,
        personalization,
        intent.name
      );

      // 6.6. Adicionar sugestões personalizadas se apropriado
      if (intent.category === 'appointment' || intent.name === 'INFO_SERVICES') {
        const suggestions = await PersonalizationService.generatePersonalizedSuggestions(
          personalization,
          intent.entities.service
        );
        
        if (suggestions.length > 0) {
          response += '\n\n💡 ' + suggestions[0];
        }
      }

      // 6.7. Adaptar estilo de linguagem
      response = PersonalizationService.adaptLanguageStyle(response, personalization);

      // 7. Salvar na memória
      await ConversationMemoryService.saveInteraction(
        request.phoneNumber,
        request.message,
        response,
        intent
      );

      // 8. Verificar loops de conversa
      if (await this.checkForLoops(request.conversationId, response)) {
        console.warn('⚠️ Loop detected in conversation');
        await this.handleConversationLoop(request.conversationId);
      }

      return {
        response,
        intent,
        toolsUsed,
        metadata: {
          ragSources: ragResponse.sources,
          confidence: intent.confidence,
          userName: userProfile.name
        }
      };

    } catch (error) {
      console.error('❌ Orchestrator error:', error);
      return {
        response: 'Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente em alguns instantes ou entre em contato pelo telefone.',
        intent: {
          name: 'ERROR',
          confidence: 0,
          entities: {},
          requiresAction: false,
          category: 'support'
        }
      };
    }
  }

  private static async prepareSystemPrompt(): Promise<string> {
    // Usar EnhancedClinicContextService para navegação inteligente do JSON
    const enhancedContextService = new EnhancedClinicContextService();
    
    try {
      // Buscar dados da clínica com navegação inteligente
      const { data: clinicData } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .single();

      if (clinicData) {
        // Usar navegação inteligente do JSON
        const enhancedContext = await enhancedContextService.getEnhancedClinicContextualization(
          clinicData.id,
          '', // userMessage vazio para contexto geral
          'general'
        );

        if (enhancedContext && enhancedContext.fullContext) {
          console.log('✅ [LLMOrchestrator] Usando contexto avançado com navegação inteligente');
          return enhancedContext.fullContext.prompt;
        }
      }
    } catch (error) {
      console.warn('⚠️ [LLMOrchestrator] Erro ao carregar contexto avançado, usando fallback:', error);
    }

    // Fallback para dados básicos
    const { data: clinicData } = await supabase
      .from('clinics')
      .select('*')
      .eq('has_contextualization', true)
      .single();

    const clinicName = clinicData?.name || 'Clínica Médica';
    const personality = 'profissional, empática e prestativa';

    return this.SYSTEM_PROMPT
      .replace('{clinic_name}', clinicName)
      .replace('{personality}', personality);
  }

  private static buildMessages(
    systemPrompt: string, 
    history: any[], 
    augmentedPrompt: string,
    userProfile: any
  ) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Adicionar histórico relevante
    history.slice(-6).forEach(h => {
      messages.push({
        role: h.role === 'user' ? 'user' : 'assistant',
        content: h.content
      });
    });

    // Adicionar contexto do usuário se disponível
    let userContext = '';
    if (userProfile.name) {
      userContext += `\n\nCONTEXTO DO USUÁRIO: O nome do usuário é ${userProfile.name}. Use o nome dele(a) para personalizar a resposta.`;
    }

    // Adicionar prompt aumentado com contexto RAG
    messages.push({
      role: 'user',
      content: augmentedPrompt + userContext
    });

    return messages;
  }

  private static async getClinicContext(): Promise<Record<string, any>> {
    const { data } = await supabase
      .from('clinics')
      .select('*')
      .eq('has_contextualization', true)
      .single();

    // Retornar contexto básico se não houver contextualização
    return {
      name: data?.name || 'Clínica Médica',
      address: data?.address || '',
      phone: data?.phone || '',
      services: []
    };
  }

  private static shouldEscalateToHuman(intent: Intent, memory: any): boolean {
    // Critérios para escalar
    if (intent.name === 'HUMAN_HANDOFF') return true;
    if (intent.confidence < 0.3) return true;
    if (memory.getLoopCount() > 3) return true;
    if (memory.getFrustrationLevel() > 0.7) return true;
    
    return false;
  }

  private static async escalateToHuman(conversationId: string, reason: string): Promise<void> {
    // Atualizar conversa para indicar escalação
    await supabase
      .from('whatsapp_conversations')
      .update({
        status: 'escalated',
        escalation_reason: reason,
        escalated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }

  private static async checkForLoops(conversationId: string, response: string): Promise<boolean> {
    // Buscar últimas respostas do bot
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('content')
      .eq('conversation_id', conversationId)
      .eq('message_type', 'sent')
      .order('timestamp', { ascending: false })
      .limit(3);

    if (!data || data.length < 3) return false;

    // Verificar se as respostas são muito similares
    const similarities = data.map(msg => 
      this.calculateSimilarity(msg.content, response)
    );

    return similarities.filter(s => s > 0.8).length >= 2;
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    // Implementação simples de similaridade
    const words1 = text1.toLowerCase().split(' ');
    const words2 = text2.toLowerCase().split(' ');
    
    const intersection = words1.filter(word => words2.includes(word));
    const union = [...new Set([...words1, ...words2])];
    
    return intersection.length / union.length;
  }

  private static async handleConversationLoop(conversationId: string): Promise<void> {
    // Registrar loop na conversa
    await supabase
      .from('whatsapp_conversations')
      .update({
        loop_count: 1, // Incremento simples por enquanto
        last_loop_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }
}