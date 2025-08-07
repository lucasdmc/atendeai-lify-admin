#!/usr/bin/env node

// ========================================
// TESTE DO SISTEMA DE AGENDAMENTO
// ========================================

import { AppointmentService } from './src/services/appointmentService.js';
import { AppointmentConversationService } from './src/services/appointmentConversationService.js';
import { ContextualizacaoService } from './src/services/contextualizacaoService.js';

async function testAppointmentSystem() {
  console.log('🧪 TESTE DO SISTEMA DE AGENDAMENTO');
  console.log('=====================================');

  try {
    // Teste 1: Reconhecimento de intenção
    console.log('\n📋 1. Testando reconhecimento de intenção...');
    
    const testMessages = [
      'Quero agendar uma consulta',
      'Preciso marcar um exame',
      'Gostaria de reagendar minha consulta',
      'Quero cancelar meu agendamento',
      'Olá, tudo bem?'
    ];

    for (const message of testMessages) {
      const intent = await AppointmentService.recognizeAppointmentIntent(message);
      console.log(`Mensagem: "${message}"`);
      console.log(`Intenção: ${intent ? intent.intent : 'Nenhuma'}`);
      console.log(`Confiança: ${intent ? intent.confidence : 'N/A'}`);
      console.log('---');
    }

    // Teste 2: Contextualização da clínica
    console.log('\n🏥 2. Testando contextualização da clínica...');
    
    const clinicContext = await ContextualizacaoService.getClinicContext('cardioprime');
    if (clinicContext) {
      console.log('✅ Contexto da clínica carregado');
      console.log(`Nome: ${clinicContext.clinica.informacoes_basicas.nome}`);
      console.log(`Especialidade: ${clinicContext.clinica.informacoes_basicas.especialidade_principal}`);
      console.log(`Profissionais: ${clinicContext.profissionais.length}`);
    } else {
      console.log('❌ Erro ao carregar contexto da clínica');
    }

    // Teste 3: Horários disponíveis
    console.log('\n⏰ 3. Testando busca de horários disponíveis...');
    
    const today = new Date().toISOString().split('T')[0];
    const availableSlots = await AppointmentService.getAvailableSlots('cardioprime', today, 'consulta');
    
    console.log(`Horários disponíveis para ${today}:`);
    if (availableSlots.length > 0) {
      availableSlots.slice(0, 5).forEach((slot, index) => {
        console.log(`${index + 1}. ${slot.startTime} - ${slot.endTime}`);
      });
    } else {
      console.log('Nenhum horário disponível');
    }

    // Teste 4: Fluxo de conversação
    console.log('\n💬 4. Testando fluxo de conversação...');
    
    const testPhone = '5511999999999';
    const clinicId = 'cardioprime';
    
    // Simular mensagens do usuário
    const conversationSteps = [
      'Quero agendar uma consulta',
      'João Silva',
      '15/03/1990',
      '1', // Consulta médica
      '1', // Primeira consulta
      '2', // Particular
      'Dor no peito', // Observações
      '1'  // Confirmar agendamento
    ];

    let conversationState = null;
    
    for (let i = 0; i < conversationSteps.length; i++) {
      const message = conversationSteps[i];
      console.log(`\n📱 Usuário: ${message}`);
      
      const response = await AppointmentConversationService.processMessage(
        message,
        testPhone,
        clinicId
      );
      
      console.log(`🤖 Bot: ${response.message}`);
      console.log(`Passo: ${response.state.step}`);
      
      if (response.state.step === 'completed') {
        console.log('✅ Fluxo de agendamento concluído!');
        break;
      }
      
      conversationState = response.state;
    }

    // Teste 5: Buscar agendamentos do paciente
    console.log('\n📅 5. Testando busca de agendamentos...');
    
    const patientAppointments = await AppointmentService.getPatientAppointments(testPhone);
    console.log(`Agendamentos encontrados: ${patientAppointments.length}`);
    
    patientAppointments.forEach((appointment, index) => {
      console.log(`${index + 1}. ${appointment.patient_name} - ${appointment.date} ${appointment.start_time}`);
    });

    console.log('\n✅ Todos os testes concluídos com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error);
    console.error('Stack:', error.stack);
  }
}

// Executar testes
testAppointmentSystem().catch(console.error); 