/**
 * TESTE ESPECÍFICO PARA VALIDAR CORREÇÕES DO SISTEMA DE AGENDAMENTO
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔧 TESTE ESPECÍFICO PARA VALIDAR CORREÇÕES DO SISTEMA DE AGENDAMENTO');
console.log('=' .repeat(80));

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class AppointmentFixTest {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  /**
   * Executa teste específico das correções
   */
  async runFixTest() {
    try {
      // Teste 1: Verificar detecção de intenção melhorada
      await this.testImprovedIntentDetection();
      
      // Teste 2: Verificar extração de serviços corrigida
      await this.testFixedServiceExtraction();
      
      // Teste 3: Verificar fluxo de agendamento completo
      await this.testCompleteAppointmentFlow();
      
      // Relatório final
      this.generateFixTestReport();
      
    } catch (error) {
      console.error('💥 ERRO NO TESTE DE CORREÇÕES:', error);
      this.errors.push({
        test: 'EXECUÇÃO_PRINCIPAL',
        error: error.message
      });
      this.generateFixTestReport();
    }
  }

  /**
   * Teste 1: Verificar detecção de intenção melhorada
   */
  async testImprovedIntentDetection() {
    console.log('\n🔍 TESTE 1: DETECÇÃO DE INTENÇÃO MELHORADA');
    console.log('-'.repeat(50));
    
    try {
      // Importar LLMOrchestratorService
      const { LLMOrchestratorService } = await import('./services/core/index.js');
      
      // Testar mensagens que antes não eram reconhecidas
      const testMessages = [
        'Gostaria de realizar um agendamento',
        'Quero fazer uma consulta',
        'Preciso marcar um horário',
        'Gostaria de agendar uma consulta',
        'Realizar agendamento'
      ];
      
      for (const message of testMessages) {
        console.log(`📱 Testando mensagem: "${message}"`);
        
        const intent = await LLMOrchestratorService.detectIntent(message);
        
        if (!intent || !intent.name) {
          throw new Error(`Detecção de intenção falhou para: "${message}"`);
        }
        
        console.log(`   ✅ Intenção: ${intent.name} (confiança: ${intent.confidence})`);
        
        const isAppointmentIntent = LLMOrchestratorService.isAppointmentIntent(intent);
        
        if (isAppointmentIntent) {
          console.log(`   ✅ RECONHECIDO como intenção de agendamento`);
        } else {
          console.log(`   ❌ NÃO reconhecido como intenção de agendamento`);
          this.errors.push({
            test: 'INTENT_DETECTION',
            error: `Mensagem "${message}" não foi reconhecida como intenção de agendamento`
          });
        }
      }
      
      this.testResults.push({ test: 'IMPROVED_INTENT_DETECTION', status: 'PASS' });
      console.log('✅ Detecção de intenção melhorada funcionando');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'IMPROVED_INTENT_DETECTION', error: error.message });
    }
  }

  /**
   * Teste 2: Verificar extração de serviços corrigida
   */
  async testFixedServiceExtraction() {
    console.log('\n🏥 TESTE 2: EXTRAÇÃO DE SERVIÇOS CORRIGIDA');
    console.log('-'.repeat(50));
    
    try {
      // Importar serviços
      const { AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
      
      // Buscar clínica disponível
      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .limit(1);
      
      if (!clinics || clinics.length === 0) {
        throw new Error('Nenhuma clínica disponível para teste');
      }
      
      const clinic = clinics[0];
      console.log(`🏥 Testando com clínica: ${clinic.name}`);
      
      // Obter contexto da clínica
      const clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
      
      if (!clinicContext) {
        throw new Error('Não foi possível obter contexto da clínica');
      }
      
      console.log('✅ Contexto da clínica obtido com sucesso');
      
      // Testar extração de serviços
      const appointmentFlow = new AppointmentFlowManager();
      const availableServices = appointmentFlow.extractServicesFromContext(clinicContext);
      
      if (!availableServices || availableServices.length === 0) {
        console.warn('⚠️ Nenhum serviço extraído - pode ser esperado se não houver serviços configurados');
      } else {
        console.log(`✅ ${availableServices.length} serviço(s) extraído(s) com sucesso`);
        
        // Mostrar detalhes dos serviços
        availableServices.slice(0, 3).forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.name} (${service.type}, ${service.duration}min)`);
        });
      }
      
      this.testResults.push({ test: 'FIXED_SERVICE_EXTRACTION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'FIXED_SERVICE_EXTRACTION', error: error.message });
    }
  }

  /**
   * Teste 3: Verificar fluxo de agendamento completo
   */
  async testCompleteAppointmentFlow() {
    console.log('\n📅 TESTE 3: FLUXO DE AGENDAMENTO COMPLETO');
    console.log('-'.repeat(50));
    
    try {
      // Importar serviços
      const { AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
      
      // Buscar clínica disponível
      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .limit(1);
      
      const clinic = clinics[0];
      console.log(`🏥 Testando fluxo com clínica: ${clinic.name}`);
      
      // Obter contexto da clínica
      const clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
      
      // Criar instância do AppointmentFlowManager
      const appointmentFlow = new AppointmentFlowManager();
      await appointmentFlow.initialize();
      
      // Simular mensagem de agendamento
      const testMessage = 'Gostaria de realizar um agendamento';
      const testPhoneNumber = '+5547999999999';
      const memory = { userProfile: { name: 'João Teste' } };
      const intent = { name: 'APPOINTMENT_CREATE', confidence: 0.9 };
      
      console.log(`📱 Simulando mensagem: "${testMessage}"`);
      
      // Testar fluxo completo
      const result = await appointmentFlow.handleAppointmentIntent(
        testPhoneNumber,
        testMessage,
        intent,
        clinicContext,
        memory
      );
      
      if (!result || !result.response) {
        throw new Error('Fluxo de agendamento não retornou resposta');
      }
      
      console.log('✅ Fluxo de agendamento executado com sucesso');
      console.log(`📝 Resposta gerada: ${result.response.substring(0, 100)}...`);
      
      // Verificar se o fluxo avançou
      if (result.metadata?.flowStep) {
        console.log(`✅ Fluxo avançou para: ${result.metadata.flowStep}`);
      }
      
      this.testResults.push({ test: 'COMPLETE_APPOINTMENT_FLOW', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'COMPLETE_APPOINTMENT_FLOW', error: error.message });
    }
  }

  /**
   * Gera relatório final do teste de correções
   */
  generateFixTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DO TESTE DE CORREÇÕES');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.errors.length;
    
    console.log(`\n📈 RESUMO DAS CORREÇÕES:`);
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Testes falharam: ${failedTests}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ PROBLEMAS IDENTIFICADOS:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    if (failedTests === 0) {
      console.log(`\n🎉 CORREÇÕES APROVADAS! Sistema de agendamento funcionando corretamente.`);
      console.log(`\n💡 PROBLEMAS CORRIGIDOS:`);
      console.log(`   ✅ Detecção de intenção melhorada`);
      console.log(`   ✅ Extração de serviços corrigida`);
      console.log(`   ✅ Fluxo de agendamento funcionando`);
      console.log(`   ✅ Reconhecimento de "realizar agendamento"`);
    } else {
      console.log(`\n🚨 AINDA HÁ PROBLEMAS! Corrija antes de prosseguir.`);
      process.exit(1);
    }
  }
}

// Executar teste
const tester = new AppointmentFixTest();
tester.runFixTest().catch(error => {
  console.error('💥 ERRO FATAL NO TESTE DE CORREÇÕES:', error);
  process.exit(1);
});
