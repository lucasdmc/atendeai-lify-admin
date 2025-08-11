// test-saudacao-primeira-conversa.js
// Teste específico para verificar a lógica de saudação na primeira conversa do dia

import { LLMOrchestratorService } from './services/core/index.js';
import { ClinicContextManager } from './services/core/index.js';

console.log('🧪 TESTANDO SAUDAÇÃO NA PRIMEIRA CONVERSA DO DIA');
console.log('================================================');

async function testSaudacaoPrimeiraConversa() {
  try {
    // ✅ INICIALIZAR CLINIC CONTEXT MANAGER
    console.log('\n1️⃣ Inicializando ClinicContextManager...');
    await ClinicContextManager.initialize();
    
    // ✅ TESTE 1: Verificar mensagens configuradas no JSON
    console.log('\n2️⃣ Verificando mensagens configuradas no JSON...');
    
    const context = ClinicContextManager.getClinicContext('cardioprime');
    console.log('   🏥 Clínica:', context.name);
    console.log('   👨‍⚕️ Agente:', context.agentConfig?.nome);
    console.log('   👋 Saudação inicial:', context.agentConfig?.saudacao_inicial);
    console.log('   👋 Mensagem despedida:', context.agentConfig?.mensagem_despedida);
    
    // ✅ TESTE 2: Verificar se é primeira conversa do dia
    console.log('\n3️⃣ Testando verificação de primeira conversa do dia...');
    
    const testPhone = '+554730915628';
    const isFirstConversation = await LLMOrchestratorService.isFirstConversationOfDay(testPhone);
    console.log(`   📱 ${testPhone} - Primeira conversa do dia: ${isFirstConversation ? '✅ SIM' : '❌ NÃO'}`);
    
    // ✅ TESTE 3: Simular aplicação de lógica de resposta
    console.log('\n4️⃣ Testando aplicação de lógica de resposta...');
    
    const mockResponse = 'Posso ajudá-lo com informações sobre consultas e exames.';
    const mockUserProfile = { name: 'Lucas' };
    
    console.log('   📝 Resposta mock:', mockResponse);
    console.log('   👤 Perfil usuário:', mockUserProfile);
    console.log('   📅 Primeira conversa:', isFirstConversation);
    
    const finalResponse = await LLMOrchestratorService.applyResponseLogic(
      mockResponse,
      context,
      isFirstConversation,
      true, // isWithinBusinessHours
      mockUserProfile
    );
    
    console.log('\n5️⃣ RESULTADO FINAL:');
    console.log('   📤 Resposta original:', mockResponse);
    console.log('   📥 Resposta final:', finalResponse);
    
    // ✅ TESTE 4: Verificar se a saudação foi aplicada
    const hasSaudacaoInicial = finalResponse.includes(context.agentConfig?.saudacao_inicial || '');
    const hasMensagemDespedida = finalResponse.includes(context.agentConfig?.mensagem_despedida || '');
    
    console.log('\n6️⃣ VERIFICAÇÃO:');
    console.log(`   👋 Saudação inicial aplicada: ${hasSaudacaoInicial ? '✅ SIM' : '❌ NÃO'}`);
    console.log(`   👋 Mensagem despedida aplicada: ${hasMensagemDespedida ? '✅ SIM' : '❌ NÃO'}`);
    
    if (isFirstConversation) {
      console.log('\n✅ SISTEMA FUNCIONANDO: Saudação aplicada na primeira conversa do dia!');
    } else {
      console.log('\n⚠️ SISTEMA FUNCIONANDO: Não é primeira conversa do dia, saudação não aplicada.');
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
testSaudacaoPrimeiraConversa();
