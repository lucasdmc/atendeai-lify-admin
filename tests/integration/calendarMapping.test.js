// tests/integration/calendarMapping.test.js (runner simples)
import GoogleCalendarService from '../../services/core/googleCalendarService.js';

async function run() {
  const svc = new GoogleCalendarService();
  const clinicContext = {
    id: 'clinic-1',
    googleCalendar: {
      calendarId: 'default_calendar',
      calendarsByService: { eco: 'cal_eco' },
      calendarsByProfessional: { 'dr-ana': 'cal_dr_ana' }
    }
  };

  const idSlots = svc.resolveCalendarId(clinicContext, { serviceId: 'eco' });
  if (idSlots !== 'cal_eco') throw new Error('resolveCalendarId para slots falhou');

  const idCreate = svc.resolveCalendarId(clinicContext, { professionalId: 'dr-ana' });
  if (idCreate !== 'cal_dr_ana') throw new Error('resolveCalendarId para criação falhou');

  console.log('✅ calendarMapping.test.js OK');
}

run().catch((e) => { console.error(e); process.exit(1); });

