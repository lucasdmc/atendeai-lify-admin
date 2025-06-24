
import { isAppointmentRelated } from './appointment-utils.ts';
import { handleAppointmentRequest } from './appointment-handler.ts';
import { generateAIResponse } from './openai-service.ts';
import { sendMessageWithRetry } from './message-retry.ts';
import { detectAndHandleLoop } from './loop-detection.ts';
import { 
  fetchConversationData, 
  fetchContextData, 
  fetchConversationHistory, 
  checkIfEscalated, 
  getEscalationMessage 
} from './conversation-handler.ts';

export async function processAndRespondWithAI(phoneNumber: string, message: string, supabase: any) {
  console.log(`🤖 === PROCESSAMENTO IA INICIADO ===`);
  console.log(`📞 Número: ${phoneNumber}`);
  console.log(`💬 Mensagem: ${message}`);
  
  try {
    // Buscar dados da conversa
    const conversationData = await fetchConversationData(phoneNumber, supabase);
    const conversationId = conversationData.id;

    // Verificar se já está escalado para humano
    if (checkIfEscalated(conversationData)) {
      console.log('🚨 Conversa escalada - enviando mensagem de transferência');
      const escalationMessage = getEscalationMessage();
      await sendMessageWithRetry(phoneNumber, escalationMessage, supabase);
      return;
    }

    // Buscar contexto da clínica
    const contextData = await fetchContextData(supabase);

    // Buscar histórico recente da conversa
    const recentMessages = await fetchConversationHistory(conversationId, supabase);

    // Verificar se é sobre agendamento e tentar processar
    const isAboutAppointment = isAppointmentRelated(message);
    console.log(`📅 Mensagem sobre agendamento: ${isAboutAppointment ? 'SIM' : 'NÃO'}`);

    let aiResponse: string;

    if (isAboutAppointment) {
      console.log('🔄 Processando solicitação de agendamento...');
      const appointmentResponse = await handleAppointmentRequest(message, phoneNumber, supabase);
      if (appointmentResponse) {
        aiResponse = appointmentResponse;
        console.log('📅 Resposta de agendamento gerada:', appointmentResponse.substring(0, 100) + '...');
      } else {
        // Se não conseguiu processar agendamento, usar IA
        console.log('🤖 Processando com IA...');
        aiResponse = await generateAIResponse(contextData, recentMessages, message);
      }
    } else {
      // Processar com IA
      console.log('🤖 Processando com IA...');
      aiResponse = await generateAIResponse(contextData, recentMessages, message);
    }

    // SISTEMA ANTI-LOOP: Verificar loops antes de enviar
    console.log('🔄 Verificando loops...');
    const loopResult = await detectAndHandleLoop(conversationId, aiResponse, supabase);
    
    if (loopResult.shouldEscalate) {
      console.log('🆘 Conversa escalada devido a loop');
      await sendMessageWithRetry(phoneNumber, loopResult.finalResponse, supabase);
      return;
    }

    const finalResponse = loopResult.alternativeResponse || aiResponse;
    console.log('💬 Resposta final:', finalResponse.substring(0, 100) + '...');

    // Enviar resposta de volta via WhatsApp com retry
    console.log('📤 Enviando resposta via WhatsApp...');
    await sendMessageWithRetry(phoneNumber, finalResponse, supabase);
    console.log(`✅ Resposta automática enviada para ${phoneNumber}`);
    
  } catch (error) {
    console.error('❌ Erro crítico no processamento com IA:', error);
    
    // Tentar enviar mensagem de erro básica
    try {
      console.log('📤 Enviando mensagem de erro básica...');
      await sendMessageWithRetry(phoneNumber, 'Desculpe, estou com dificuldades no momento. Um atendente entrará em contato em breve.', supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }
}
