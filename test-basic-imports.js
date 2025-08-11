/**
 * TESTE BÁSICO DE IMPORTS
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔧 TESTE BÁSICO DE IMPORTS');
console.log('=' .repeat(50));

// Verificar se as variáveis foram carregadas
console.log('\n✅ VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE:');
console.log('-'.repeat(40));

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'WHATSAPP_META_ACCESS_TOKEN',
  'WHATSAPP_META_PHONE_NUMBER_ID'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Configurada`);
  } else {
    console.log(`❌ ${envVar} - AUSENTE`);
  }
}

// Tentar importar os serviços core
console.log('\n🔄 TESTANDO IMPORTS DOS SERVIÇOS CORE:');
console.log('-'.repeat(40));

try {
  console.log('🔧 Tentando importar LLMOrchestratorService...');
  const { LLMOrchestratorService } = await import('./services/core/index.js');
  console.log('✅ LLMOrchestratorService importado com sucesso');
} catch (error) {
  console.error(`❌ Erro ao importar LLMOrchestratorService: ${error.message}`);
}

try {
  console.log('🔧 Tentando importar AppointmentFlowManager...');
  const { AppointmentFlowManager } = await import('./services/core/index.js');
  console.log('✅ AppointmentFlowManager importado com sucesso');
} catch (error) {
  console.error(`❌ Erro ao importar AppointmentFlowManager: ${error.message}`);
}

try {
  console.log('🔧 Tentando importar ClinicContextManager...');
  const { ClinicContextManager } = await import('./services/core/index.js');
  console.log('✅ ClinicContextManager importado com sucesso');
} catch (error) {
  console.error(`❌ Erro ao importar ClinicContextManager: ${error.message}`);
}

try {
  console.log('🔧 Tentando importar GoogleCalendarService...');
  const { GoogleCalendarService } = await import('./services/core/index.js');
  console.log('✅ GoogleCalendarService importado com sucesso');
} catch (error) {
  console.error(`❌ Erro ao importar GoogleCalendarService: ${error.message}`);
}

console.log('\n✅ TESTE BÁSICO DE IMPORTS CONCLUÍDO!');
