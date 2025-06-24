
import { supabase } from '@/integrations/supabase/client';

interface LoopDetectionResult {
  shouldEscalate: boolean;
  alternativeResponse?: string;
  isLoop: boolean;
  loopCount: number;
}

interface ConversationState {
  id: string;
  escalated_to_human: boolean;
  escalation_reason: string | null;
  loop_counter: number;
  last_ai_response: string | null;
  consecutive_same_responses: number;
}

export class AntiLoopService {
  // Respostas alternativas categorizadas
  private static responseVariations = {
    greeting: [
      "Olá! Como posso ajudá-lo hoje?",
      "Oi! Em que posso ser útil?",
      "Bem-vindo! Como posso auxiliá-lo?",
      "Olá! Estou aqui para ajudar. O que você precisa?"
    ],
    appointment: [
      "Vou te ajudar com o agendamento. Preciso de algumas informações:",
      "Para marcar sua consulta, me informe os dados necessários:",
      "Perfeito! Vamos agendar sua consulta. Me forneça:",
      "Ótimo! Para confirmar o agendamento, preciso que me informe:"
    ],
    clarification: [
      "Não entendi completamente. Pode reformular sua pergunta?",
      "Desculpe, preciso de mais detalhes para ajudá-lo melhor.",
      "Pode explicar de forma diferente? Quero garantir que entendi corretamente.",
      "Preciso de mais informações para te dar a melhor resposta possível."
    ],
    error: [
      "Estou com dificuldades no momento. Vou conectar você com um atendente.",
      "Parece que estou tendo problemas para processar sua solicitação. Um humano vai ajudá-lo em breve.",
      "Desculpe pela confusão. Vou transferir você para nossa equipe de atendimento.",
      "Vou encaminhar você para um atendente que poderá ajudar melhor."
    ]
  };

  static async detectLoop(
    conversationId: string, 
    currentResponse: string
  ): Promise<LoopDetectionResult> {
    try {
      console.log('🔄 Detectando loops para conversa:', conversationId);
      
      // Buscar estado atual da conversa
      const { data: conversation, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !conversation) {
        console.error('❌ Erro ao buscar conversa:', error);
        return { shouldEscalate: false, isLoop: false, loopCount: 0 };
      }

      const state: ConversationState = conversation;

      // Se já está escalado, não fazer mais nada
      if (state.escalated_to_human) {
        console.log('⚠️ Conversa já escalada para humano');
        return { shouldEscalate: false, isLoop: false, loopCount: state.loop_counter };
      }

      // Verificar se é a mesma resposta consecutiva
      const isSameResponse = state.last_ai_response === currentResponse;
      const consecutiveCount = isSameResponse ? state.consecutive_same_responses + 1 : 1;
      const loopCount = isSameResponse ? state.loop_counter + 1 : state.loop_counter;

      console.log('🔍 Estado do loop:', {
        isSameResponse,
        consecutiveCount,
        loopCount,
        threshold: 3
      });

      // Atualizar contador na conversa
      await supabase
        .from('whatsapp_conversations')
        .update({
          last_ai_response: currentResponse,
          consecutive_same_responses: consecutiveCount,
          loop_counter: loopCount
        })
        .eq('id', conversationId);

      // Detectar se é loop (mesma resposta 3+ vezes)
      const isLoop = consecutiveCount >= 3;
      const shouldEscalate = loopCount >= 3;

      if (isLoop) {
        console.log('🚨 Loop detectado! Consecutivas:', consecutiveCount);
        
        // Registrar evento de loop
        await this.logLoopEvent(conversationId, 'loop_detected', '', currentResponse, loopCount);
        
        if (shouldEscalate) {
          console.log('🆘 Escalando para atendimento humano');
          await this.escalateToHuman(conversationId, 'Loop detectado - respostas repetitivas');
          return { 
            shouldEscalate: true, 
            isLoop: true, 
            loopCount,
            alternativeResponse: this.getRandomResponse('error')
          };
        } else {
          // Tentar resposta alternativa
          const alternativeResponse = this.getAlternativeResponse(currentResponse);
          console.log('🔄 Usando resposta alternativa:', alternativeResponse);
          
          await this.logLoopEvent(conversationId, 'response_varied', '', alternativeResponse, loopCount);
          
          return { 
            shouldEscalate: false, 
            isLoop: true, 
            loopCount,
            alternativeResponse 
          };
        }
      }

      return { shouldEscalate: false, isLoop: false, loopCount };
    } catch (error) {
      console.error('❌ Erro na detecção de loop:', error);
      return { shouldEscalate: false, isLoop: false, loopCount: 0 };
    }
  }

  private static async escalateToHuman(conversationId: string, reason: string): Promise<void> {
    try {
      // Marcar conversa como escalada
      await supabase
        .from('whatsapp_conversations')
        .update({
          escalated_to_human: true,
          escalation_reason: reason,
          escalated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      // Registrar evento de escalação
      await this.logLoopEvent(conversationId, 'escalated_to_human', '', '', 0);

      console.log('✅ Conversa escalada para humano:', conversationId);
    } catch (error) {
      console.error('❌ Erro ao escalar conversa:', error);
    }
  }

  private static async logLoopEvent(
    conversationId: string,
    eventType: string,
    messageContent: string,
    aiResponse: string,
    loopCount: number
  ): Promise<void> {
    try {
      await supabase
        .from('whatsapp_loop_events')
        .insert({
          conversation_id: conversationId,
          event_type: eventType,
          message_content: messageContent,
          ai_response: aiResponse,
          loop_count: loopCount
        });
    } catch (error) {
      console.error('❌ Erro ao registrar evento de loop:', error);
    }
  }

  private static getAlternativeResponse(originalResponse: string): string {
    // Categorizar resposta e retornar alternativa
    const lowerResponse = originalResponse.toLowerCase();
    
    if (lowerResponse.includes('olá') || lowerResponse.includes('bem-vindo')) {
      return this.getRandomResponse('greeting');
    } else if (lowerResponse.includes('agendar') || lowerResponse.includes('consulta')) {
      return this.getRandomResponse('appointment');
    } else if (lowerResponse.includes('não entendi') || lowerResponse.includes('reformular')) {
      return this.getRandomResponse('clarification');
    } else {
      return this.getRandomResponse('clarification');
    }
  }

  private static getRandomResponse(category: keyof typeof this.responseVariations): string {
    const responses = this.responseVariations[category];
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  static async getEscalatedConversations(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .eq('escalated_to_human', true)
        .order('escalated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Erro ao buscar conversas escaladas:', error);
      return [];
    }
  }

  static async markAsResolved(conversationId: string): Promise<void> {
    try {
      await supabase
        .from('whatsapp_conversations')
        .update({
          escalated_to_human: false,
          escalation_reason: null,
          escalated_at: null,
          loop_counter: 0,
          consecutive_same_responses: 0,
          last_ai_response: null
        })
        .eq('id', conversationId);

      console.log('✅ Conversa marcada como resolvida:', conversationId);
    } catch (error) {
      console.error('❌ Erro ao marcar conversa como resolvida:', error);
    }
  }
}
