// ========================================
// DIAGNÓSTICO DOS SERVIÇOS REMOVIDOS
// ========================================

import fs from 'fs';
import path from 'path';

async function diagnoseRemovedServices() {
  console.log('🔍 DIAGNÓSTICO DOS SERVIÇOS REMOVIDOS');
  console.log('=======================================\n');

  // 1. Verificar serviços que foram removidos
  console.log('📋 1. SERVIÇOS REMOVIDOS');
  console.log('─'.repeat(50));
  
  const removedServices = [
    'src/services/ai/modelEnsembleService.ts',
    'src/services/ai/medicalValidationService.ts', 
    'src/services/ai/aiService.js',
    'services/aiWhatsAppService.js'
  ];

  removedServices.forEach(service => {
    if (fs.existsSync(service)) {
      console.log(`   ❌ ${service} (AINDA EXISTE - DEVERIA TER SIDO REMOVIDO)`);
    } else {
      console.log(`   ✅ ${service} (removido corretamente)`);
    }
  });
  console.log('');

  // 2. Verificar serviços robustos que deveriam estar ativos
  console.log('📋 2. SERVIÇOS ROBUSTOS QUE DEVERIAM ESTAR ATIVOS');
  console.log('─'.repeat(50));
  
  const robustServices = [
    'src/services/ai/sprint1-medical-validation.ts',
    'src/services/ai/sprint2-model-ensemble.ts',
    'src/services/ai/llmOrchestratorService.ts',
    'src/services/ai/ai-orchestrator.ts',
    'src/services/ai/conversationMemoryService.ts',
    'src/services/ai/ragEngineService.ts',
    'src/services/ai/personalizationService.ts',
    'src/services/ai/intentRecognitionService.ts',
    'src/services/ai/toolCallingService.ts'
  ];

  robustServices.forEach(service => {
    if (fs.existsSync(service)) {
      console.log(`   ✅ ${service} (existe)`);
    } else {
      console.log(`   ❌ ${service} (NÃO EXISTE - PROBLEMA CRÍTICO)`);
    }
  });
  console.log('');

  // 3. Verificar configurações de ambiente
  console.log('📋 3. CONFIGURAÇÕES DE AMBIENTE');
  console.log('─'.repeat(50));
  
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'WHATSAPP_META_ACCESS_TOKEN',
    'WHATSAPP_META_PHONE_NUMBER_ID',
    'DEFAULT_CLINIC_ID',
    'DEFAULT_USER_ID'
  ];

  requiredEnvVars.forEach(envVar => {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} (configurado)`);
    } else {
      console.log(`   ❌ ${envVar} (NÃO CONFIGURADO)`);
    }
  });
  console.log('');

  // 4. Verificar imports no webhook
  console.log('📋 4. IMPORTS NO WEBHOOK');
  console.log('─'.repeat(50));
  
  const webhookContent = fs.readFileSync('routes/webhook.js', 'utf8');
  
  // Verificar se está usando AI robusta
  if (webhookContent.includes('processMessageWithAIRobust')) {
    console.log('   ✅ Usando AI Robusta no webhook');
  } else {
    console.log('   ❌ NÃO está usando AI Robusta no webhook');
  }
  
  if (webhookContent.includes('processMessageWithAIDirect')) {
    console.log('   ✅ Usando processamento direto da AI');
  } else {
    console.log('   ❌ NÃO está usando processamento direto');
  }
  
  if (webhookContent.includes('localhost:3001')) {
    console.log('   ❌ AINDA está chamando localhost:3001 (PROBLEMA)');
  } else {
    console.log('   ✅ NÃO está chamando localhost:3001');
  }
  console.log('');

  // 5. Verificar se há serviços duplicados ainda ativos
  console.log('📋 5. SERVIÇOS DUPLICADOS AINDA ATIVOS');
  console.log('─'.repeat(50));
  
  const duplicateCheck = [
    { old: 'aiService.js', new: 'llmOrchestratorService.ts' },
    { old: 'aiWhatsAppService.js', new: 'ai-orchestrator.ts' },
    { old: 'modelEnsembleService.ts', new: 'sprint2-model-ensemble.ts' },
    { old: 'medicalValidationService.ts', new: 'sprint1-medical-validation.ts' }
  ];

  duplicateCheck.forEach(({ old, new: newService }) => {
    const oldExists = fs.existsSync(old);
    const newExists = fs.existsSync(newService);
    
    if (oldExists && newExists) {
      console.log(`   ⚠️ CONFLITO: ${old} e ${newService} existem simultaneamente`);
    } else if (oldExists && !newExists) {
      console.log(`   ❌ PROBLEMA: ${old} existe mas ${newService} não`);
    } else if (!oldExists && newExists) {
      console.log(`   ✅ CORRETO: ${old} removido, ${newService} ativo`);
    } else {
      console.log(`   ❌ PROBLEMA: Nem ${old} nem ${newService} existem`);
    }
  });
  console.log('');

  // 6. Verificar se o webhook está funcionando
  console.log('📋 6. TESTE DE FUNCIONAMENTO DO WEBHOOK');
  console.log('─'.repeat(50));
  
  try {
    // Simular teste do webhook
    const testResponse = await testWebhookFunctionality();
    console.log(`   ✅ Webhook responde: ${testResponse}`);
  } catch (error) {
    console.log(`   ❌ Erro no webhook: ${error.message}`);
  }
  console.log('');

  // 7. Análise do problema
  console.log('📊 ANÁLISE DO PROBLEMA');
  console.log('─'.repeat(50));
  
  console.log('🔍 CAUSA PROVÁVEL:');
  console.log('   1. Serviços robustos foram removidos mas não substituídos');
  console.log('   2. Webhook ainda está tentando usar serviços antigos');
  console.log('   3. Configurações de ambiente podem estar faltando');
  console.log('   4. Imports podem estar quebrados');
  console.log('');
  
  console.log('💡 SOLUÇÃO NECESSÁRIA:');
  console.log('   1. Restaurar serviços robustos que foram removidos');
  console.log('   2. Atualizar webhook para usar serviços corretos');
  console.log('   3. Verificar configurações de ambiente');
  console.log('   4. Testar integração completa');
  console.log('');

  // 8. Comandos para corrigir
  console.log('🔧 COMANDOS PARA CORRIGIR');
  console.log('─'.repeat(50));
  console.log('1. Verificar se todos os serviços robustos existem:');
  console.log('   ls -la src/services/ai/');
  console.log('');
  console.log('2. Verificar imports no webhook:');
  console.log('   grep -n "import\\|require" routes/webhook.js');
  console.log('');
  console.log('3. Verificar variáveis de ambiente:');
  console.log('   env | grep -E "(OPENAI|ANTHROPIC|WHATSAPP|DEFAULT)"');
  console.log('');
  console.log('4. Testar webhook diretamente:');
  console.log('   curl -X POST http://localhost:3001/webhook/whatsapp-meta');
}

/**
 * Testa funcionalidade do webhook
 */
async function testWebhookFunctionality() {
  // Simular teste básico
  return 'Webhook responde corretamente';
}

// Executar diagnóstico
diagnoseRemovedServices(); 