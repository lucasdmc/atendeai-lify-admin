// Script para verificar variáveis de ambiente
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testEnvDebug() {
  try {
    console.log('🔍 Verificando variáveis de ambiente...');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('TZ:', process.env.TZ);
    console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
    
    // Teste simples
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-env-123',
      userId: '554730915628'
    };

    console.log('\n📤 Testando LLMOrchestratorService...');
    const result = await LLMOrchestratorService.processMessage(request);
    
    console.log('📥 Resultado:', {
      isWithinBusinessHours: result.metadata?.conversationContext?.isWithinBusinessHours,
      response: result.response.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testEnvDebug();
