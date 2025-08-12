import config from '../config/index.js';
import logger from '../utils/logger.js';

export default class ClinicRoutingRepository {
  constructor() {
    this.supabase = config.getSupabaseClient();
  }

  async resolveClinicByWebhook({ phoneNumberId, displayPhoneNumber, patientPhone }) {
    // 1) Tentar mapear por phone_number_id -> tabela clinic_whatsapp_numbers (se existir)
    if (phoneNumberId) {
      const { data, error } = await this.supabase
        .from('clinic_whatsapp_numbers')
        .select('clinic_id')
        .eq('phone_number_id', phoneNumberId)
        .maybeSingle();
      if (!error && data?.clinic_id) {
        logger.info('[ClinicRouting] resolved by phone_number_id', { clinicId: data.clinic_id });
        return data.clinic_id;
      }
    }

    // 2) Tentar pelo display_phone_number (número do remetente no webhook)
    if (displayPhoneNumber) {
      const normalized = displayPhoneNumber.startsWith('+') ? displayPhoneNumber : `+${displayPhoneNumber}`;
      const { data, error } = await this.supabase
        .from('clinics')
        .select('id')
        .eq('whatsapp_phone', normalized)
        .maybeSingle();
      if (!error && data?.id) {
        logger.info('[ClinicRouting] resolved by display_phone_number', { clinicId: data.id });
        return data.id;
      }
    }

    // 3) Fallback pelo histórico do paciente
    if (patientPhone) {
      const { data, error } = await this.supabase
        .from('whatsapp_conversations_improved')
        .select('clinic_id')
        .eq('patient_phone_number', patientPhone)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data?.clinic_id) {
        logger.info('[ClinicRouting] resolved by patient history', { clinicId: data.clinic_id });
        return data.clinic_id;
      }
    }

    return null;
  }
}
