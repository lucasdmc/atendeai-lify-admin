import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testSupabaseStructure() {
  console.log('🔍 Testando estrutura exata do Supabase...');
  
  // Simular dados EXATOS do Supabase (incluindo emergencia_24h)
  const mockClinicContext = {
    workingHours: {
      "sexta": {"abertura": "07:00", "fechamento": "17:00"},
      "terca": {"abertura": "07:00", "fechamento": "18:00"},
      "quarta": {"abertura": "07:00", "fechamento": "18:00"},
      "quinta": {"abertura": "07:00", "fechamento": "18:00"},
      "sabado": {"abertura": "08:00", "fechamento": "12:00"},
      "domingo": {"abertura": null, "fechamento": null},
      "segunda": {"abertura": "07:00", "fechamento": "18:00"},
      "emergencia_24h": true
    }
  };
  
  console.log('📋 Estrutura do workingHours (com emergencia_24h):', JSON.stringify(mockClinicContext.workingHours, null, 2));
  
  // Testar a função diretamente
  const result = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
  console.log('✅ Resultado:', result);
  
  // Verificar se o campo emergencia_24h está sendo tratado
  console.log('🔍 Campo emergencia_24h:', mockClinicContext.workingHours.emergencia_24h);
  
  // Verificar se há algum problema com o tipo de dados
  console.log('🔍 Tipo do campo emergencia_24h:', typeof mockClinicContext.workingHours.emergencia_24h);
}

testSupabaseStructure();
