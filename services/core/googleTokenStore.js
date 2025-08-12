import config from '../config/index.js';

const TABLE = 'google_calendar_tokens_by_clinic';

export default class GoogleTokenStore {
  constructor() {
    this.supabase = config.getSupabaseClient();
  }

  async getToken(clinicId) {
    const { data, error } = await this.supabase
      .from(TABLE)
      .select('tokens')
      .eq('clinic_id', clinicId)
      .maybeSingle();
    if (error) throw error;
    return data?.tokens || null;
  }

  async setToken(clinicId, tokens) {
    const payload = { clinic_id: clinicId, tokens };
    const { error } = await this.supabase
      .from(TABLE)
      .upsert(payload, { onConflict: 'clinic_id' });
    if (error) throw error;
  }

  async clearToken(clinicId) {
    const { error } = await this.supabase
      .from(TABLE)
      .delete()
      .eq('clinic_id', clinicId);
    if (error) throw error;
  }
}
