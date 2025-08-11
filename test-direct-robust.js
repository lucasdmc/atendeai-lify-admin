#!/usr/bin/env node

/**
 * 🧪 TESTE DIRETO E ROBUSTO
 * Testa as funcionalidades principais de forma direta
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('🚀 TESTE DIRETO INICIADO');

// Testar import dos serviços
try {
  console.log('🔍 Importando serviços...');
  
  const { default: LLMOrchestratorService } = await import('./services/core/llmOrchestratorService.js');
  const { default: ClinicContextManager } = await import('./services/core/clinicContextManager.js');
  
  console.log('✅ Serviços importados com sucesso');
  
  // Testar inicialização
  console.log('🔍 Inicializando ClinicContextManager...');
  await ClinicContextManager.initialize();
  console.log('✅ ClinicContextManager inicializado');
  
  // Testar busca de clínica por WhatsApp
  console.log('🔍 Testando busca de clínica por WhatsApp...');
  const clinicName = await ClinicContextManager.getClinicByWhatsApp('+554730915628');
  console.log('✅ Clínica encontrada:', clinicName);
  
  // Testar contexto da clínica
  console.log('🔍 Testando contexto da clínica...');
  const clinicContext = await ClinicContextManager.getClinicContext(clinicName);
  console.log('✅ Contexto da clínica carregado:', {
    name: clinicContext.name,
    hasServices: !!clinicContext.services && clinicContext.services.length > 0,
    hasProfessionals: !!clinicContext.professionals && clinicContext.professionals.length > 0,
    hasWorkingHours: !!clinicContext.workingHours && Object.keys(clinicContext.workingHours).length > 0
  });
  
  // Testar primeira conversa do dia
  console.log('🔍 Testando verificação de primeira conversa do dia...');
  const isFirst = await LLMOrchestratorService.isFirstConversationOfDay('+554730915628');
  console.log('✅ É primeira conversa do dia:', isFirst);
  
  // Testar processamento de mensagem simples
  console.log('🔍 Testando processamento de mensagem...');
  const testMessage = {
    phoneNumber: '+554730915628',
    message: 'Olá, me chamo Lucas, tudo bem?'
  };
  
  console.log('📤 Enviando mensagem de teste...');
  const response = await LLMOrchestratorService.processMessage(testMessage);
  
  console.log('📥 Resposta recebida:');
  console.log('   Usuário:', testMessage.message);
  console.log('   Bot:', response.response.substring(0, 200) + '...');
  console.log('   Intent:', response.intent);
  
  // Verificações
  const hasGreeting = response.response.includes('Olá') || 
                     response.response.includes('Sou o Cardio') ||
                     response.response.includes('assistente virtual da CardioPrime');
  
  if (hasGreeting) {
    console.log('✅ Saudação apresentada corretamente');
  } else {
    console.log('❌ Saudação NÃO apresentada');
  }
  
  const hasName = response.response.includes('Lucas');
  if (hasName) {
    console.log('✅ Nome do usuário reconhecido');
  } else {
    console.log('❌ Nome do usuário NÃO reconhecido');
  }
  
  console.log('🎉 TESTE DIRETO CONCLUÍDO COM SUCESSO!');
  
} catch (error) {
  console.error('💥 ERRO NO TESTE:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
}
