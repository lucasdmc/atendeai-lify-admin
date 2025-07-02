import { IntentRecognitionService, Intent } from './intentRecognitionService';
import { RAGEngineService } from './ragEngineService';
import { ConversationMemoryService } from './conversationMemoryService';
import { ToolCallingService } from './toolCallingService';
import { PersonalizationService } from './personalizationService';
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
      // 1. Carregar memória da conversa
      const memory = await ConversationMemoryService.loadMemory(request.phoneNumber);
      const conversationHistory = ConversationMemoryService.getRecentHistory(memory, 10);

      // 1.5. Carregar contexto de personalização
      const personalization = await PersonalizationService.loadPersonalizationContext(request.phoneNumber);

      // 2. Reconhecer intenção
      const intent = await IntentRecognitionService.recognizeIntent({
        message: request.message,
        conversationHistory,
        clinicContext: await this.getClinicContext(),
        userProfile: memory.userProfile
      });

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

      // 5. Preparar contexto para o LLM
      const systemPrompt = await this.prepareSystemPrompt();
      const messages = this.buildMessages(systemPrompt, conversationHistory, ragResponse.augmentedPrompt);

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
      if (memory.loopCount > 3 || memory.frustrationLevel > 0.7) {
        await this.handleConversationLoop(request.conversationId);
      }

      return {
        response,
        intent,
        toolsUsed,
        metadata: {
          ragSources: ragResponse.sources,
          confidence: intent.confidence
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
    const { data: clinicData } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .in('question', ['nome da clínica', 'personalidade do chatbot']);

    const clinicName = clinicData?.find((d: any) => d.question.includes('nome'))?.answer || 'Clínica Médica';
    const personality = clinicData?.find((d: any) => d.question.includes('personalidade'))?.answer || 
      'profissional, empática e prestativa';

    return this.SYSTEM_PROMPT
      .replace('{clinic_name}', clinicName)
      .replace('{personality}', personality);
  }

  private static buildMessages(systemPrompt: string, history: any[], augmentedPrompt: string) {
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

    // Adicionar prompt aumentado com contexto RAG
    messages.push({
      role: 'user',
      content: augmentedPrompt
    });

    return messages;
  }

  private static async getClinicContext(): Promise<Record<string, any>> {
    const { data } = await supabase
      .from('contextualization_data')
      .select('category, question, answer')
      .order('order_number');

    const context: Record<string, any> = {};
    
    data?.forEach((item: any) => {
      if (!context[item.category]) {
        context[item.category] = [];
      }
      context[item.category].push({
        question: item.question,
        answer: item.answer
      });
    });

    return context;
  }

  private static shouldEscalateToHuman(intent: Intent, memory: any): boolean {
    if (intent.name === 'HUMAN_HANDOFF') return true;
    if (intent.confidence < 0.3) return true;
    if (memory.loopCount > 3) return true;
    if (memory.frustrationLevel > 0.7) return true;
    return false;
  }

  private static async escalateToHuman(conversationId: string, reason: string): Promise<void> {
    await supabase
      .from('whatsapp_conversations')
      .update({
        escalated_to_human: true,
        escalation_reason: reason,
        escalated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }

  private static async handleConversationLoop(conversationId: string): Promise<void> {
    await supabase
      .from('whatsapp_conversations')
      .update({
        loop_counter: 0,
        escalation_reason: 'Loop detectado',
        escalated_to_human: true,
        escalated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }
} 