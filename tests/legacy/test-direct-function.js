// Teste direto da função isWithinBusinessHours
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testDirectFunction() {
  try {
    console.log('🧪 Testando função isWithinBusinessHours diretamente...');
    
    // Simular contexto da clínica
    const clinicContext = {
      workingHours: {
        segunda: { abertura: '07:00', fechamento: '18:00' },
        terca: { abertura: '07:00', fechamento: '18:00' },
        quarta: { abertura: '07:00', fechamento: '18:00' },
        quinta: { abertura: '07:00', fechamento: '18:00' },
        sexta: { abertura: '07:00', fechamento: '17:00' },
        sabado: { abertura: '08:00', fechamento: '12:00' },
        domingo: { abertura: null, fechamento: null }
      }
    };
    
    console.log('📋 Contexto da clínica:', clinicContext);
    
    // Testar função diretamente
    const result = LLMOrchestratorService.isWithinBusinessHours(clinicContext);
    
    console.log('📥 Resultado:', result);
    console.log('📥 Tipo do resultado:', typeof result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    console.error('❌ Stack trace:', error.stack);
  }
}

testDirectFunction();
