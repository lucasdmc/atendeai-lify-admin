import config from '../config/index.js';

const TABLE = 'google_calendar_tokens_by_clinic';

export default class GoogleTokenStore {
  constructor() {
    this.supabase = config.getSupabaseClient();
  }

  async getToken(clinicId) {
    const { data, error } = await this.supabase
      .from(TABLE)
      .select('*')
      .eq('clinic_id', clinicId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    // Preferir coluna JSON `tokens` se existir
    if (typeof data.tokens !== 'undefined' && data.tokens) {
      return data.tokens;
    }

    // Reconstruir objeto de tokens a partir de colunas planas
    if (data.access_token) {
      const token = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || undefined,
        scope: data.scope || undefined,
      };
      if (data.expires_at) {
        const expires = new Date(data.expires_at).getTime();
        token.expiry_date = Number.isNaN(expires) ? undefined : expires;
      }
      return token;
    }

    return null;
  }

  async setToken(clinicId, tokens) {
    // Se a tabela possuir coluna JSON `tokens`, persiste nela; caso contrário, persiste nas colunas planas
    const payloadWithJson = { clinic_id: clinicId, tokens, updated_at: new Date().toISOString() };
    const payloadFlat = {
      clinic_id: clinicId,
      access_token: tokens?.access_token || null,
      refresh_token: tokens?.refresh_token || null,
      expires_at: tokens?.expiry_date ? new Date(tokens.expiry_date).toISOString() : (tokens?.expires_at || null),
      scope: tokens?.scope || null,
      updated_at: new Date().toISOString(),
    };

    // Tenta upsert com `tokens` JSON primeiro
    let err = null;
    try {
      const { error } = await this.supabase
        .from(TABLE)
        .upsert(payloadWithJson, { onConflict: 'clinic_id' });
      if (!error) return;
      err = error;
    } catch (e) {
      err = e;
    }

    // Fallback para colunas planas
    if (err) {
      const { error } = await this.supabase
        .from(TABLE)
        .upsert(payloadFlat, { onConflict: 'clinic_id' });
      if (error) throw error;
    }
  }

  async clearToken(clinicId) {
    const { error } = await this.supabase
      .from(TABLE)
      .delete()
      .eq('clinic_id', clinicId);
    if (error) throw error;
  }
}
