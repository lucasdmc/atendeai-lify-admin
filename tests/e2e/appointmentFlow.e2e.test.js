// E2E skeleton: appointment flow
// Objetivo: simular uma conversa de agendamento ponta-a-ponta com mocks de WhatsApp e Google Calendar

import assert from 'assert';
import LLMOrchestratorService from '../../services/core/llmOrchestratorService.js';

// Mocks mínimos (exemplo):
// - Mock GoogleCalendarService dentro do AppointmentFlowManager.
// - Mock de Supabase via injection em repositories.
// - Simular intents de agendamento, seleção de serviço e slot.

try {
  // Arrange
  const phoneNumber = '5511999999999';
  const clinicContext = { name: 'Clinica Teste', timezone: 'America/Sao_Paulo' };
  // Nota: para um E2E real, injetar mocks nos serviços core e preparar estado inicial no DB de teste.

  // Act (alto nível): mensagens do usuário em sequência
  const r1 = await LLMOrchestratorService.processMessage({ phoneNumber, message: 'Quero agendar consulta' });
  assert.ok(r1, 'deve responder à intenção de agendamento');

  // Em seguida, o usuário escolhe serviço/horário (ex.: mensagens subsequentes)
  // ...

  console.log('appointmentFlow.e2e.test.js (skeleton) OK');
  process.exit(0);
} catch (err) {
  console.error('appointmentFlow.e2e.test.js FAILED (skeleton)', err);
  process.exit(1);
}
