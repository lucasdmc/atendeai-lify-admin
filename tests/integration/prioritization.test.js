// tests/integration/prioritization.test.js (runner simples)
import AppointmentFlowManager from '../../services/core/appointmentFlowManager.js';

function includesInOrder(text, names) {
  let lastIndex = -1;
  for (const name of names) {
    const idx = text.indexOf(name);
    if (idx === -1 || idx < lastIndex) return false;
    lastIndex = idx;
  }
  return true;
}

async function run() {
  const afm = new AppointmentFlowManager();
  const clinicContext = {
    name: 'Clínica X',
    policies: { appointment: { prioritization: ['urgencia', 'retorno', 'exame'] } }
  };
  const availableServices = [
    { id: 's1', name: 'Exame Laboratorial', type: 'exame', category: 'exame', duration: 15 },
    { id: 's2', name: 'Retorno Clínico', type: 'consulta', category: 'retorno', duration: 20 },
    { id: 's3', name: 'Atendimento de Urgência', type: 'consulta', category: 'urgencia', duration: 30 },
  ];

  const response = afm.generateServiceSelectionResponse('João', clinicContext, availableServices);
  const ok = includesInOrder(response, ['Atendimento de Urgência', 'Retorno Clínico', 'Exame Laboratorial']);
  if (!ok) {
    throw new Error('Ordem de priorização incorreta');
  }
  console.log('✅ prioritization.test.js OK');
}

run().catch((e) => { console.error(e); process.exit(1); });

