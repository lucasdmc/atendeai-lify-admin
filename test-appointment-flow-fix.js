/**
 * TESTE PARA VALIDAR CORREÇÃO DO FLUXO DE AGENDAMENTO
 */

import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔧 TESTE PARA VALIDAR CORREÇÃO DO FLUXO DE AGENDAMENTO');
console.log('=' .repeat(80));

class AppointmentFlowFixTest {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  /**
   * Executa teste do fluxo corrigido
   */
  async runFlowFixTest() {
    try {
      // Teste 1: Verificar fluxo inicial
      await this.testInitialFlow();
      
      // Teste 2: Verificar seleção de serviço
      await this.testServiceSelection();
      
      // Teste 3: Verificar continuação do fluxo
      await this.testFlowContinuation();
      
      // Relatório final
      this.generateFlowFixReport();
      
    } catch (error) {
      console.error('💥 ERRO NO TESTE DO FLUXO:', error);
      this.errors.push({
        test: 'EXECUÇÃO_PRINCIPAL',
        error: error.message
      });
      this.generateFlowFixReport();
    }
  }

  /**
   * Teste 1: Verificar fluxo inicial
   */
  async testInitialFlow() {
    console.log('\n🔍 TESTE 1: FLUXO INICIAL');
    console.log('-'.repeat(50));
    
    try {
      // Importar serviços
      const { AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
      
      // Buscar clínica disponível
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .limit(1);
      
      const clinic = clinics[0];
      console.log(`🏥 Testando com clínica: ${clinic.name}`);
      
      // Obter contexto da clínica
      const clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
      
      // Criar instância do AppointmentFlowManager
      const appointmentFlow = new AppointmentFlowManager();
      await appointmentFlow.initialize();
      
      // Simular mensagem inicial
      const testMessage = 'Gostaria de realizar um agendamento';
      const testPhoneNumber = '+5547999999999';
      const memory = { userProfile: { name: 'João Teste' } };
      const intent = { name: 'APPOINTMENT_CREATE', confidence: 0.9 };
      
      console.log(`📱 Simulando mensagem inicial: "${testMessage}"`);
      
      // Testar fluxo inicial
      const result = await appointmentFlow.handleAppointmentIntent(
        testPhoneNumber,
        testMessage,
        intent,
        clinicContext,
        memory
      );
      
      if (!result || !result.response) {
        throw new Error('Fluxo inicial não retornou resposta');
      }
      
      console.log('✅ Fluxo inicial executado com sucesso');
      console.log(`📝 Resposta gerada: ${result.response.substring(0, 100)}...`);
      
      // Verificar se o fluxo avançou para seleção de serviço
      if (result.metadata?.flowStep === 'service_selection') {
        console.log('✅ Fluxo avançou para seleção de serviço');
      } else {
        console.log('⚠️ Fluxo não avançou corretamente');
        this.errors.push({
          test: 'INITIAL_FLOW',
          error: 'Fluxo não avançou para seleção de serviço'
        });
      }
      
      this.testResults.push({ test: 'INITIAL_FLOW', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'INITIAL_FLOW', error: error.message });
    }
  }

  /**
   * Teste 2: Verificar seleção de serviço
   */
  async testServiceSelection() {
    console.log('\n🔍 TESTE 2: SELEÇÃO DE SERVIÇO');
    console.log('-'.repeat(50));
    
    try {
      // Importar serviços
      const { AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
      
      // Buscar clínica disponível
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .limit(1);
      
      const clinic = clinics[0];
      console.log(`🏥 Testando seleção de serviço com clínica: ${clinic.name}`);
      
      // Obter contexto da clínica
      const clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
      
      // Criar instância do AppointmentFlowManager
      const appointmentFlow = new AppointmentFlowManager();
      await appointmentFlow.initialize();
      
      // Simular fluxo inicial
      const testPhoneNumber = '+5547999999999';
      const memory = { userProfile: { name: 'João Teste' } };
      const intent = { name: 'APPOINTMENT_CREATE', confidence: 0.9 };
      
      const initialResult = await appointmentFlow.handleAppointmentIntent(
        testPhoneNumber,
        'Gostaria de realizar um agendamento',
        intent,
        clinicContext,
        memory
      );
      
      if (!initialResult || initialResult.metadata?.flowStep !== 'service_selection') {
        throw new Error('Fluxo inicial não configurado corretamente');
      }
      
      console.log('✅ Fluxo inicial configurado, testando seleção de serviço...');
      
      // Simular seleção de serviço "1"
      const serviceSelectionResult = await appointmentFlow.handleAppointmentIntent(
        testPhoneNumber,
        '1',
        { name: 'APPOINTMENT_CONTINUE', confidence: 0.9 },
        clinicContext,
        memory
      );
      
      if (!serviceSelectionResult || !serviceSelectionResult.response) {
        throw new Error('Seleção de serviço não retornou resposta');
      }
      
      console.log('✅ Seleção de serviço processada com sucesso');
      console.log(`📝 Resposta: ${serviceSelectionResult.response.substring(0, 100)}...`);
      
      // Verificar se o fluxo avançou para seleção de data/hora
      if (serviceSelectionResult.metadata?.flowStep === 'date_time_selection') {
        console.log('✅ Fluxo avançou para seleção de data/hora');
      } else {
        console.log('⚠️ Fluxo não avançou para seleção de data/hora');
        this.errors.push({
          test: 'SERVICE_SELECTION',
          error: 'Fluxo não avançou para seleção de data/hora'
        });
      }
      
      this.testResults.push({ test: 'SERVICE_SELECTION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'SERVICE_SELECTION', error: error.message });
    }
  }

  /**
   * Teste 3: Verificar continuação do fluxo
   */
  async testFlowContinuation() {
    console.log('\n🔍 TESTE 3: CONTINUAÇÃO DO FLUXO');
    console.log('-'.repeat(50));
    
    try {
      // Importar serviços
      const { AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
      
      // Buscar clínica disponível
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { data: clinics } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .limit(1);
      
      const clinic = clinics[0];
      console.log(`🏥 Testando continuação do fluxo com clínica: ${clinic.name}`);
      
      // Obter contexto da clínica
      const clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
      
      // Criar instância do AppointmentFlowManager
      const appointmentFlow = new AppointmentFlowManager();
      await appointmentFlow.initialize();
      
      // Simular fluxo completo
      const testPhoneNumber = '+5547999999999';
      const memory = { userProfile: { name: 'João Teste' } };
      
      // Passo 1: Inicializar
      await appointmentFlow.handleAppointmentIntent(
        testPhoneNumber,
        'Gostaria de realizar um agendamento',
        { name: 'APPOINTMENT_CREATE', confidence: 0.9 },
        clinicContext,
        memory
      );
      
      // Passo 2: Selecionar serviço
      await appointmentFlow.handleAppointmentIntent(
        testPhoneNumber,
        '1',
        { name: 'APPOINTMENT_CONTINUE', confidence: 0.9 },
        clinicContext,
        memory
      );
      
      // Verificar se há fluxo ativo
      const hasActiveFlow = appointmentFlow.hasActiveFlow(testPhoneNumber);
      if (hasActiveFlow) {
        console.log('✅ Fluxo ativo detectado');
        
        const flowState = appointmentFlow.getFlowState(testPhoneNumber);
        console.log(`📋 Estado atual do fluxo: ${flowState.step}`);
        
        if (flowState.step === 'date_time_selection') {
          console.log('✅ Fluxo avançou corretamente para seleção de data/hora');
        } else {
          console.log('⚠️ Fluxo não avançou corretamente');
          this.errors.push({
            test: 'FLOW_CONTINUATION',
            error: `Fluxo não avançou corretamente. Estado atual: ${flowState.step}`
          });
        }
      } else {
        console.log('❌ Fluxo ativo não detectado');
        this.errors.push({
          test: 'FLOW_CONTINUATION',
          error: 'Fluxo ativo não foi detectado'
        });
      }
      
      this.testResults.push({ test: 'FLOW_CONTINUATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'FLOW_CONTINUATION', error: error.message });
    }
  }

  /**
   * Gera relatório final do teste do fluxo
   */
  generateFlowFixReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DO TESTE DO FLUXO');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.errors.length;
    
    console.log(`\n📈 RESUMO DO FLUXO:`);
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Testes falharam: ${failedTests}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ PROBLEMAS IDENTIFICADOS:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    if (failedTests === 0) {
      console.log(`\n🎉 FLUXO DE AGENDAMENTO FUNCIONANDO PERFEITAMENTE!`);
      console.log(`\n💡 CORREÇÕES IMPLEMENTADAS:`);
      console.log(`   ✅ Persistência de estado do fluxo`);
      console.log(`   ✅ Continuação automática do fluxo`);
      console.log(`   ✅ Seleção de serviço funcionando`);
      console.log(`   ✅ Avanço correto entre etapas`);
      console.log(`   ✅ Sistema de fluxo robusto`);
    } else {
      console.log(`\n🚨 AINDA HÁ PROBLEMAS NO FLUXO! Corrija antes de prosseguir.`);
      process.exit(1);
    }
  }
}

// Executar teste
const tester = new AppointmentFlowFixTest();
tester.runFlowFixTest().catch(error => {
  console.error('💥 ERRO FATAL NO TESTE DO FLUXO:', error);
  process.exit(1);
});
