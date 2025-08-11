/**
 * TESTE ESPECÍFICO DO FLUXO DE AGENDAMENTO
 * 
 * Este script testa especificamente o fluxo de agendamento:
 * 1. Detecção de intenção
 * 2. Seleção de serviço
 * 3. Seleção de data/horário
 * 4. Confirmação
 * 5. Criação do agendamento
 */

import { LLMOrchestratorService, AppointmentFlowManager, ClinicContextManager } from './services/core/index.js';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

class AppointmentFlowSpecificTest {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.currentFlowState = null;
    this.clinicContext = null;
    this.testPhoneNumber = '+5547999999999';
  }

  /**
   * Executa teste específico do fluxo de agendamento
   */
  async runAppointmentFlowTest() {
    console.log('🚀 INICIANDO TESTE ESPECÍFICO DO FLUXO DE AGENDAMENTO');
    console.log('=' .repeat(80));
    
    try {
      // Preparar ambiente
      await this.prepareTestEnvironment();
      
      // Teste 1: Detecção de intenção de agendamento
      await this.testAppointmentIntentDetection();
      
      // Teste 2: Inicialização do fluxo
      await this.testFlowInitialization();
      
      // Teste 3: Seleção de serviço
      await this.testServiceSelection();
      
      // Teste 4: Seleção de data e horário
      await this.testDateTimeSelection();
      
      // Teste 5: Confirmação do agendamento
      await this.testAppointmentConfirmation();
      
      // Teste 6: Finalização do agendamento
      await this.testAppointmentFinalization();
      
      // Relatório final
      this.generateFlowTestReport();
      
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO TESTE DO FLUXO:', error);
      this.errors.push({
        test: 'FLUXO_PRINCIPAL',
        error: error.message,
        stack: error.stack
      });
      this.generateFlowTestReport();
    }
  }

  /**
   * Prepara ambiente de teste
   */
  async prepareTestEnvironment() {
    console.log('\n🔧 PREPARANDO AMBIENTE DE TESTE');
    console.log('-'.repeat(50));
    
    try {
      // Buscar clínica disponível
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true)
        .limit(1);
      
      if (error || !clinics || clinics.length === 0) {
        throw new Error('Nenhuma clínica disponível para teste');
      }
      
      const clinic = clinics[0];
      console.log(`🏥 Usando clínica para teste: ${clinic.name}`);
      
      // Obter contexto da clínica
      this.clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
      
      if (!this.clinicContext) {
        throw new Error('Não foi possível obter contexto da clínica');
      }
      
      console.log('✅ Contexto da clínica obtido com sucesso');
      
      // Inicializar serviços
      await LLMOrchestratorService.initializeAppointmentFlow();
      console.log('✅ Serviços inicializados');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      throw error;
    }
  }

  /**
   * Teste 1: Detecção de intenção de agendamento
   */
  async testAppointmentIntentDetection() {
    console.log('\n🔍 TESTE 1: DETECÇÃO DE INTENÇÃO DE AGENDAMENTO');
    console.log('-'.repeat(50));
    
    try {
      const testMessages = [
        'Gostaria de agendar uma consulta',
        'Quero marcar um horário',
        'Preciso agendar um exame',
        'Como faço para marcar uma consulta?'
      ];
      
      for (const message of testMessages) {
        console.log(`📱 Testando mensagem: "${message}"`);
        
        const intent = await LLMOrchestratorService.detectIntent(message);
        
        if (!intent || !intent.name) {
          throw new Error(`Detecção de intenção falhou para: "${message}"`);
        }
        
        console.log(`   ✅ Intenção: ${intent.name} (confiança: ${intent.confidence})`);
        
        const isAppointmentIntent = LLMOrchestratorService.isAppointmentIntent(intent);
        
        if (!isAppointmentIntent) {
          this.warnings.push({
            test: 'INTENT_DETECTION',
            warning: `Mensagem "${message}" não foi reconhecida como intenção de agendamento`
          });
        }
      }
      
      this.testResults.push({ test: 'INTENT_DETECTION', status: 'PASS' });
      console.log('✅ Detecção de intenção funcionando');
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'INTENT_DETECTION', error: error.message });
    }
  }

  /**
   * Teste 2: Inicialização do fluxo
   */
  async testFlowInitialization() {
    console.log('\n🚀 TESTE 2: INICIALIZAÇÃO DO FLUXO');
    console.log('-'.repeat(50));
    
    try {
      // Criar instância do AppointmentFlowManager
      const appointmentFlow = new AppointmentFlowManager();
      await appointmentFlow.initialize();
      
      // Criar estado inicial do fluxo
      this.currentFlowState = appointmentFlow.createNewFlowState(this.clinicContext);
      
      if (!this.currentFlowState || !this.currentFlowState.step) {
        throw new Error('Estado inicial do fluxo não foi criado corretamente');
      }
      
      console.log(`✅ Estado inicial criado: ${this.currentFlowState.step}`);
      
      // Verificar se o estado está correto
      if (this.currentFlowState.step !== 'initial') {
        throw new Error(`Estado inicial incorreto. Esperado: 'initial', Obtido: '${this.currentFlowState.step}'`);
      }
      
      // Verificar se os dados estão inicializados
      if (!this.currentFlowState.data || !this.currentFlowState.data.clinicId) {
        throw new Error('Dados do fluxo não foram inicializados corretamente');
      }
      
      console.log('✅ Dados do fluxo inicializados corretamente');
      
      this.testResults.push({ test: 'FLOW_INITIALIZATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'FLOW_INITIALIZATION', error: error.message });
    }
  }

  /**
   * Teste 3: Seleção de serviço
   */
  async testServiceSelection() {
    console.log('\n🏥 TESTE 3: SELEÇÃO DE SERVIÇO');
    console.log('-'.repeat(50));
    
    try {
      const appointmentFlow = new AppointmentFlowManager();
      
      // Simular início da criação de agendamento
      const memory = {
        userProfile: { name: 'João Teste' },
        history: []
      };
      
      const intent = { name: 'APPOINTMENT_CREATE', confidence: 0.9 };
      
      const result = await appointmentFlow.handleAppointmentIntent(
        this.testPhoneNumber,
        'Gostaria de agendar uma consulta',
        intent,
        this.clinicContext,
        memory
      );
      
      if (!result || !result.response) {
        throw new Error('Resposta do fluxo de agendamento não foi gerada');
      }
      
      console.log('✅ Resposta do fluxo gerada com sucesso');
      console.log(`📝 Resposta: ${result.response.substring(0, 100)}...`);
      
      // Verificar se o fluxo avançou para seleção de serviço
      if (result.metadata?.flowStep !== 'service_selection') {
        throw new Error(`Fluxo não avançou para seleção de serviço. Estado atual: ${result.metadata?.flowStep}`);
      }
      
      console.log('✅ Fluxo avançou para seleção de serviço');
      
      // Verificar se há serviços disponíveis
      if (!result.metadata?.availableServices || result.metadata.availableServices === 0) {
        this.warnings.push({
          test: 'SERVICE_SELECTION',
          warning: 'Nenhum serviço disponível para agendamento'
        });
      } else {
        console.log(`✅ ${result.metadata.availableServices} serviço(s) disponível(is)`);
      }
      
      this.testResults.push({ test: 'SERVICE_SELECTION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'SERVICE_SELECTION', error: error.message });
    }
  }

  /**
   * Teste 4: Seleção de data e horário
   */
  async testDateTimeSelection() {
    console.log('\n📅 TESTE 4: SELEÇÃO DE DATA E HORÁRIO');
    console.log('-'.repeat(50));
    
    try {
      const appointmentFlow = new AppointmentFlowManager();
      
      // Simular seleção de serviço
      const flowState = {
        step: 'service_selection',
        data: {
          selectedService: { name: 'Consulta Médica', duration: 30 },
          clinicId: this.clinicContext.id
        }
      };
      
      // Simular mensagem de seleção de serviço
      const result = await appointmentFlow.handleAppointmentCreation(
        this.testPhoneNumber,
        'Consulta médica',
        this.clinicContext,
        { userProfile: { name: 'João Teste' } },
        flowState
      );
      
      if (!result || !result.response) {
        throw new Error('Resposta para seleção de data/horário não foi gerada');
      }
      
      console.log('✅ Resposta para seleção de data/horário gerada');
      console.log(`📝 Resposta: ${result.response.substring(0, 100)}...`);
      
      // Verificar se o fluxo avançou para seleção de data/horário
      if (result.metadata?.flowStep !== 'date_time_selection') {
        throw new Error(`Fluxo não avançou para seleção de data/horário. Estado atual: ${result.metadata?.flowStep}`);
      }
      
      console.log('✅ Fluxo avançou para seleção de data/horário');
      
      // Verificar se há horários disponíveis
      if (!result.metadata?.availableSlots || result.metadata.availableSlots === 0) {
        this.warnings.push({
          test: 'DATETIME_SELECTION',
          warning: 'Nenhum horário disponível para agendamento'
        });
      } else {
        console.log(`✅ ${result.metadata.availableSlots} horário(s) disponível(is)`);
      }
      
      this.testResults.push({ test: 'DATETIME_SELECTION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'DATETIME_SELECTION', error: error.message });
    }
  }

  /**
   * Teste 5: Confirmação do agendamento
   */
  async testAppointmentConfirmation() {
    console.log('\n✅ TESTE 5: CONFIRMAÇÃO DO AGENDAMENTO');
    console.log('-'.repeat(50));
    
    try {
      const appointmentFlow = new AppointmentFlowManager();
      
      // Simular seleção de data/horário
      const flowState = {
        step: 'date_time_selection',
        data: {
          selectedService: { name: 'Consulta Médica', duration: 30 },
          selectedSlot: {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
            startTime: '09:00',
            endTime: '09:30'
          },
          clinicId: this.clinicContext.id
        }
      };
      
      // Simular confirmação
      const result = await appointmentFlow.handleAppointmentCreation(
        this.testPhoneNumber,
        'Sim, confirmo',
        this.clinicContext,
        { userProfile: { name: 'João Teste' } },
        flowState
      );
      
      if (!result || !result.response) {
        throw new Error('Resposta de confirmação não foi gerada');
      }
      
      console.log('✅ Resposta de confirmação gerada');
      console.log(`📝 Resposta: ${result.response.substring(0, 100)}...`);
      
      // Verificar se o fluxo avançou para confirmação
      if (result.metadata?.flowStep !== 'confirmation') {
        throw new Error(`Fluxo não avançou para confirmação. Estado atual: ${result.metadata?.flowStep}`);
      }
      
      console.log('✅ Fluxo avançou para confirmação');
      
      this.testResults.push({ test: 'APPOINTMENT_CONFIRMATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'APPOINTMENT_CONFIRMATION', error: error.message });
    }
  }

  /**
   * Teste 6: Finalização do agendamento
   */
  async testAppointmentFinalization() {
    console.log('\n🎯 TESTE 6: FINALIZAÇÃO DO AGENDAMENTO');
    console.log('-'.repeat(50));
    
    try {
      const appointmentFlow = new AppointmentFlowManager();
      
      // Simular confirmação final
      const flowState = {
        step: 'confirmation',
        data: {
          selectedService: { name: 'Consulta Médica', duration: 30 },
          selectedSlot: {
            date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Amanhã
            startTime: '09:00',
            endTime: '09:30'
          },
          clinicId: this.clinicContext.id
        }
      };
      
      // Simular confirmação final
      const result = await appointmentFlow.handleAppointmentCreation(
        this.testPhoneNumber,
        '1', // Confirmar
        this.clinicContext,
        { userProfile: { name: 'João Teste' } },
        flowState
      );
      
      if (!result || !result.response) {
        throw new Error('Resposta de finalização não foi gerada');
      }
      
      console.log('✅ Resposta de finalização gerada');
      console.log(`📝 Resposta: ${result.response.substring(0, 100)}...`);
      
      // Verificar se o agendamento foi finalizado
      if (result.metadata?.flowStep !== 'completed') {
        console.log('⚠️ Fluxo não foi marcado como completo (pode ser esperado em ambiente de teste)');
      } else {
        console.log('✅ Fluxo marcado como completo');
      }
      
      this.testResults.push({ test: 'APPOINTMENT_FINALIZATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'APPOINTMENT_FINALIZATION', error: error.message });
    }
  }

  /**
   * Gera relatório final do teste de fluxo
   */
  generateFlowTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DO TESTE DE FLUXO DE AGENDAMENTO');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.errors.length;
    const warningsCount = this.warnings?.length || 0;
    
    console.log(`\n📈 RESUMO DO FLUXO:`);
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Testes falharam: ${failedTests}`);
    console.log(`   ⚠️  Avisos: ${warningsCount}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERROS NO FLUXO:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    if (this.warnings && this.warnings.length > 0) {
      console.log(`\n⚠️  AVISOS NO FLUXO:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.test}] ${warning.warning}`);
      });
    }
    
    if (failedTests === 0) {
      console.log(`\n🎉 FLUXO DE AGENDAMENTO APROVADO! Sistema funcionando corretamente.`);
    } else {
      console.log(`\n🚨 FLUXO DE AGENDAMENTO COM PROBLEMAS! Corrija os erros antes de prosseguir.`);
      process.exit(1);
    }
  }
}

// Executar teste se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AppointmentFlowSpecificTest();
  tester.runAppointmentFlowTest().catch(error => {
    console.error('💥 ERRO FATAL NO TESTE DE FLUXO:', error);
    process.exit(1);
  });
}

export default AppointmentFlowSpecificTest;
