
import { sendMessageWithRetry } from './message-retry.ts';

export class ErrorHandler {
  static async handleCriticalError(error: any, phoneNumber: string, supabase: any): Promise<void> {
    console.error('❌ Erro crítico no processamento humanizado:', error);
    
    // Tentar enviar mensagem de erro mais empática
    try {
      console.log('📤 Enviando mensagem de erro empática...');
      const errorMsg = `Ops! Parece que tive um pequeno problema técnico. 😅 Pode tentar de novo? Prometo que vou conseguir te ajudar melhor desta vez!`;
      await sendMessageWithRetry(phoneNumber, errorMsg, supabase);
    } catch (sendError) {
      console.error('❌ Falha total ao comunicar com usuário:', sendError);
    }
  }

  static logProcessingStart(phoneNumber: string, message: string): void {
    console.log(`🤖 === PROCESSAMENTO IA HUMANIZADA INICIADO ===`);
    console.log(`📞 Número: ${phoneNumber}`);
    console.log(`💬 Mensagem: ${message}`);
  }

  static logProcessingEnd(phoneNumber: string): void {
    console.log(`✅ Resposta humanizada enviada para ${phoneNumber}`);
  }
}
