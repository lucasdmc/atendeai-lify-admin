// tests/unit/contextExtraction.test.js (runner simples sem Jest)
import ClinicContextManager from '../../services/core/clinicContextManager.js';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const json = {
    clinica: {
      informacoes_basicas: { nome: 'Esadi' },
      horario_funcionamento: {
        segunda: [{ inicio: '08:00', fim: '17:00' }],
        terca: [{ inicio: '09:00', fim: '18:00' }]
      },
      contatos: { telefone_principal: '+55 47 99999-0000' }
    },
    servicos: {
      consultas: [{ id: 'cardio', nome: 'Cardiologia', duracao: 30 }]
    },
    profissionais: [{ id: 'dr-joao', nome_completo: 'Dr. João' }],
    politicas: {
      agendamento: {
        antecedencia_minima_horas: 24,
        antecedencia_maxima_dias: 90,
        priorizacao: ['urgencia', 'retorno', 'exame']
      }
    },
    google_calendar: {
      timezone: 'America/Sao_Paulo',
      calendarios: [
        { level: 'service', service_key: 'cardio', calendar_id: 'cal_servico_a' },
        { level: 'professional', professional_key: 'dr-joao', calendar_id: 'cal_dr_joao' }
      ]
    }
  };

  const result = ClinicContextManager.extractClinicDataFromJson(json, 'esadi');
  assert(result.businessHours.monday.start === '08:00', 'businessHours monday');
  assert(result.googleCalendar.calendarsByService.cardio === 'cal_servico_a', 'calendar by service');
  assert(result.googleCalendar.calendarsByProfessional['dr-joao'] === 'cal_dr_joao', 'calendar by professional');
  assert(Array.isArray(result.policies.appointment.prioritization) && result.policies.appointment.prioritization[0] === 'urgencia', 'prioritization');
  console.log('✅ contextExtraction.test.js OK');
}

run().catch((e) => { console.error(e); process.exit(1); });


