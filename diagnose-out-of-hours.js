// diagnose-out-of-hours.js
// Diagnóstico para identificar por que um número específico recebe mensagem de fora do horário

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente faltando: SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Parâmetros
const CLINIC_WHATSAPP = '554730915628'; // CardioPrime (sem +, como na tabela clinic_whatsapp_numbers)
const CLINIC_WHATSAPP_E164 = '+554730915628'; // Formato E.164 (como em clinics.whatsapp_phone)
const PATIENT_NUMBERS = ['5547997192447', '5597192447'];

function getBrazilNow() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

function getDayOfWeekPt(brazilTime) {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  return days[brazilTime.getDay()];
}

function parseTimeHHMM(str) {
  if (!str) return null;
  const [h, m] = String(str).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 100 + m;
}

function evaluateBusinessHours(workingHours) {
  const nowBR = getBrazilNow();
  const currentDay = getDayOfWeekPt(nowBR);
  const currentTime = nowBR.getHours() * 100 + nowBR.getMinutes();

  const today = workingHours?.[currentDay];
  if (!today || !today.abertura || !today.fechamento) {
    return {
      isWithin: false,
      reason: `Horário não configurado para ${currentDay} (abertura/fechamento ausentes)`,
      snapshot: { currentDay, currentTime, today }
    };
  }

  const opening = parseTimeHHMM(today.abertura);
  const closing = parseTimeHHMM(today.fechamento);
  if (opening == null || closing == null) {
    return {
      isWithin: false,
      reason: `Formato inválido de horário em ${currentDay} (abertura="${today.abertura}", fechamento="${today.fechamento}")`,
      snapshot: { currentDay, currentTime, opening, closing, today }
    };
  }

  const isWithin = currentTime >= opening && currentTime <= closing;
  return {
    isWithin,
    reason: isWithin ? 'Dentro do horário' : 'Fora do horário',
    snapshot: { currentDay, currentTime, opening, closing, today }
  };
}

async function main() {
  console.log('🔎 Iniciando diagnóstico: fora do horário para números específicos');
  console.log('⏱️ Agora (America/Sao_Paulo):', getBrazilNow().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));

  // 1) Conferir mapeamento em clinic_whatsapp_numbers
  console.log('\n1) Verificando clinic_whatsapp_numbers...');
  const { data: mapRows, error: mapErr } = await supabase
    .from('clinic_whatsapp_numbers')
    .select('clinic_id, whatsapp_number, is_active')
    .eq('whatsapp_number', CLINIC_WHATSAPP)
    .eq('is_active', true);
  if (mapErr) {
    console.error('❌ Erro clinic_whatsapp_numbers:', mapErr.message);
  } else {
    console.log('➡️  Registros ativos:', mapRows?.length || 0, mapRows || []);
  }

  let clinicId = mapRows?.[0]?.clinic_id || null;

  // 2) Conferir registro da clínica em clinics
  console.log('\n2) Verificando clinics por whatsapp_phone...');
  const { data: clinicsByPhone, error: clinicPhoneErr } = await supabase
    .from('clinics')
    .select('id, name, whatsapp_phone, has_contextualization, contextualization_json')
    .eq('whatsapp_phone', CLINIC_WHATSAPP_E164);
  if (clinicPhoneErr) {
    console.error('❌ Erro clinics (por whatsapp_phone):', clinicPhoneErr.message);
  } else {
    console.log('➡️  clinics (por whatsapp_phone):', clinicsByPhone?.length || 0);
  }

  // Se não achou pelo E.164, tentar sem +
  let clinicRow = clinicsByPhone?.[0] || null;
  if (!clinicRow) {
    const { data: clinicsNoPlus } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone, has_contextualization, contextualization_json')
      .eq('whatsapp_phone', CLINIC_WHATSAPP);
    if (clinicsNoPlus && clinicsNoPlus.length > 0) {
      clinicRow = clinicsNoPlus[0];
    }
  }

  if (!clinicRow && clinicId) {
    const { data: clinicById } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone, has_contextualization, contextualization_json')
      .eq('id', clinicId)
      .single();
    if (clinicById) clinicRow = clinicById;
  }

  if (!clinicRow) {
    console.error('❌ Clínica não encontrada em clinics para o número informado.');
  } else {
    clinicId = clinicRow.id;
    console.log('➡️  Clínica encontrada:', { id: clinicRow.id, name: clinicRow.name, whatsapp_phone: clinicRow.whatsapp_phone, has_contextualization: clinicRow.has_contextualization });
  }

  // 3) Avaliar horários do JSON da clínica
  if (clinicRow?.contextualization_json) {
    const json = clinicRow.contextualization_json;
    const workingHours = json?.clinica?.horario_funcionamento || null;
    const outOfHoursMessage = json?.agente_ia?.configuracao?.mensagem_fora_horario || null;
    console.log('\n3) Horário de funcionamento (JSON):', workingHours || 'N/D');
    console.log('   Mensagem fora do horário:', outOfHoursMessage || 'N/D');

    const evalResult = evaluateBusinessHours(workingHours);
    console.log('   Avaliação agora:', evalResult);
  } else {
    console.log('\n3) JSON da clínica ausente em clinics.contextualization_json');
  }

  // 4) Verificar vínculos de histórico dos seus números
  console.log('\n4) Histórico recente por patient_phone_number (whatsapp_conversations_improved)...');
  const { data: convRows, error: convErr } = await supabase
    .from('whatsapp_conversations_improved')
    .select('clinic_id, patient_phone_number, clinic_whatsapp_number, last_message_at')
    .in('patient_phone_number', PATIENT_NUMBERS)
    .order('last_message_at', { ascending: false })
    .limit(10);
  if (convErr) {
    console.error('❌ Erro whatsapp_conversations_improved:', convErr.message);
  } else {
    console.log('➡️  Conversas encontradas:', convRows?.length || 0);
    console.table(convRows || []);
  }

  // 5) Para cada clinic_id encontrado no histórico dos números, trazer nome e checar horários
  const clinicIdsFromHistory = Array.from(new Set((convRows || []).map(r => r.clinic_id).filter(Boolean)));
  if (clinicIdsFromHistory.length > 0) {
    console.log('\n5) Detalhes das clínicas do histórico:');
    const { data: clinicsDetails } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone, has_contextualization, contextualization_json')
      .in('id', clinicIdsFromHistory);
    for (const c of clinicsDetails || []) {
      const w = c.contextualization_json?.clinica?.horario_funcionamento || null;
      const evalRes = evaluateBusinessHours(w || {});
      console.log(`   • ${c.id} - ${c.name} (${c.whatsapp_phone}) hasCtx=${c.has_contextualization} -> abertoAgora=${evalRes.isWithin} (${evalRes.reason})`);
    }
  }

  console.log('\n✅ Diagnóstico concluído.');
}

main().catch(err => {
  console.error('💥 Erro no diagnóstico:', err);
  process.exit(1);
});


