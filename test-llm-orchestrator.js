// Teste do LLMOrchestratorService
import dotenv from 'dotenv';
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

// Carregar variáveis de ambiente
dotenv.config();

async function testLLMOrchestrator() {
  try {
    console.log('🧪 Testando LLMOrchestratorService...');
    console.log('🔑 OpenAI API Key configurada:', !!process.env.OPENAI_API_KEY);
    
    const request = {
      phoneNumber: '554797192447',
      message: 'oi',
      conversationId: `test-${Date.now()}`,
      userId: '554797192447'
    };

    console.log('📤 Enviando request:', request);
    
    const result = await LLMOrchestratorService.processMessage(request);
    
    console.log('✅ Resultado:', {
      success: !!result.response,
      response: result.response,
      intent: result.intent,
      metadata: result.metadata
    });

    return result;
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    throw error;
  }
}

// Executar teste
testLLMOrchestrator()
  .then(result => {
    console.log('🎉 Teste concluído com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Teste falhou:', error);
    process.exit(1);
  }); 