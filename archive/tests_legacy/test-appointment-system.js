// ========================================
// TESTE DO SISTEMA DE AGENDAMENTO
// ========================================

import { AppointmentConversationService } from './services/appointmentConversationService.js';
import { AppointmentService } from './services/appointmentService.js';
import { AppointmentConfirmationService } from './services/appointmentConfirmationService.js';

async function testAppointmentSystem() {
  console.log('🧪 [Test] Iniciando teste do sistema de agendamento...\n');

  const testPhone = '5547997192447';
  const clinicId = 'cardioprime';

  try {
    // Teste 1: Reconhecimento de intenção
    console.log('📋 [Test] 1. Testando reconhecimento de intenção...');
    const intent = await AppointmentService.recognizeAppointmentIntent('Quero agendar uma consulta');
    console.log('✅ Intenção detectada:', intent);
    console.log('');

    // Teste 2: Fluxo completo de agendamento
    console.log('📋 [Test] 2. Testando fluxo completo de agendamento...');
    
    // Simular conversa de agendamento
    const messages = [
      'Quero agendar uma consulta',
      'Lucas Cantoni',
      'mesmo',
      'Cardiologia',
      'amanhã',
      '1',
      '1',
      '1'
    ];

    let currentState = null;
    
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      console.log(`📤 [Test] Mensagem ${i + 1}: "${message}"`);
      
      const result = await AppointmentConversationService.processMessage(
        message,
        testPhone,
        clinicId
      );
      
      console.log(`📥 [Test] Resposta ${i + 1}:`);
      console.log(result.message);
      console.log(`Status: ${result.nextStep}`);
      console.log('');
      
      currentState = result.state;
    }

    // Teste 3: Buscar horários disponíveis
    console.log('📋 [Test] 3. Testando busca de horários disponíveis...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const availableSlots = await AppointmentService.getAvailableTimeSlots(tomorrow, clinicId);
    console.log('✅ Horários disponíveis:', availableSlots);
    console.log('');

    // Teste 4: Criar agendamento
    console.log('📋 [Test] 4. Testando criação de agendamento...');
    const appointmentData = {
      patientName: 'Lucas Cantoni',
      patientPhone: testPhone,
      specialty: 'Cardiologia',
      date: tomorrow,
      startTime: '09:00',
      endTime: '10:00',
      doctor: {
        nome_exibicao: 'Dr. Roberto',
        especialidades: ['Cardiologia Clínica']
      },
      clinicId: clinicId
    };
    
    const appointmentResult = await AppointmentService.createAppointment(appointmentData);
    console.log('✅ Agendamento criado:', appointmentResult);
    console.log('');

    // Teste 5: Agendar confirmação
    console.log('📋 [Test] 5. Testando agendamento de confirmação...');
    await AppointmentConfirmationService.scheduleConfirmation(appointmentResult.appointment);
    console.log('✅ Confirmação agendada');
    console.log('');

    // Teste 6: Processar confirmações pendentes
    console.log('📋 [Test] 6. Testando processamento de confirmações...');
    await AppointmentConfirmationService.processPendingConfirmations();
    console.log('✅ Confirmações processadas');
    console.log('');

    // Teste 7: Processar resposta de confirmação
    console.log('📋 [Test] 7. Testando resposta de confirmação...');
    const confirmationResponse = await AppointmentConfirmationService.processConfirmationResponse(
      'Sim, confirmo',
      testPhone
    );
    console.log('✅ Resposta de confirmação:', confirmationResponse);
    console.log('');

    console.log('🎉 [Test] Todos os testes concluídos com sucesso!');

  } catch (error) {
    console.error('💥 [Test] Erro durante os testes:', error);
  }
}

// Executar testes
testAppointmentSystem().catch(console.error); 