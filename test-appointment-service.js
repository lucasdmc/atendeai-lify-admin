// Teste específico para AppointmentConversationService
import { AppointmentConversationService } from './services/appointmentConversationService.js';

async function testAppointmentService() {
  try {
    console.log('🧪 Testando AppointmentConversationService...');
    
    // Testar carregamento de dados da clínica
    console.log('📋 Testando carregamento de dados da clínica...');
    const clinicData = AppointmentConversationService.loadClinicData('4a73f615-b636-4134-8937-c20b5db5acac');
    
    if (clinicData) {
      console.log('✅ Dados da clínica carregados com sucesso');
      console.log('📋 Clínica:', clinicData.clinica?.informacoes_basicas?.nome);
    } else {
      console.log('❌ Falha ao carregar dados da clínica');
    }
    
    // Testar processamento de mensagem
    console.log('📝 Testando processamento de mensagem...');
    const result = await AppointmentConversationService.processMessage(
      'Gostaria de realizar um agendamento',
      '554797192447',
      '4a73f615-b636-4134-8937-c20b5db5acac'
    );
    
    console.log('📤 Resultado:', result);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testAppointmentService();
