// Teste específico para verificar AppointmentConversationService em produção
import { AppointmentConversationService } from './services/appointmentConversationService.js';

async function testProductionAppointment() {
  try {
    console.log('🧪 Testando AppointmentConversationService em produção...');
    
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    const patientPhone = '554797192447';
    const message = 'Gostaria de realizar um agendamento';
    
    console.log('📋 Parâmetros:');
    console.log('  - Clinic ID:', clinicId);
    console.log('  - Patient Phone:', patientPhone);
    console.log('  - Message:', message);
    
    // Simular ambiente de produção (sem arquivos locais)
    console.log('\n📋 Simulando ambiente de produção...');
    
    // Testar carregamento de dados da clínica
    console.log('\n📋 Testando carregamento de dados da clínica...');
    const clinicData = await AppointmentConversationService.loadClinicData(clinicId);
    
    if (clinicData) {
      console.log('✅ Dados da clínica carregados com sucesso');
      console.log('📋 Clínica:', clinicData.clinica?.informacoes_basicas?.nome);
      console.log('📋 Especialidades:', clinicData.clinica?.informacoes_basicas?.especialidades_secundarias?.length || 0);
    } else {
      console.log('❌ Falha ao carregar dados da clínica');
      console.log('📋 Isso indica que o problema está no carregamento dos dados');
      return;
    }
    
    // Testar processamento de mensagem
    console.log('\n📝 Testando processamento de mensagem...');
    const result = await AppointmentConversationService.processMessage(
      message,
      patientPhone,
      clinicId
    );
    
    console.log('\n📤 Resultado:');
    console.log('Message:', result.message);
    console.log('Next Step:', result.nextStep);
    console.log('Requires Input:', result.requiresInput);
    
    if (result.message && result.message.includes('não foi possível carregar')) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Dados da clínica não foram carregados em produção');
    } else {
      console.log('\n✅ SUCESSO: Mensagem processada corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testProductionAppointment();
