
import { sendMessage } from './message-handler.ts';

export async function sendMessageWithRetry(phoneNumber: string, message: string, supabase: any, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Tentativa ${attempt}/${maxRetries} de envio...`);
      await sendMessage(phoneNumber, message, supabase);
      console.log(`✅ Mensagem enviada com sucesso na tentativa ${attempt}`);
      return; // Sucesso, sair da função
    } catch (error) {
      console.error(`❌ Tentativa ${attempt} falhou:`, error.message);
      
      if (attempt === maxRetries) {
        console.error('❌ Todas as tentativas de envio falharam');
        throw error;
      }
      
      // Aguardar antes da próxima tentativa (backoff exponencial)
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
