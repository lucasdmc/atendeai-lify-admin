// tests/e2e/appointmentFlow.e2e.test.js (runner simples com mocks)
import assert from 'assert';
import AppointmentFlowManager from '../../services/core/appointmentFlowManager.js';

// Mock básico do GoogleCalendarService usado pelo AppointmentFlowManager
class MockGoogleCalendarService {
  constructor() {
    this.created = [];
  }
  async initialize() { return true; }
  async authenticateForClinic() { return true; }
  resolveCalendarId(clinicContext, { serviceId, professionalId } = {}) {
    const byProf = clinicContext.googleCalendar?.calendarsByProfessional || {};
    const bySrv = clinicContext.googleCalendar?.calendarsByService || {};
    if (professionalId && byProf[professionalId]) return byProf[professionalId];
    if (serviceId && bySrv[serviceId]) return bySrv[serviceId];
    return clinicContext.googleCalendar?.calendarId || 'primary';
  }
  async getAvailableSlots(_clinicId, clinicContext, selectedService) {
    const calendarId = this.resolveCalendarId(clinicContext, { serviceId: selectedService?.id });
    // Retorna 2 slots sintéticos que não conflitam
    const now = new Date();
    now.setDate(now.getDate() + 1);
    now.setHours(9, 0, 0, 0);
    const slot1 = new Date(now);
    const slot2 = new Date(now); slot2.setHours(10);
    return [slot1, slot2].map(d => ({
      datetime: d,
      displayDate: d.toLocaleDateString('pt-BR'),
      displayTime: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      available: true,
      duration: selectedService?.duration || 30,
      calendarId
    }));
  }
  async createAppointment(clinicId, appointmentData, clinicContext) {
    const calendarId = this.resolveCalendarId(clinicContext, {
      serviceId: appointmentData?.selectedService?.id,
      professionalId: appointmentData?.selectedProfessional?.id
    });
    this.created.push({ clinicId, calendarId, appointmentData });
    return { success: true, eventId: 'evt_mock', eventLink: 'https://mock', calendarId, startTime: appointmentData.selectedSlot.datetime };
  }
}

async function run() {
  // Arrange
  const afm = new AppointmentFlowManager();
  // Injeta mock do GoogleCalendarService
  afm.googleCalendar = new MockGoogleCalendarService();
  afm.initialized = true;

  const clinicContext = {
    id: 'clinic-1',
    name: 'Clínica Mock',
    googleCalendar: {
      enabled: true,
      calendarId: 'default_calendar',
      calendarsByService: { cardio: 'cal_servico_a' },
      calendarsByProfessional: { 'dr-ana': 'cal_dr_ana' }
    },
    appointmentRules: { minimumAdvanceHours: 1 },
    policies: { appointment: { prioritization: ['urgencia', 'retorno', 'exame'] } },
    servicesDetails: { consultas: [{ id: 'cardio', nome: 'Consulta Cardiologia', duracao: 30 }] },
    services: [{ id: 'cardio', name: 'Consulta Cardiologia', duration: 30, type: 'consulta', category: 'urgencia' }],
    workingHours: { monday: { abertura: '08:00', fechamento: '18:00' } }
  };

  // Simula fluxo manualmente (sem LLM):
  const phone = '+5511999999999';
  let flow = afm.createNewFlowState(clinicContext);

  // Start → retorna serviços
  const start = await afm.startAppointmentCreation(phone, clinicContext, { userProfile: { name: 'João' } }, flow);
  assert.ok(start?.metadata?.flowStep === 'service_selection', 'deve pedir seleção de serviço');
  flow.step = 'service_selection';
  flow.data = { availableServices: afm.extractServicesFromContext(clinicContext) };

  // Escolhe serviço cardio
  const sel = await afm.processServiceSelection(phone, '1', clinicContext, flow);
  assert.ok(sel?.metadata?.flowStep === 'date_time_selection', 'deve ir para seleção de horário');

  // Seleciona primeiro horário
  const cont = await afm.processDateTimeSelection(phone, '1', clinicContext, flow);
  assert.ok(cont?.metadata?.flowStep === 'confirmation', 'deve ir para confirmação');

  // Confirma
  const fin = await afm.processAppointmentConfirmation(phone, 'sim', clinicContext, flow, { userProfile: { name: 'João' } });
  assert.ok(fin?.metadata?.flowStep === 'completed', 'deve completar o fluxo');

  // Verifica calendarId usado
  const created = afm.googleCalendar.created[0];
  assert.ok(created, 'deve ter criado evento');
  assert.strictEqual(created.calendarId, 'cal_servico_a', 'deve usar calendarId do serviço');

  console.log('✅ appointmentFlow.e2e.test.js OK');
}

run().catch((e) => { console.error(e); process.exit(1); });
