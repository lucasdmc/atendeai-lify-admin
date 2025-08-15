import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testStructure() {
  console.log('🔍 Testando estrutura dos dados...');
  
  try {
    // Simular dados como vêm do JSON
    const mockClinicContext = {
      workingHours: {
        "segunda": {"abertura": "07:00", "fechamento": "18:00"},
        "terca": {"abertura": "07:00", "fechamento": "18:00"},
        "quarta": {"abertura": "07:00", "fechamento": "18:00"},
        "quinta": {"abertura": "07:00", "fechamento": "18:00"},
        "sexta": {"abertura": "07:00", "fechamento": "17:00"},
        "sabado": {"abertura": "08:00", "fechamento": "12:00"},
        "domingo": {"abertura": null, "fechamento": null}
      }
    };
    
    console.log('📋 Estrutura do workingHours:', JSON.stringify(mockClinicContext.workingHours, null, 2));
    
    // Testar a função diretamente
    const result = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
    console.log('✅ Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testStructure();
