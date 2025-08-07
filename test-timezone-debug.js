// Script para debugar problemas de timezone e horário
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testTimezoneDebug() {
  try {
    console.log('🧪 Testando debug de timezone e horário...');
    
    // Verificar data e hora atual
    const now = new Date();
    console.log('📅 Data atual:', now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    console.log('🕒 Horário UTC:', now.toISOString());
    console.log('🌍 Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    // Verificar dia da semana
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDay = dayNames[now.getDay()];
    console.log('📆 Dia da semana:', currentDay);
    
    // Verificar horário atual em formato HHMM
    const currentTime = now.getHours() * 100 + now.getMinutes();
    console.log('⏰ Horário atual (HHMM):', currentTime);
    
    // Simular uma mensagem
    const request = {
      phoneNumber: '554730915628',
      message: 'oi',
      conversationId: 'test-timezone-123',
      userId: '554730915628'
    };

    console.log('\n📤 Enviando requisição:', request);
    
    // Chamar o LLMOrchestratorService
    const result = await LLMOrchestratorService.processMessage(request);
    
    console.log('\n📥 Resultado:', {
      response: result.response,
      intent: result.intent,
      metadata: result.metadata
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testTimezoneDebug();
