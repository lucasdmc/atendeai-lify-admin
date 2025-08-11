// Teste detalhado para debugar AppointmentConversationService
import { AppointmentConversationService } from './services/appointmentConversationService.js';

async function testAppointmentDebug() {
  try {
    console.log('🧪 Testando AppointmentConversationService em detalhes...');
    
    const clinicId = '4a73f615-b636-4134-8937-c20b5db5acac';
    const patientPhone = '554797192447';
    const message = 'Gostaria de realizar um agendamento';
    
    console.log('📋 Parâmetros:');
    console.log('  - Clinic ID:', clinicId);
    console.log('  - Patient Phone:', patientPhone);
    console.log('  - Message:', message);
    
    // Testar carregamento de dados da clínica
    console.log('\n📋 Testando carregamento de dados da clínica...');
    const clinicData = AppointmentConversationService.loadClinicData(clinicId);
    
    if (clinicData) {
      console.log('✅ Dados da clínica carregados com sucesso');
      console.log('📋 Clínica:', clinicData.clinica?.informacoes_basicas?.nome);
      console.log('📋 Especialidades:', clinicData.clinica?.informacoes_basicas?.especialidades_secundarias?.length || 0);
    } else {
      console.log('❌ Falha ao carregar dados da clínica');
    }
    
    // Testar processamento de mensagem
    console.log('\n📝 Testando processamento de mensagem...');
    const result = await AppointmentConversationService.processMessage(
      message,
      patientPhone,
      clinicId
    );
    
    console.log('\n📤 Resultado completo:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.message && result.message.includes('não foi possível carregar')) {
      console.log('\n❌ PROBLEMA IDENTIFICADO: Dados da clínica não foram carregados');
    } else {
      console.log('\n✅ SUCESSO: Mensagem processada corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAppointmentDebug();
