import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testRailwayDebug() {
  console.log('🔍 Testando Railway com debug detalhado...');
  
  try {
    // Simular exatamente o que acontece no Railway
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-railway-debug-123',
      userId: '554730915628'
    };
    
    console.log('📤 Requisição:', request);
    
    // Chamar o LLMOrchestratorService
    const result = await LLMOrchestratorService.processMessage(request);
    
    console.log('📥 Resultado final:', {
      response: result.response.substring(0, 100) + '...',
      intent: result.intent.name,
      isWithinBusinessHours: result.metadata?.conversationContext?.isWithinBusinessHours,
      metadata: result.metadata
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

testRailwayDebug();
