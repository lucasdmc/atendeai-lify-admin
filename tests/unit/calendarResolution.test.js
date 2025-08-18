// tests/unit/calendarResolution.test.js (runner simples sem Jest)
import GoogleCalendarService from '../../services/core/googleCalendarService.js';

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} - esperado: ${expected}, obtido: ${actual}`);
  }
}

async function run() {
  const svc = new GoogleCalendarService();
  const context = {
    googleCalendar: {
      calendarId: 'default_calendar',
      calendarsByService: { cardio: 'cal_servico_a', echo: 'cal_servico_echo' },
      calendarsByProfessional: { 'dr-joao': 'cal_dr_joao' }
    }
  };

  const id1 = svc.resolveCalendarId(context, { serviceId: 'cardio', professionalId: 'dr-joao' });
  assertEqual(id1, 'cal_dr_joao', 'prioriza professional');

  const id2 = svc.resolveCalendarId(context, { serviceId: 'cardio' });
  assertEqual(id2, 'cal_servico_a', 'usa serviço');

  const id3 = svc.resolveCalendarId(context, { serviceId: 'nao-existe' });
  assertEqual(id3, 'default_calendar', 'fallback default');

  console.log('✅ calendarResolution.test.js OK');
}

run().catch((e) => { console.error(e); process.exit(1); });


