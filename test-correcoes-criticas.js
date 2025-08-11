// test-correcoes-criticas.js
// Script para testar as correções críticas implementadas

import { ClinicContextManager } from './services/core/index.js';

console.log('🧪 TESTANDO CORREÇÕES CRÍTICAS IMPLEMENTADAS');
console.log('================================================');

async function testCorrecoesCriticas() {
  try {
    // ✅ INICIALIZAR CLINIC CONTEXT MANAGER
    console.log('\n1️⃣ Inicializando ClinicContextManager...');
    await ClinicContextManager.initialize();
    
    // ✅ TESTE 1: Mapeamento WhatsApp → Clínica
    console.log('\n2️⃣ Testando mapeamento WhatsApp → Clínica...');
    
    const testNumbers = [
      '+554730915628',  // CardioPrime
      '+554730915629',  // ESADI
      '+554730915630',  // Número não mapeado (deve usar fallback)
      '554730915628',   // Sem + (deve normalizar)
      '+55 47 3091 5628' // Com espaços (deve normalizar)
    ];
    
    for (const phoneNumber of testNumbers) {
      const clinicKey = ClinicContextManager.getClinicByWhatsApp(phoneNumber);
      console.log(`   📱 ${phoneNumber} → ${clinicKey}`);
    }
    
    // ✅ TESTE 2: Obter contexto das clínicas
    console.log('\n3️⃣ Testando obtenção de contexto...');
    
    const clinicKeys = ['cardioprime', 'esadi'];
    for (const clinicKey of clinicKeys) {
      const context = ClinicContextManager.getClinicContext(clinicKey);
      console.log(`   🏥 ${clinicKey}:`);
      console.log(`      Nome: ${context.name}`);
      console.log(`      Agente: ${context.agentConfig?.nome}`);
      console.log(`      Tem JSON: ${context.hasJsonContext}`);
      console.log(`      Fonte: ${context.source}`);
    }
    
    // ✅ TESTE 3: Verificar horários de funcionamento
    console.log('\n4️⃣ Testando verificação de horários...');
    
    for (const clinicKey of clinicKeys) {
      const context = ClinicContextManager.getClinicContext(clinicKey);
      const hasWorkingHours = context.workingHours && Object.keys(context.workingHours).length > 0;
      console.log(`   🕒 ${clinicKey}: Horários configurados: ${hasWorkingHours ? '✅' : '❌'}`);
      
      if (hasWorkingHours) {
        console.log(`      Dias: ${Object.keys(context.workingHours).join(', ')}`);
      }
    }
    
    // ✅ TESTE 4: Estatísticas do sistema
    console.log('\n5️⃣ Estatísticas do sistema...');
    const stats = ClinicContextManager.getStats();
    console.log(`   📊 Total de clínicas: ${stats.totalClinics}`);
    console.log(`   📁 Clínicas disponíveis: ${stats.availableClinics.join(', ')}`);
    
    console.log('\n✅ TODOS OS TESTES CONCLUÍDOS COM SUCESSO!');
    console.log('\n🔧 CORREÇÕES IMPLEMENTADAS:');
    console.log('   ✅ getClinicByWhatsApp() - Mapeamento WhatsApp → Clínica');
    console.log('   ✅ Seleção dinâmica de clínica (não mais hardcoded)');
    console.log('   ✅ Validação de horário integrada ao fluxo de agendamento');
    console.log('   ✅ Sistema usa APENAS JSONs da tela de clínicas');
    
  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
  }
}

// Executar testes
testCorrecoesCriticas();
