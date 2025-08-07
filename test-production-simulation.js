import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testProductionSimulation() {
  console.log('🔍 Simulando produção Railway...');
  
  try {
    // Simular exatamente o que acontece no Railway
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-production-123',
      userId: '554730915628'
    };
    
    console.log('📤 Requisição:', request);
    
    // Chamar o LLMOrchestratorService como no Railway
    const result = await LLMOrchestratorService.processMessage(request);
    
    console.log('📥 Resultado completo:', {
      response: result.response,
      intent: result.intent,
      metadata: result.metadata
    });
    
    // Verificar especificamente o isWithinBusinessHours
    console.log('🔍 isWithinBusinessHours no metadata:', result.metadata?.conversationContext?.isWithinBusinessHours);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testProductionSimulation();
