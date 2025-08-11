/**
 * TESTE SIMPLES DO SISTEMA DE AGENDAMENTO
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 INICIANDO TESTE SIMPLES DO SISTEMA DE AGENDAMENTO');
console.log('=' .repeat(80));

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SimpleAppointmentTest {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  /**
   * Executa teste simples
   */
  async runSimpleTest() {
    try {
      console.log('\n🔧 TESTE 1: VERIFICAÇÃO DE AMBIENTE');
      console.log('-'.repeat(50));
      
      // Verificar variáveis de ambiente
      const requiredEnvVars = [
        'VITE_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY',
        'OPENAI_API_KEY',
        'WHATSAPP_META_ACCESS_TOKEN',
        'WHATSAPP_META_PHONE_NUMBER_ID'
      ];
      
      let envOk = true;
      for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
          console.error(`❌ ${envVar} - AUSENTE`);
          envOk = false;
        } else {
          console.log(`✅ ${envVar} - Configurada`);
        }
      }
      
      if (!envOk) {
        throw new Error('Variáveis de ambiente não configuradas');
      }
      
      this.testResults.push({ test: 'ENVIRONMENT', status: 'PASS' });
      
      console.log('\n🗄️ TESTE 2: VERIFICAÇÃO DE BANCO DE DADOS');
      console.log('-'.repeat(50));
      
      // Testar conexão com Supabase
      const { data, error } = await supabase
        .from('clinics')
        .select('count')
        .limit(1);
      
      if (error) {
        throw new Error(`Erro na conexão com Supabase: ${error.message}`);
      }
      
      console.log('✅ Conexão com Supabase estabelecida');
      this.testResults.push({ test: 'DATABASE_CONNECTION', status: 'PASS' });
      
      console.log('\n🏥 TESTE 3: VERIFICAÇÃO DE CLÍNICAS');
      console.log('-'.repeat(50));
      
      // Buscar clínicas ativas
      const { data: clinics, error: clinicsError } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true);
      
      if (clinicsError) {
        throw new Error(`Erro ao buscar clínicas: ${clinicsError.message}`);
      }
      
      if (!clinics || clinics.length === 0) {
        throw new Error('Nenhuma clínica com contextualização encontrada');
      }
      
      console.log(`✅ ${clinics.length} clínica(s) encontrada(s) com contextualização`);
      
      for (const clinic of clinics) {
        console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
      }
      
      this.testResults.push({ test: 'CLINICS_AVAILABILITY', status: 'PASS' });
      
      console.log('\n⚙️ TESTE 4: INICIALIZAÇÃO DOS SERVIÇOS');
      console.log('-'.repeat(50));
      
      // Importar e testar serviços
      try {
        const { LLMOrchestratorService, AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
        
        console.log('✅ Serviços importados com sucesso');
        
        // Testar inicialização do ClinicContextManager
        await ClinicContextManager.initialize();
        console.log('✅ ClinicContextManager inicializado');
        
        // Testar inicialização do AppointmentFlowManager
        const appointmentFlow = new AppointmentFlowManager();
        await appointmentFlow.initialize();
        console.log('✅ AppointmentFlowManager inicializado');
        
        // Testar inicialização do LLMOrchestratorService
        await LLMOrchestratorService.initializeAppointmentFlow();
        console.log('✅ LLMOrchestratorService inicializado');
        
        this.testResults.push({ test: 'SERVICES_INITIALIZATION', status: 'PASS' });
        
      } catch (error) {
        throw new Error(`Erro na inicialização dos serviços: ${error.message}`);
      }
      
      console.log('\n📅 TESTE 5: TESTE DE FLUXO DE AGENDAMENTO');
      console.log('-'.repeat(50));
      
      try {
        const { LLMOrchestratorService, AppointmentFlowManager, ClinicContextManager } = await import('./services/core/index.js');
        
        // Buscar primeira clínica disponível
        const { data: clinics } = await supabase
          .from('clinics')
          .select('*')
          .eq('has_contextualization', true)
          .limit(1);
        
        const clinic = clinics[0];
        console.log(`🏥 Testando com clínica: ${clinic.name}`);
        
        // Testar obtenção de contexto
        const clinicContext = await ClinicContextManager.getClinicContext(clinic.name);
        
        if (!clinicContext) {
          throw new Error('Não foi possível obter contexto da clínica');
        }
        
        console.log('✅ Contexto da clínica obtido com sucesso');
        
        // Testar criação de estado de fluxo
        const appointmentFlow = new AppointmentFlowManager();
        const flowState = appointmentFlow.createNewFlowState(clinicContext);
        
        if (!flowState || !flowState.step) {
          throw new Error('Estado de fluxo não foi criado corretamente');
        }
        
        console.log('✅ Estado de fluxo criado com sucesso');
        
        // Testar extração de serviços
        const services = appointmentFlow.extractServicesFromContext(clinicContext);
        
        if (services && services.length > 0) {
          console.log(`✅ ${services.length} serviço(s) extraído(s) do contexto`);
        } else {
          console.log('⚠️ Nenhum serviço encontrado no contexto da clínica');
        }
        
        this.testResults.push({ test: 'APPOINTMENT_FLOW', status: 'PASS' });
        
      } catch (error) {
        throw new Error(`Erro no teste de fluxo: ${error.message}`);
      }
      
      console.log('\n💬 TESTE 6: TESTE DE PROCESSAMENTO DE MENSAGENS');
      console.log('-'.repeat(50));
      
      try {
        const { LLMOrchestratorService } = await import('./services/core/index.js');
        
        // Simular mensagem de agendamento
        const testMessage = 'Gostaria de agendar uma consulta';
        console.log(`📱 Testando mensagem: "${testMessage}"`);
        
        // Testar detecção de intenção
        const intent = await LLMOrchestratorService.detectIntent(testMessage);
        
        if (!intent || !intent.name) {
          throw new Error('Detecção de intenção falhou');
        }
        
        console.log(`✅ Intenção detectada: ${intent.name} (confiança: ${intent.confidence})`);
        
        // Verificar se é intenção de agendamento
        const isAppointmentIntent = LLMOrchestratorService.isAppointmentIntent(intent);
        
        if (isAppointmentIntent) {
          console.log('✅ Intenção de agendamento reconhecida corretamente');
        } else {
          console.log('⚠️ Mensagem não foi reconhecida como intenção de agendamento');
        }
        
        this.testResults.push({ test: 'MESSAGE_PROCESSING', status: 'PASS' });
        
      } catch (error) {
        throw new Error(`Erro no teste de mensagens: ${error.message}`);
      }
      
      // Relatório final
      this.generateFinalReport();
      
    } catch (error) {
      console.error('💥 ERRO NO TESTE:', error);
      this.errors.push({
        test: 'EXECUÇÃO_PRINCIPAL',
        error: error.message
      });
      this.generateFinalReport();
    }
  }

  /**
   * Gera relatório final
   */
  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DO TESTE SIMPLES');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.errors.length;
    
    console.log(`\n📈 RESUMO:`);
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Testes falharam: ${failedTests}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERROS ENCONTRADOS:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    if (failedTests === 0) {
      console.log(`\n🎉 SISTEMA DE AGENDAMENTO APROVADO! Pode prosseguir com os testes.`);
    } else {
      console.log(`\n🚨 SISTEMA DE AGENDAMENTO COM PROBLEMAS! Corrija os erros antes de prosseguir.`);
      process.exit(1);
    }
  }
}

// Executar teste
const tester = new SimpleAppointmentTest();
tester.runSimpleTest().catch(error => {
  console.error('💥 ERRO FATAL NO TESTE:', error);
  process.exit(1);
});
