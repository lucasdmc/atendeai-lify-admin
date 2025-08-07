// Script para debugar problemas de timezone e horário
import { LLMOrchestratorService } from './services/llmOrchestratorService.js';

async function testTimezone() {
  console.log('🔍 Testando diferenças de timezone...');
  
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
  
  console.log('📅 Data atual (local):', new Date().toLocaleString());
  console.log('📅 Data UTC:', new Date().toUTCString());
  console.log('📅 Data ISO:', new Date().toISOString());
  
  // Testar com timezone explícito
  const now = new Date();
  const brazilTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  console.log('📅 Data Brasil (convertida):', brazilTime.toLocaleString());
  
  // Testar a função
  const result = LLMOrchestratorService.isWithinBusinessHours(mockClinicContext);
  console.log('✅ Resultado:', result);
  
  // Verificar se há diferença com UTC
  console.log('\n🔍 Testando com UTC...');
  const utcNow = new Date();
  const utcBrazilTime = new Date(utcNow.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
  console.log('📅 UTC convertido para Brasil:', utcBrazilTime.toLocaleString());
  
  const currentDay = LLMOrchestratorService.getDayOfWeek(utcBrazilTime.getDay());
  const currentTime = utcBrazilTime.getHours() * 100 + utcBrazilTime.getMinutes();
  
  console.log('📅 Dia da semana (UTC):', currentDay);
  console.log('📅 Horário atual (UTC):', currentTime);
  
  const todaySchedule = mockClinicContext.workingHours[currentDay];
  console.log('📅 Horário para hoje (UTC):', todaySchedule);
  
  if (todaySchedule && todaySchedule.abertura && todaySchedule.fechamento) {
    const openingTime = LLMOrchestratorService.parseTime(todaySchedule.abertura);
    const closingTime = LLMOrchestratorService.parseTime(todaySchedule.fechamento);
    
    console.log('📅 Abertura (UTC):', openingTime);
    console.log('📅 Fechamento (UTC):', closingTime);
    console.log('📅 Está dentro?', currentTime >= openingTime && currentTime <= closingTime);
  }
}

testTimezone();
