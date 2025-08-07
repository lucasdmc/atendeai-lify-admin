import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testRailwaySimulation() {
  console.log('🔍 Simulando ambiente Railway (UTC)...');
  
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
  
  // Simular ambiente Railway (UTC)
  const originalTZ = process.env.TZ;
  process.env.TZ = 'UTC';
  
  console.log('📅 Ambiente simulado (UTC):', process.env.TZ);
  console.log('📅 Data UTC:', new Date().toISOString());
  console.log('📅 Data local (UTC):', new Date().toLocaleString());
  
  // Testar a função no ambiente UTC
  const result = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
  console.log('✅ Resultado (UTC):', result);
  
  // Restaurar timezone original
  process.env.TZ = originalTZ;
  
  console.log('\n🔍 Comparando com Brasil...');
  console.log('📅 Ambiente Brasil:', process.env.TZ);
  console.log('📅 Data Brasil:', new Date().toLocaleString());
  
  const resultBR = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
  console.log('✅ Resultado (Brasil):', resultBR);
  
  console.log('\n🔍 Diferença de horário:');
  const utcTime = new Date().toLocaleString("en-US", {timeZone: "UTC"});
  const brTime = new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"});
  console.log('📅 UTC:', utcTime);
  console.log('📅 Brasil:', brTime);
}

testRailwaySimulation();
