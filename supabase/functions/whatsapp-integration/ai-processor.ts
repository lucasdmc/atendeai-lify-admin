
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleAppointmentRequest } from './appointment-handler.ts';
import { generateAIResponse } from './openai-service.ts';
import { sendMessageWithRetry } from './message-retry.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  try {
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

    // Buscar histórico recente da conversa usando o número de telefone
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
        .limit(10);

      if (messagesError) {
        console.error('❌ Erro ao buscar histórico:', messagesError);
      } else {
        recentMessages = messages || [];
        console.log(`✅ Histórico encontrado: ${recentMessages.length} mensagens`);
      }
    }

    // Verificar se é sobre agendamento e tentar processar
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    if (isAboutAppointment) {
      console.log('🔄 Processando solicitação de agendamento...');
      const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
      if (appointmentResponse) {
        console.log('📅 Resposta de agendamento gerada:', appointmentResponse.substring(0, 100) + '...');
        await sendMessageWithRetry(phoneNumber, appointmentResponse, supabase);
        return;
      }
    }

    // Se não conseguiu processar agendamento, usar IA para resposta
    console.log('🤖 Processando com IA...');
    const aiResponse = await generateAIResponse(contextData, recentMessages, message);

    // Enviar resposta de volta via WhatsApp com retry
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, aiResponse, supabase);
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Tentar enviar mensagem de erro básica
    try {
      console.log('📤 Enviando mensagem de erro básica...');
      await sendMessageWithRetry(phoneNumber, 'Desculpe, estou com dificuldades no momento. Tente novamente em alguns minutos.', supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}
