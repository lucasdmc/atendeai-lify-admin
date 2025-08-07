// Script de teste para verificar horário comercial
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testBusinessHours() {
  try {
    console.log('🧪 Testando verificação de horário comercial...');
    
    // Simular uma mensagem
    const request = {
      phoneNumber: '554797192447',
      message: 'oi',
      conversationId: 'test-123',
      userId: '554797192447'
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

testBusinessHours();
