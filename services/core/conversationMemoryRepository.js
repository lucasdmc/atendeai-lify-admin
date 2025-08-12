import config from '../config/index.js';

export default class ConversationMemoryRepository {
  constructor() {
    this.supabase = config.getSupabaseClient();
  }

  async load(phoneNumber) {
    const { data, error } = await this.supabase
      .from('conversation_memory')
      .select('memory_data, user_name, last_interaction')
      .eq('phone_number', phoneNumber)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;

    if (!data) return { userProfile: {}, history: [], lastUpdated: null };

    const userProfile = {};
    try {
      const raw = data.user_name;
      if (raw) {
        if (typeof raw === 'string' && raw.startsWith('{') && raw.endsWith('}')) {
          userProfile.name = JSON.parse(raw).name;
        } else if (typeof raw === 'object' && raw.name) {
          userProfile.name = raw.name;
        } else if (typeof raw === 'string') {
          userProfile.name = raw;
        }
      }
    } catch {}

    return {
      userProfile,
      history: data.memory_data?.history || [],
      lastUpdated: data.last_interaction || null,
    };
  }

  async saveName(phoneNumber, name) {
    await this.supabase
      .from('conversation_memory')
      .upsert({
        phone_number: phoneNumber,
        user_name: JSON.stringify({ name, extracted_at: new Date().toISOString() }),
        last_interaction: new Date().toISOString(),
      }, { onConflict: 'phone_number' });
  }

  async append(phoneNumber, userMessage, botResponse, intent, userProfile, history) {
    const newHistory = [
      ...history,
      { timestamp: new Date().toISOString(), user: userMessage, bot: botResponse, intent: intent?.name || 'UNKNOWN' },
    ].slice(-10);

    await this.supabase
      .from('conversation_memory')
      .upsert({
        phone_number: phoneNumber,
        memory_data: { history: newHistory, userProfile },
        last_interaction: new Date().toISOString(),
      }, { onConflict: 'phone_number' });
  }
}
