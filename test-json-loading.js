// test-json-loading.js
// Teste para verificar se o JSON está sendo carregado corretamente

import { ClinicContextManager } from './services/core/index.js';

console.log('🧪 TESTANDO CARREGAMENTO DO JSON');
console.log('=================================');

async function testJsonLoading() {
  try {
    // ✅ INICIALIZAR CLINIC CONTEXT MANAGER
    console.log('\n1️⃣ Inicializando ClinicContextManager...');
    await ClinicContextManager.initialize();
    
    // ✅ TESTE 1: Verificar se o JSON foi carregado
    console.log('\n2️⃣ Verificando se o JSON foi carregado...');
    
    const hasContext = ClinicContextManager.hasJsonContext('cardioprime');
    console.log(`   📄 JSON carregado para cardioprime: ${hasContext ? '✅ SIM' : '❌ NÃO'}`);
    
    // ✅ TESTE 2: Verificar conteúdo bruto do JSON
    console.log('\n3️⃣ Verificando conteúdo bruto do JSON...');
    
    const rawContext = ClinicContextManager.jsonContexts.get('cardioprime');
    if (rawContext) {
      console.log('   📋 Estrutura do JSON:');
      console.log('      - Tem clinica:', !!rawContext.clinica);
      console.log('      - Tem agente_ia:', !!rawContext.agente_ia);
      console.log('      - Tem configuracao:', !!rawContext.agente_ia?.configuracao);
      
      if (rawContext.agente_ia?.configuracao) {
        console.log('   👨‍⚕️ Configurações do agente:');
        console.log('      - Nome:', rawContext.agente_ia.configuracao.nome);
        console.log('      - Saudação inicial:', rawContext.agente_ia.configuracao.saudacao_inicial);
        console.log('      - Mensagem despedida:', rawContext.agente_ia.configuracao.mensagem_despedida);
      }
    }
    
    // ✅ TESTE 3: Verificar contexto processado
    console.log('\n4️⃣ Verificando contexto processado...');
    
    const context = ClinicContextManager.getClinicContext('cardioprime');
    console.log('   🏥 Clínica:', context.name);
    console.log('   👨‍⚕️ Agente:', context.agentConfig?.nome);
    console.log('   👋 Saudação inicial:', context.agentConfig?.saudacao_inicial);
    console.log('   👋 Mensagem despedida:', context.agentConfig?.mensagem_despedida);
    console.log('   📄 Tem JSON:', context.hasJsonContext);
    console.log('   🔗 Fonte:', context.source);
    
    // ✅ TESTE 4: Comparar com JSON original
    console.log('\n5️⃣ Comparando com JSON original...');
    
    if (rawContext && context) {
      const originalSaudacao = rawContext.agente_ia?.configuracao?.saudacao_inicial;
      const processedSaudacao = context.agentConfig?.saudacao_inicial;
      
      console.log('   🔍 Saudação original:', originalSaudacao);
      console.log('   🔍 Saudação processada:', processedSaudacao);
      console.log('   ✅ São iguais?', originalSaudacao === processedSaudacao ? 'SIM' : 'NÃO');
      
      if (originalSaudacao !== processedSaudacao) {
        console.log('   ❌ PROBLEMA: As mensagens não são iguais!');
        console.log('   🔍 Diferença encontrada na extração dos dados.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
testJsonLoading();
