
import { sendMessageWithRetry } from './message-retry.ts';
import { detectAndHandleLoop } from './loop-detection.ts';
import { detectHumanRequest, escalateToHumanImmediately } from './human-request-detector.ts';
import { 
  fetchConversationData, 
  fetchContextData, 
  fetchConversationHistory, 
  checkIfEscalated
} from './conversation-handler.ts';
import { handleEscalatedConversation } from './escalation-handler.ts';
import { processMessageResponse } from './response-processor.ts';
import { handleProcessingError } from './error-handler.ts';
import { BookingFlowHandler } from './booking-flow-handler.ts';

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
      await handleEscalatedConversation(phoneNumber, supabase);
      return;
    }

    // NOVO: Verificar fluxo de agendamento PRIMEIRO
    console.log('🗓️ Verificando fluxo de agendamento...');
    const bookingHandler = new BookingFlowHandler(supabase);
    const bookingResponse = await bookingHandler.handleMessage(conversationId, phoneNumber, message);
    
    if (bookingResponse) {
      console.log('📅 Resposta de agendamento gerada');
      await sendMessageWithRetry(phoneNumber, bookingResponse, supabase);
      return;
    }

    // Verificar se usuário está pedindo para falar com humano
    if (detectHumanRequest(message)) {
      console.log('👤 Usuário solicitou falar com humano - escalando imediatamente');
      
      await escalateToHumanImmediately(
        conversationId, 
        'Usuário solicitou atendimento humano', 
        supabase
      );
      
      const humanMessage = `Entendi que você gostaria de falar com um atendente humano. Sua conversa foi transferida para nossa equipe de atendimento.

Nossa equipe entrará em contato em breve. Para urgências, entre em contato pelo telefone da clínica: (47) 99967-2901.`;

      await sendMessageWithRetry(phoneNumber, humanMessage, supabase);
      return;
    }

    // Buscar contexto da clínica
    const contextData = await fetchContextData(supabase);

    // Buscar histórico recente da conversa
    const recentMessages = await fetchConversationHistory(conversationId, supabase);

    // Processar resposta (agendamento ou IA)
    const aiResponse = await processMessageResponse(message, phoneNumber, contextData, recentMessages, supabase);

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
    await handleProcessingError(phoneNumber, error, supabase);
  }
}
