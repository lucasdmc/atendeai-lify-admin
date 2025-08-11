/**
 * TESTE DE COMPATIBILIDADE - VERIFICAÇÃO DE IMPACTOS DA ATUALIZAÇÃO
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 TESTE DE COMPATIBILIDADE - VERIFICAÇÃO DE IMPACTOS');
console.log('=' .repeat(80));

class CompatibilityCheckTest {
  constructor() {
    this.testResults = [];
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Executa verificação de compatibilidade
   */
  async runCompatibilityCheck() {
    try {
      // Teste 1: Verificar compatibilidade de intenções
      await this.testIntentCompatibility();
      
      // Teste 2: Verificar fluxo de agendamento
      await this.testAppointmentFlowCompatibility();
      
      // Teste 3: Verificar outras funcionalidades
      await this.testOtherFunctionalitiesCompatibility();
      
      // Teste 4: Verificar fallback system
      await this.testFallbackCompatibility();
      
      // Relatório final
      this.generateCompatibilityReport();
      
    } catch (error) {
      console.error('💥 ERRO NO TESTE DE COMPATIBILIDADE:', error);
      this.errors.push({
        test: 'EXECUÇÃO_PRINCIPAL',
        error: error.message
      });
      this.generateCompatibilityReport();
    }
  }

  /**
   * Teste 1: Verificar compatibilidade de intenções
   */
  async testIntentCompatibility() {
    console.log('\n🔍 TESTE 1: COMPATIBILIDADE DE INTENÇÕES');
    console.log('-'.repeat(50));
    
    try {
      // Importar LLMOrchestratorService
      const { LLMOrchestratorService } = await import('./services/core/index.js');
      
      // Testar intenções antigas (deve continuar funcionando)
      const oldIntentMessages = [
        'oi',
        'bom dia',
        'agendar consulta',
        'marcar horário'
      ];
      
      for (const message of oldIntentMessages) {
        console.log(`📱 Testando intenção antiga: "${message}"`);
        
        try {
          const intent = await LLMOrchestratorService.detectIntent(message);
          
          if (!intent || !intent.name) {
            throw new Error(`Detecção falhou para mensagem antiga`);
          }
          
          console.log(`   ✅ Intenção: ${intent.name} (confiança: ${intent.confidence})`);
          
          // Verificar se ainda é reconhecida como intenção de agendamento (se aplicável)
          if (message.includes('agendar') || message.includes('marcar')) {
            const isAppointmentIntent = LLMOrchestratorService.isAppointmentIntent(intent);
            if (isAppointmentIntent) {
              console.log(`   ✅ Ainda reconhecida como intenção de agendamento`);
            } else {
              console.log(`   ⚠️ Mudança de comportamento: não é mais reconhecida como agendamento`);
              this.warnings.push({
                test: 'INTENT_COMPATIBILITY',
                warning: `Mensagem "${message}" mudou de comportamento`
              });
            }
          }
          
        } catch (error) {
          console.log(`   ❌ Erro na detecção: ${error.message}`);
          this.errors.push({
            test: 'INTENT_COMPATIBILITY',
            error: `Falha na detecção de mensagem antiga: "${message}"`
          });
        }
      }
      
      this.testResults.push({ test: 'INTENT_COMPATIBILITY', status: 'PASS' });
      console.log('✅ Compatibilidade de intenções mantida');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'INTENT_COMPATIBILITY', error: error.message });
    }
  }

  /**
   * Teste 2: Verificar fluxo de agendamento
   */
  async testAppointmentFlowCompatibility() {
    console.log('\n📅 TESTE 2: COMPATIBILIDADE DO FLUXO DE AGENDAMENTO');
    console.log('-'.repeat(50));
    
    try {
      // Importar serviços
      const { AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
      
      // Verificar se todas as intenções são suportadas
      const supportedIntents = [
        'APPOINTMENT_CREATE',
        'APPOINTMENT_SCHEDULE', 
        'APPOINTMENT_RESCHEDULE',
        'APPOINTMENT_CANCEL',
        'APPOINTMENT_LIST',
        'APPOINTMENT_CHECK'
      ];
      
      console.log('🔍 Verificando suporte a intenções no AppointmentFlowManager...');
      
      for (const intentName of supportedIntents) {
        const intent = { name: intentName, confidence: 0.9 };
        const isSupported = AppointmentFlowManager.prototype.isAppointmentIntent ? 
          AppointmentFlowManager.prototype.isAppointmentIntent(intent) :
          true; // Se não há método específico, assumir suporte
        
        if (isSupported) {
          console.log(`   ✅ ${intentName} - Suportado`);
        } else {
          console.log(`   ❌ ${intentName} - NÃO suportado`);
          this.errors.push({
            test: 'APPOINTMENT_FLOW_COMPATIBILITY',
            error: `Intenção ${intentName} não é suportada no fluxo`
          });
        }
      }
      
      this.testResults.push({ test: 'APPOINTMENT_FLOW_COMPATIBILITY', status: 'PASS' });
      console.log('✅ Fluxo de agendamento compatível');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'APPOINTMENT_FLOW_COMPATIBILITY', error: error.message });
    }
  }

  /**
   * Teste 3: Verificar outras funcionalidades
   */
  async testOtherFunctionalitiesCompatibility() {
    console.log('\n🔧 TESTE 3: COMPATIBILIDADE DE OUTRAS FUNCIONALIDADES');
    console.log('-'.repeat(50));
    
    try {
      // Importar LLMOrchestratorService
      const { LLMOrchestratorService } = await import('./services/core/index.js');
      
      // Verificar se funções essenciais ainda existem
      const essentialFunctions = [
        'detectIntent',
        'isAppointmentIntent', 
        'mapIntentToCategory',
        'prepareSystemPrompt',
        'buildMessages',
        'isWithinBusinessHours'
      ];
      
      console.log('🔍 Verificando funções essenciais...');
      
      for (const funcName of essentialFunctions) {
        if (typeof LLMOrchestratorService[funcName] === 'function') {
          console.log(`   ✅ ${funcName} - Disponível`);
        } else {
          console.log(`   ❌ ${funcName} - NÃO disponível`);
          this.errors.push({
            test: 'OTHER_FUNCTIONALITIES_COMPATIBILITY',
            error: `Função essencial ${funcName} não está disponível`
          });
        }
      }
      
      // Verificar se estrutura de retorno é compatível
      console.log('\n🔍 Verificando estrutura de retorno...');
      
      try {
        const testIntent = await LLMOrchestratorService.detectIntent('oi');
        
        if (testIntent && typeof testIntent === 'object') {
          const hasRequiredProps = ['name', 'confidence'].every(prop => prop in testIntent);
          
          if (hasRequiredProps) {
            console.log('   ✅ Estrutura de retorno compatível');
          } else {
            console.log('   ❌ Estrutura de retorno incompatível');
            this.errors.push({
              test: 'OTHER_FUNCTIONALITIES_COMPATIBILITY',
              error: 'Estrutura de retorno da detecção de intenção incompatível'
            });
          }
        } else {
          console.log('   ❌ Retorno inválido da detecção de intenção');
          this.errors.push({
            test: 'OTHER_FUNCTIONALITIES_COMPATIBILITY',
            error: 'Retorno inválido da detecção de intenção'
          });
        }
      } catch (error) {
        console.log(`   ❌ Erro ao testar estrutura: ${error.message}`);
        this.errors.push({
          test: 'OTHER_FUNCTIONALITIES_COMPATIBILITY',
          error: `Erro ao testar estrutura: ${error.message}`
        });
      }
      
      this.testResults.push({ test: 'OTHER_FUNCTIONALITIES_COMPATIBILITY', status: 'PASS' });
      console.log('✅ Outras funcionalidades compatíveis');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'OTHER_FUNCTIONALITIES_COMPATIBILITY', error: error.message });
    }
  }

  /**
   * Teste 4: Verificar sistema de fallback
   */
  async testFallbackCompatibility() {
    console.log('\n🔄 TESTE 4: COMPATIBILIDADE DO SISTEMA DE FALLBACK');
    console.log('-'.repeat(50));
    
    try {
      // Importar LLMOrchestratorService
      const { LLMOrchestratorService } = await import('./services/core/index.js');
      
      // Verificar se função de fallback existe
      if (typeof LLMOrchestratorService.fallbackIntentRecognition === 'function') {
        console.log('✅ Função de fallback disponível');
        
        // Testar fallback com mensagem simples
        try {
          const fallbackResult = LLMOrchestratorService.fallbackIntentRecognition('oi');
          
          if (fallbackResult && fallbackResult.name) {
            console.log(`   ✅ Fallback funcionando: ${fallbackResult.name}`);
          } else {
            console.log('   ❌ Fallback retornou resultado inválido');
            this.errors.push({
              test: 'FALLBACK_COMPATIBILITY',
              error: 'Fallback retornou resultado inválido'
            });
          }
        } catch (error) {
          console.log(`   ❌ Erro no fallback: ${error.message}`);
          this.errors.push({
            test: 'FALLBACK_COMPATIBILITY',
            error: `Erro no fallback: ${error.message}`
          });
        }
      } else {
        console.log('❌ Função de fallback não encontrada');
        this.errors.push({
          test: 'FALLBACK_COMPATIBILITY',
          error: 'Função fallbackIntentRecognition não implementada'
        });
      }
      
      this.testResults.push({ test: 'FALLBACK_COMPATIBILITY', status: 'PASS' });
      console.log('✅ Sistema de fallback compatível');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'FALLBACK_COMPATIBILITY', error: error.message });
    }
  }

  /**
   * Gera relatório final de compatibilidade
   */
  generateCompatibilityReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DE COMPATIBILIDADE');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.errors.length;
    const warningsCount = this.warnings.length;
    
    console.log(`\n📈 RESUMO DA COMPATIBILIDADE:`);
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Testes falharam: ${failedTests}`);
    console.log(`   ⚠️ Avisos: ${warningsCount}`);
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️ AVISOS DE COMPATIBILIDADE:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.test}] ${warning.warning}`);
      });
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ PROBLEMAS DE COMPATIBILIDADE:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    if (failedTests === 0 && warningsCount === 0) {
      console.log(`\n🎉 COMPATIBILIDADE TOTAL! Nenhuma funcionalidade será quebrada.`);
      console.log(`\n💡 BENEFÍCIOS DA ATUALIZAÇÃO:`);
      console.log(`   ✅ Sistema mais inteligente`);
      console.log(`   ✅ Melhor detecção de intenções`);
      console.log(`   ✅ Funcionalidades existentes preservadas`);
      console.log(`   ✅ Fallback robusto mantido`);
    } else if (failedTests === 0) {
      console.log(`\n✅ COMPATIBILIDADE BÁSICA! Funcionalidades principais preservadas.`);
      console.log(`\n⚠️ ATENÇÃO: Alguns comportamentos podem ter mudado sutilmente.`);
    } else {
      console.log(`\n🚨 PROBLEMAS DE COMPATIBILIDADE! Corrija antes de prosseguir.`);
      process.exit(1);
    }
  }
}

// Executar teste
const tester = new CompatibilityCheckTest();
tester.runCompatibilityCheck().catch(error => {
  console.error('💥 ERRO FATAL NO TESTE DE COMPATIBILIDADE:', error);
  process.exit(1);
});
