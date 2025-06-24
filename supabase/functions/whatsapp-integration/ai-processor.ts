
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleAppointmentRequest } from './appointment-handler.ts';
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
    console.log(`🎯 Intenção detectada: ${userIntent}`);

    // Buscar contexto da clínica
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

    // Buscar histórico recente da conversa
    console.log('📝 Buscando histórico da conversa...');
    
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
        .limit(8); // Reduzir para manter contexto mais focado

      if (messagesError) {
        console.error('❌ Erro ao buscar histórico:', messagesError);
      } else {
        recentMessages = messages || [];
        console.log(`✅ Histórico encontrado: ${recentMessages.length} mensagens`);
      }
    }

    // Verificar se é sobre agendamento
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    let finalResponse = '';

    if (isAboutAppointment) {
      console.log('🔄 Processando solicitação de agendamento...');
      const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
      if (appointmentResponse) {
        finalResponse = appointmentResponse;
        console.log('📅 Resposta de agendamento gerada');
      }
    }

    // Se não conseguiu processar agendamento ou não é sobre agendamento, usar IA
    if (!finalResponse) {
      console.log('🤖 Processando com IA...');
      finalResponse = await generateAIResponse(contextData, recentMessages, message, phoneNumber);
    }

    // Verificar se a resposta é muito similar à anterior
    const context = ConversationContextManager.getContext(phoneNumber);
    if (context.consecutiveRepeats > 2) {
      console.log('🔄 Muitas repetições detectadas, redirecionando para atendimento humano...');
      finalResponse = `Percebi que pode estar com dúvidas. Que tal falar com um de nossos atendentes? 😊\n\nPosso te ajudar de outra forma?`;
      
      // Resetar contador
      ConversationContextManager.updateContext(phoneNumber, {
        consecutiveRepeats: 0
      });
    }

    // Enviar resposta
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, finalResponse, supabase);
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Tentar enviar mensagem de erro mais natural
    try {
      console.log('📤 Enviando mensagem de erro...');
      const errorMsg = `Ops! Tive um probleminha aqui. Pode tentar de novo? Se continuar, me chame que passo para um atendente! 😊`;
      await sendMessageWithRetry(phoneNumber, errorMsg, supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}
