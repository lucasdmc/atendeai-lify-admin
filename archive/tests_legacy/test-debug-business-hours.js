// Script de teste para debugar a verificação de horário comercial
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testDebugBusinessHours() {
  try {
    console.log('🧪 Testando debug da verificação de horário comercial...');
    
    // Simular uma mensagem com o número exato que está sendo usado no webhook
    const request = {
      phoneNumber: '554730915628', // Número sem o '+'
      message: 'oi',
      conversationId: 'test-debug-123',
      userId: '554730915628'
    };

    console.log('📤 Enviando requisição:', request);
    
    // Chamar o LLMOrchestratorService
    const result = await LLMOrchestratorService.processMessage(request);
    
    console.log('📥 Resultado:', {
      response: result.response,
      intent: result.intent,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testDebugBusinessHours();
