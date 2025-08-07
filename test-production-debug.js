// Script para testar diretamente no ambiente de produção
import fetch from 'node-fetch';

async function testProductionDebug() {
  try {
    console.log('🧪 Testando diretamente no ambiente de produção...');
    
    // Testar endpoint de health para verificar se está funcionando
    const healthResponse = await fetch('https://atendeai-lify-backend-production.up.railway.app/health');
    console.log('🏥 Health check status:', healthResponse.status);
    
    // Testar endpoint de AI process diretamente
    const aiRequest = {
      message: 'oi',
      clinicId: 'cardioprime',
      userId: '554730915628',
      sessionId: 'test-session-123'
    };
    
    console.log('🤖 Testando endpoint de AI process...');
    const aiResponse = await fetch('https://atendeai-lify-backend-production.up.railway.app/api/ai/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(aiRequest)
    });
    
    const aiResult = await aiResponse.json();
    console.log('📥 Resultado do AI process:', {
      success: aiResult.success,
      isWithinBusinessHours: aiResult.data?.metadata?.conversationContext?.isWithinBusinessHours,
      response: aiResult.data?.response?.substring(0, 100) + '...'
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testProductionDebug();
