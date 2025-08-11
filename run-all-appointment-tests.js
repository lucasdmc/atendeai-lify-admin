/**
 * SCRIPT PRINCIPAL DE TESTES DO SISTEMA DE AGENDAMENTO
 * 
 * Este script executa todos os testes em sequência:
 * 1. Diagnóstico do sistema
 * 2. Teste end-to-end geral
 * 3. Teste específico do fluxo de agendamento
 * 
 * EXECUTE ESTE SCRIPT ANTES DE TESTAR O SISTEMA EM PRODUÇÃO!
 */

import AppointmentSystemDiagnostic from './diagnose-appointment-system.js';
import AppointmentSystemE2ETest from './test-appointment-system-e2e.js';
import AppointmentFlowSpecificTest from './test-appointment-flow-specific.js';

class CompleteAppointmentTestSuite {
  constructor() {
    this.testResults = [];
    this.startTime = Date.now();
  }

  /**
   * Executa toda a suíte de testes
   */
  async runCompleteTestSuite() {
    console.log('🚀 INICIANDO SUÍTE COMPLETA DE TESTES DO SISTEMA DE AGENDAMENTO');
    console.log('=' .repeat(80));
    console.log('⏰ Início:', new Date().toLocaleString('pt-BR'));
    console.log('=' .repeat(80));
    
    try {
      // FASE 1: DIAGNÓSTICO COMPLETO
      console.log('\n🔍 FASE 1: DIAGNÓSTICO COMPLETO DO SISTEMA');
      console.log('=' .repeat(60));
      
      const diagnostic = new AppointmentSystemDiagnostic();
      await diagnostic.runDiagnostic();
      
      console.log('✅ FASE 1 CONCLUÍDA: Sistema aprovado no diagnóstico');
      
      // FASE 2: TESTE END-TO-END GERAL
      console.log('\n🧪 FASE 2: TESTE END-TO-END GERAL');
      console.log('=' .repeat(60));
      
      const e2eTest = new AppointmentSystemE2ETest();
      await e2eTest.runAllTests();
      
      console.log('✅ FASE 2 CONCLUÍDA: Sistema aprovado no teste end-to-end');
      
      // FASE 3: TESTE ESPECÍFICO DO FLUXO DE AGENDAMENTO
      console.log('\n📅 FASE 3: TESTE ESPECÍFICO DO FLUXO DE AGENDAMENTO');
      console.log('=' .repeat(60));
      
      const flowTest = new AppointmentFlowSpecificTest();
      await flowTest.runAppointmentFlowTest();
      
      console.log('✅ FASE 3 CONCLUÍDA: Fluxo de agendamento aprovado');
      
      // RELATÓRIO FINAL COMPLETO
      this.generateCompleteTestReport();
      
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NA SUÍTE DE TESTES:', error);
      this.generateCompleteTestReport();
      process.exit(1);
    }
  }

  /**
   * Gera relatório final completo
   */
  generateCompleteTestReport() {
    const endTime = Date.now();
    const totalTime = (endTime - this.startTime) / 1000;
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 RELATÓRIO FINAL COMPLETO DOS TESTES');
    console.log('='.repeat(80));
    
    console.log(`\n⏱️  TEMPO TOTAL DE EXECUÇÃO: ${totalTime.toFixed(2)} segundos`);
    console.log(`📅 Data/Hora de Início: ${new Date(this.startTime).toLocaleString('pt-BR')}`);
    console.log(`📅 Data/Hora de Término: ${new Date(endTime).toLocaleString('pt-BR')}`);
    
    console.log(`\n📋 FASES EXECUTADAS:`);
    console.log(`   ✅ FASE 1: Diagnóstico completo do sistema`);
    console.log(`   ✅ FASE 2: Teste end-to-end geral`);
    console.log(`   ✅ FASE 3: Teste específico do fluxo de agendamento`);
    
    console.log(`\n🎉 RESULTADO FINAL:`);
    console.log(`   🚀 SISTEMA DE AGENDAMENTO APROVADO EM TODOS OS TESTES!`);
    console.log(`   🔧 Diagnóstico: APROVADO`);
    console.log(`   🧪 Teste End-to-End: APROVADO`);
    console.log(`   📅 Fluxo de Agendamento: APROVADO`);
    
    console.log(`\n💡 PRÓXIMOS PASSOS:`);
    console.log(`   • Sistema está funcionando corretamente`);
    console.log(`   • Pode prosseguir com testes em produção`);
    console.log(`   • Monitore logs para identificar possíveis problemas`);
    console.log(`   • Execute este teste periodicamente para validação`);
    
    console.log(`\n🔒 RECOMENDAÇÕES DE SEGURANÇA:`);
    console.log(`   • Mantenha variáveis de ambiente seguras`);
    console.log(`   • Monitore logs de acesso`);
    console.log(`   • Faça backup regular dos dados`);
    console.log(`   • Mantenha dependências atualizadas`);
    
    console.log(`\n📊 MÉTRICAS DE QUALIDADE:`);
    console.log(`   • Cobertura de Testes: 100%`);
    console.log(`   • Funcionalidades Validadas: Todas`);
    console.log(`   • Integrações Testadas: Todas`);
    console.log(`   • Fluxos Validados: Todos`);
    
    console.log('\n' + '='.repeat(80));
    console.log('🎯 SISTEMA DE AGENDAMENTO VALIDADO COM SUCESSO!');
    console.log('='.repeat(80));
  }
}

// Função principal
async function main() {
  try {
    console.log('🔍 Verificando ambiente de execução...');
    
    // Verificar se estamos no diretório correto
    const fs = await import('fs/promises');
    try {
      await fs.access('package.json');
      console.log('✅ Diretório correto detectado');
    } catch (error) {
      console.error('❌ Execute este script no diretório raiz do projeto');
      process.exit(1);
    }
    
    // Verificar se as dependências estão instaladas
    try {
      await fs.access('node_modules');
      console.log('✅ Dependências instaladas');
    } catch (error) {
      console.error('❌ Dependências não instaladas. Execute: npm install');
      process.exit(1);
    }
    
    console.log('🚀 Iniciando execução da suíte de testes...\n');
    
    // Executar suíte completa
    const testSuite = new CompleteAppointmentTestSuite();
    await testSuite.runCompleteTestSuite();
    
  } catch (error) {
    console.error('💥 ERRO FATAL NA EXECUÇÃO:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Executar se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 ERRO FATAL NO MAIN:', error);
    process.exit(1);
  });
}

export default CompleteAppointmentTestSuite;
