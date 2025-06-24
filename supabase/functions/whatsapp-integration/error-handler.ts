
import { sendMessageWithRetry } from './message-retry.ts';

export async function handleProcessingError(phoneNumber: string, error: any, supabase: any): Promise<void> {
  console.error('❌ Erro crítico no processamento com IA:', error);
  
  // Tentar enviar mensagem de erro básica
  try {
    console.log('📤 Enviando mensagem de erro básica...');
    await sendMessageWithRetry(phoneNumber, 'Desculpe, estou com dificuldades no momento. Um atendente entrará em contato em breve.', supabase);
  } catch (sendError) {
    console.error('❌ Falha total ao comunicar com usuário:', sendError);
  }
}
