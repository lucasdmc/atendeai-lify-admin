// test-intent-detection.js
// Teste simples da detecção de intenção

import { LLMOrchestratorService } from './services/core/index.js';

console.log('🧪 TESTANDO DETECÇÃO DE INTENÇÃO');
console.log('=================================');

async function testIntentDetection() {
  const testMessages = [
    'oi',
    'Quero realizar um agendamento',
    'Preciso marcar uma consulta',
    'Quais são os horários de funcionamento?',
    'Como faço para agendar?'
  ];
  
  for (const message of testMessages) {
    console.log(`\n📝 Testando: "${message}"`);
    
    // Testar detecção de intenção (AGORA É ASYNC)
    const intent = await LLMOrchestratorService.detectIntent(message);
    console.log(`   🔍 Intenção detectada: ${intent.name} (confiança: ${intent.confidence})`);
    
    // Testar se é intenção de agendamento
    const isAppointment = LLMOrchestratorService.isAppointmentIntent(intent);
    console.log(`   📅 É agendamento? ${isAppointment ? '✅ SIM' : '❌ NÃO'}`);
  }
}

// Executar testes
testIntentDetection();
