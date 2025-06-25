
import { ConversationContextManager } from './conversation-context.ts';
import { IntentDetector } from './intent-detector.ts';
import { UserProfileManager } from './user-profile-manager.ts';
import { ConversationValidator } from './conversation-validator.ts';

export class ConversationFlowManager {
  static async initializeConversation(phoneNumber: string, message: string): Promise<any> {
    // Detectar intenção avançada
    const context = ConversationContextManager.getContext(phoneNumber);
    const userIntent = IntentDetector.detectAdvancedIntent(message, context.conversationHistory);
    
    console.log(`🎯 Intenção detectada: ${userIntent.primary} (confiança: ${userIntent.confidence})`);
    console.log(`📊 Contexto atual: Stage=${context.conversationStage}, Greeted=${context.hasGreeted}, Repeats=${context.consecutiveRepeats}`);

    // Analisar estilo do usuário para personalização
    UserProfileManager.analyzeUserStyle(message, phoneNumber);

    return { context, userIntent };
  }

  static async loadConversationHistory(phoneNumber: string, supabase: any): Promise<any[]> {
    console.log('📝 Buscando histórico completo da conversa...');
    
    const { data: conversationData, error: convError } = await supabase
      .from('whatsapp_conversations')
      .select('id')
      .eq('phone_number', phoneNumber)
      .single();

    let recentMessages = [];
    if (!convError && conversationData) {
      const { data: messages, error: messagesError } = await supabase
        .from('whatsapp_messages')
        .select('content, message_type, timestamp')
        .eq('conversation_id', conversationData.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (messagesError) {
        console.error('❌ Erro ao buscar histórico:', messagesError);
      } else {
        recentMessages = messages || [];
        console.log(`✅ Histórico encontrado: ${recentMessages.length} mensagens`);
        
        // Carregar histórico no contexto se ainda não estiver carregado
        const context = ConversationContextManager.getContext(phoneNumber);
        if (context.conversationHistory.length === 0 && recentMessages.length > 0) {
          console.log('🔄 Carregando histórico do banco para o contexto...');
          recentMessages.reverse().forEach((msg) => {
            if (msg.content && msg.content.trim()) {
              ConversationContextManager.addToHistory(
                phoneNumber, 
                msg.content, 
                msg.message_type === 'received' ? 'user' : 'bot'
              );
            }
          });
        }
      }
    }

    return recentMessages;
  }

  static async loadClinicContext(supabase: any): Promise<any[]> {
    console.log('🏥 Buscando contexto da clínica...');
    const { data: contextData, error: contextError } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .order('order_number');

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError);
      return [];
    } else {
      console.log(`✅ Contexto encontrado: ${contextData?.length || 0} itens`);
      return contextData || [];
    }
  }

  static handleGreeting(phoneNumber: string, userIntent: any): void {
    // Marcar como cumprimentado se foi uma saudação
    if (userIntent.primary === 'greeting') {
      ConversationContextManager.markAsGreeted(phoneNumber);
    }
  }

  static updateConversationFlow(phoneNumber: string, responseToSend: string, userIntent: any): void {
    // Adicionar resposta do bot ao histórico
    ConversationContextManager.addToHistory(phoneNumber, responseToSend, 'bot');

    // Atualizar contexto com a resposta
    ConversationContextManager.updateContext(phoneNumber, {
      lastBotResponse: responseToSend,
      lastUserIntent: userIntent.primary
    });
  }
}
