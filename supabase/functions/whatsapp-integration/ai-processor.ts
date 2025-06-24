
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleEnhancedAppointmentRequest } from './enhanced-appointment-handler.ts';
import { generateAIResponse } from './openai-service.ts';
import { sendMessageWithRetry } from './message-retry.ts';
import { ConversationContextManager } from './conversation-context.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  try {
    // Detectar contexto da conversa
    const userIntent = ConversationContextManager.detectUserIntent(message);
    const context = ConversationContextManager.getContext(phoneNumber);
    
    console.log(`🎯 Intenção detectada: ${userIntent}`);
    console.log(`📊 Contexto atual: Stage=${context.conversationStage}, Greeted=${context.hasGreeted}, Repeats=${context.consecutiveRepeats}`);

    // PRIORIDADE 1: Sistema avançado de agendamentos
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    if (isAboutAppointment) {
      console.log('🔄 Processando com sistema avançado de agendamento...');
      try {
        const appointmentResponse = await handleEnhancedAppointmentRequest(message, phoneNumber, supabase);
        if (appointmentResponse) {
          console.log('📅 Resposta do sistema de agendamento gerada');
          
          // Atualizar contexto da conversa
          ConversationContextManager.addToHistory(phoneNumber, message, 'user', 'scheduling');
          ConversationContextManager.addToHistory(phoneNumber, appointmentResponse, 'bot');
          ConversationContextManager.updateContext(phoneNumber, {
            conversationStage: 'scheduling',
            lastUserIntent: 'scheduling',
            lastBotResponse: appointmentResponse
          });
          
          // Enviar resposta
          await sendMessageWithRetry(phoneNumber, appointmentResponse, supabase);
          console.log(`✅ Resposta de agendamento enviada para ${phoneNumber}`);
          return;
        }
      } catch (appointmentError) {
        console.error('❌ Erro no sistema de agendamento:', appointmentError);
        // Continuar para IA se agendamento falhar
      }
    }

    // PRIORIDADE 2: Buscar contexto da clínica para IA
    console.log('🏥 Buscando contexto da clínica...');
    const { data: contextData, error: contextError } = await supabase
      .from('contextualization_data')
      .select('question, answer')
      .order('order_number');

    if (contextError) {
      console.error('❌ Erro ao buscar contexto:', contextError);
    } else {
      console.log(`✅ Contexto encontrado: ${contextData?.length || 0} itens`);
    }

    // PRIORIDADE 3: Buscar histórico COMPLETO da conversa
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

    // PRIORIDADE 4: Verificar repetições (contador crítico)
    if (context.consecutiveRepeats > 2) {
      console.log('🚨 Muitas repetições detectadas, escalando para humano...');
      
      // Atualizar conversa para escalada
      await supabase
        .from('whatsapp_conversations')
        .update({
          escalated_to_human: true,
          escalation_reason: 'Repetições excessivas detectadas',
          escalated_at: new Date().toISOString()
        })
        .eq('phone_number', phoneNumber);

      const escalationMessage = `Percebi que pode estar confuso com minhas respostas. Vou transferir você para um de nossos atendentes humanos que poderá ajudá-lo melhor. 😊\n\nUm momento, por favor!`;
      
      // Resetar contador
      ConversationContextManager.updateContext(phoneNumber, {
        consecutiveRepeats: 0,
        conversationStage: 'concluded'
      });

      await sendMessageWithRetry(phoneNumber, escalationMessage, supabase);
      console.log(`✅ Conversa escalada para humano: ${phoneNumber}`);
      return;
    }

    // PRIORIDADE 5: Processar com IA (com histórico completo e contexto avançado)
    console.log('🤖 Processando com IA (com histórico completo)...');
    const finalResponse = await generateAIResponse(contextData, recentMessages, message, phoneNumber);

    // Verificar se há muitas repetições antes de enviar
    const isRepetitive = ConversationContextManager.checkForRepetition(phoneNumber, finalResponse);
    let responseToSend = finalResponse;
    
    if (isRepetitive) {
      console.log('🔄 Repetição detectada, gerando variação...');
      responseToSend = ConversationContextManager.generateVariedResponse(phoneNumber, finalResponse);
    }

    // Marcar como cumprimentado se foi uma saudação
    if (userIntent === 'greeting') {
      ConversationContextManager.markAsGreeted(phoneNumber);
    }

    // Adicionar resposta do bot ao histórico
    ConversationContextManager.addToHistory(phoneNumber, responseToSend, 'bot');

    // Atualizar contexto com a resposta
    ConversationContextManager.updateContext(phoneNumber, {
      lastBotResponse: responseToSend,
      lastUserIntent: userIntent
    });

    // Enviar resposta
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, responseToSend, supabase);
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Tentar enviar mensagem de erro mais natural
    try {
      console.log('📤 Enviando mensagem de erro...');
      const errorMsg = `Ops! Tive um probleminha aqui. Pode tentar de novo? Se persistir, vou te conectar com um atendente! 😊`;
      await sendMessageWithRetry(phoneNumber, errorMsg, supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}
