
import { sendMessageWithRetry } from './message-retry.ts';
import { detectAndHandleLoop } from './loop-detection.ts';
import { 
  fetchConversationData, 
  fetchContextData, 
  fetchConversationHistory, 
  checkIfEscalated
} from './conversation-handler.ts';
import { handleEscalatedConversation } from './escalation-handler.ts';
import { processMessageResponse } from './response-processor.ts';
import { handleProcessingError } from './error-handler.ts';

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
