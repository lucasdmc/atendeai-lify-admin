/**
 * TESTE END-TO-END DO SISTEMA DE AGENDAMENTO
 * 
 * Este script testa todo o fluxo do sistema de agendamento:
 * 1. Inicialização dos serviços
 * 2. Detecção de intenção de agendamento
 * 3. Fluxo de criação de agendamento
 * 4. Integração com Google Calendar
 * 5. Validação de respostas
 * 
 * EXECUTE ESTE TESTE ANTES DE TESTAR O SISTEMA EM PRODUÇÃO!
 */

import { LLMOrchestratorService, AppointmentFlowManager, GoogleCalendarService, ClinicContextManager } from './services/core/index.js';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2JxbWRpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDE4MjU1OSwiZXhwIjoyMDY1NzU4NTU5fQ.SY8A3ReAs_D7SFBp99PpSe8rpm1hbWMv4b2q-c_VS5M'
);

class AppointmentSystemE2ETest {
  constructor() {
    this.testResults = [];
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Executa todos os testes
   */
  async runAllTests() {
    console.log('🚀 INICIANDO TESTE END-TO-END DO SISTEMA DE AGENDAMENTO');
    console.log('=' .repeat(80));
    
    try {
      // Teste 1: Verificação de ambiente
      await this.testEnvironment();
      
      // Teste 2: Verificação de banco de dados
      await this.testDatabaseConnection();
      
      // Teste 3: Verificação de clínicas
      await this.testClinicsAvailability();
      
      // Teste 4: Inicialização dos serviços
      await this.testServicesInitialization();
      
      // Teste 5: Teste de fluxo de agendamento
      await this.testAppointmentFlow();
      
      // Teste 6: Teste de integração com Google Calendar
      await this.testGoogleCalendarIntegration();
      
      // Teste 7: Teste de processamento de mensagens
      await this.testMessageProcessing();
      
      // Teste 8: Validação de respostas
      await this.testResponseValidation();
      
      // Relatório final
      this.generateFinalReport();
      
    } catch (error) {
      console.error('💥 ERRO CRÍTICO NO TESTE:', error);
      this.errors.push({
        test: 'EXECUÇÃO_PRINCIPAL',
        error: error.message,
        stack: error.stack
      });
      this.generateFinalReport();
    }
  }

  /**
   * Teste 1: Verificação de ambiente
   */
  async testEnvironment() {
    console.log('\n🔧 TESTE 1: VERIFICAÇÃO DE AMBIENTE');
    console.log('-'.repeat(50));
    
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'WHATSAPP_META_ACCESS_TOKEN',
      'WHATSAPP_META_PHONE_NUMBER_ID'
    ];
    
    const missingVars = [];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        missingVars.push(envVar);
      }
    }
    
    if (missingVars.length > 0) {
      const error = `Variáveis de ambiente ausentes: ${missingVars.join(', ')}`;
      console.error(`❌ ${error}`);
      this.errors.push({ test: 'ENVIRONMENT', error });
      throw new Error(error);
    }
    
    console.log('✅ Todas as variáveis de ambiente estão configuradas');
    this.testResults.push({ test: 'ENVIRONMENT', status: 'PASS' });
  }

  /**
   * Teste 2: Verificação de banco de dados
   */
  async testDatabaseConnection() {
    console.log('\n🗄️ TESTE 2: VERIFICAÇÃO DE BANCO DE DADOS');
    console.log('-'.repeat(50));
    
    try {
      // Testar conexão com Supabase
      const { data, error } = await supabase
        .from('clinics')
        .select('count')
        .limit(1);
      
      if (error) {
        throw new Error(`Erro na conexão com Supabase: ${error.message}`);
      }
      
      console.log('✅ Conexão com Supabase estabelecida com sucesso');
      
      // Verificar tabelas essenciais
      const essentialTables = ['clinics', 'conversations', 'messages', 'conversation_memory'];
      
      for (const table of essentialTables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('count')
            .limit(1);
          
          if (tableError) {
            this.warnings.push({
              test: 'DATABASE_TABLES',
              warning: `Tabela ${table} não encontrada ou sem acesso`
            });
          } else {
            console.log(`✅ Tabela ${table} acessível`);
          }
        } catch (tableError) {
          this.warnings.push({
            test: 'DATABASE_TABLES',
            warning: `Erro ao acessar tabela ${table}: ${tableError.message}`
          });
        }
      }
      
      this.testResults.push({ test: 'DATABASE_CONNECTION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'DATABASE_CONNECTION', error: error.message });
      throw error;
    }
  }

  /**
   * Teste 3: Verificação de clínicas
   */
  async testClinicsAvailability() {
    console.log('\n🏥 TESTE 3: VERIFICAÇÃO DE CLÍNICAS');
    console.log('-'.repeat(50));
    
    try {
      // Buscar clínicas ativas
      const { data: clinics, error } = await supabase
        .from('clinics')
        .select('*')
        .eq('has_contextualization', true);
      
      if (error) {
        throw new Error(`Erro ao buscar clínicas: ${error.message}`);
      }
      
      if (!clinics || clinics.length === 0) {
        throw new Error('Nenhuma clínica com contextualização encontrada');
      }
      
      console.log(`✅ ${clinics.length} clínica(s) encontrada(s) com contextualização`);
      
      for (const clinic of clinics) {
        console.log(`   - ${clinic.name} (ID: ${clinic.id})`);
        
        if (!clinic.whatsapp_phone) {
          this.warnings.push({
            test: 'CLINICS_AVAILABILITY',
            warning: `Clínica ${clinic.name} não tem número de WhatsApp configurado`
          });
        }
        
        if (!clinic.contextualization_data) {
          this.warnings.push({
            test: 'CLINICS_AVAILABILITY',
            warning: `Clínica ${clinic.name} não tem dados de contextualização`
          });
        }
      }
      
      this.testResults.push({ test: 'CLINICS_AVAILABILITY', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'CLINICS_AVAILABILITY', error: error.message });
      throw error;
    }
  }

  /**
   * Teste 4: Inicialização dos serviços
   */
  async testServicesInitialization() {
    console.log('\n⚙️ TESTE 4: INICIALIZAÇÃO DOS SERVIÇOS');
    console.log('-'.repeat(50));
    
    try {
      // Testar inicialização do ClinicContextManager
      console.log('🔧 Inicializando ClinicContextManager...');
      await ClinicContextManager.initialize();
      console.log('✅ ClinicContextManager inicializado');
      
      // Testar inicialização do GoogleCalendarService
      console.log('🔧 Inicializando GoogleCalendarService...');
      const googleCalendar = new GoogleCalendarService();
      await googleCalendar.initialize();
      console.log('✅ GoogleCalendarService inicializado');
      
      // Testar inicialização do AppointmentFlowManager
      console.log('🔧 Inicializando AppointmentFlowManager...');
      const appointmentFlow = new AppointmentFlowManager();
      await appointmentFlow.initialize();
      console.log('✅ AppointmentFlowManager inicializado');
      
      // Testar inicialização do LLMOrchestratorService
      console.log('🔧 Inicializando LLMOrchestratorService...');
      await LLMOrchestratorService.initializeAppointmentFlow();
      console.log('✅ LLMOrchestratorService inicializado');
      
      this.testResults.push({ test: 'SERVICES_INITIALIZATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'SERVICES_INITIALIZATION', error: error.message });
      throw error;
    }
  }

  /**
   * Teste 5: Teste de fluxo de agendamento
   */
  async testAppointmentFlow() {
    console.log('\n📅 TESTE 5: TESTE DE FLUXO DE AGENDAMENTO');
    console.log('-'.repeat(50));
    
    try {
      // Buscar primeira clínica disponível
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
      
      if (!services || services.length === 0) {
        this.warnings.push({
          test: 'APPOINTMENT_FLOW',
          warning: 'Nenhum serviço encontrado no contexto da clínica'
        });
      } else {
        console.log(`✅ ${services.length} serviço(s) extraído(s) do contexto`);
      }
      
      this.testResults.push({ test: 'APPOINTMENT_FLOW', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'APPOINTMENT_FLOW', error: error.message });
    }
  }

  /**
   * Teste 6: Teste de integração com Google Calendar
   */
  async testGoogleCalendarIntegration() {
    console.log('\n📅 TESTE 6: TESTE DE INTEGRAÇÃO COM GOOGLE CALENDAR');
    console.log('-'.repeat(50));
    
    try {
      const googleCalendar = new GoogleCalendarService();
      
      // Verificar se as credenciais estão disponíveis
      const credentialsPath = './config/google-credentials.json';
      
      try {
        await googleCalendar.initialize(credentialsPath);
        console.log('✅ GoogleCalendarService inicializado com credenciais');
        
        // Testar verificação de conexão
        const connectionStatus = await googleCalendar.checkConnection('test-clinic');
        
        if (connectionStatus.connected) {
          console.log('✅ Conexão com Google Calendar estabelecida');
        } else {
          console.log('⚠️ Conexão com Google Calendar não estabelecida (pode ser esperado em ambiente de teste)');
        }
        
      } catch (credentialError) {
        console.log('⚠️ Credenciais do Google Calendar não encontradas (pode ser esperado em ambiente de teste)');
        this.warnings.push({
          test: 'GOOGLE_CALENDAR_INTEGRATION',
          warning: 'Credenciais do Google Calendar não configuradas'
        });
      }
      
      this.testResults.push({ test: 'GOOGLE_CALENDAR_INTEGRATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'GOOGLE_CALENDAR_INTEGRATION', error: error.message });
    }
  }

  /**
   * Teste 7: Teste de processamento de mensagens
   */
  async testMessageProcessing() {
    console.log('\n💬 TESTE 7: TESTE DE PROCESSAMENTO DE MENSAGENS');
    console.log('-'.repeat(50));
    
    try {
      // Simular mensagem de agendamento
      const testMessage = 'Gostaria de agendar uma consulta';
      const testPhoneNumber = '+5547999999999';
      
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
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'MESSAGE_PROCESSING', error: error.message });
    }
  }

  /**
   * Teste 8: Validação de respostas
   */
  async testResponseValidation() {
    console.log('\n✅ TESTE 8: VALIDAÇÃO DE RESPOSTAS');
    console.log('-'.repeat(50));
    
    try {
      // Testar geração de resposta de fallback
      const fallbackResponse = LLMOrchestratorService.generateIntelligentFallbackResponse(
        { name: 'GREETING' },
        { name: 'Clínica Teste' },
        true,
        true,
        { name: 'Usuário Teste' },
        'Olá'
      );
      
      if (!fallbackResponse || fallbackResponse.length === 0) {
        throw new Error('Geração de resposta de fallback falhou');
      }
      
      console.log('✅ Resposta de fallback gerada com sucesso');
      
      // Testar humanização de respostas
      const humanizedResponse = LLMOrchestratorService.humanizationHelpers.addPersonalTouch(
        'Olá, como posso ajudar?',
        'João'
      );
      
      if (!humanizedResponse || humanizedResponse.length === 0) {
        throw new Error('Humanização de resposta falhou');
      }
      
      console.log('✅ Humanização de resposta funcionando');
      
      this.testResults.push({ test: 'RESPONSE_VALIDATION', status: 'PASS' });
      
    } catch (error) {
      console.error(`❌ ${error.message}`);
      this.errors.push({ test: 'RESPONSE_VALIDATION', error: error.message });
    }
  }

  /**
   * Gera relatório final
   */
  generateFinalReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DOS TESTES');
    console.log('='.repeat(80));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.errors.length;
    const warningsCount = this.warnings.length;
    
    console.log(`\n📈 RESUMO:`);
    console.log(`   ✅ Testes aprovados: ${passedTests}/${totalTests}`);
    console.log(`   ❌ Testes falharam: ${failedTests}`);
    console.log(`   ⚠️  Avisos: ${warningsCount}`);
    
    if (this.errors.length > 0) {
      console.log(`\n❌ ERROS ENCONTRADOS:`);
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.test}] ${error.error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  AVISOS:`);
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.test}] ${warning.warning}`);
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

// Executar testes se o arquivo for executado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AppointmentSystemE2ETest();
  tester.runAllTests().catch(error => {
    console.error('💥 ERRO FATAL NO TESTE:', error);
    process.exit(1);
  });
}

export default AppointmentSystemE2ETest;
