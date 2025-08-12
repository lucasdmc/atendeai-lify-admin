import config from '../config/index.js';

const memoryStore = new Map();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1h

function now() {
  return Date.now();
}

export default class FlowStateStore {
  constructor() {
    this.supabase = config.getSupabaseClient();
    this.ttlMs = Number(process.env.FLOW_STATE_TTL_MS || DEFAULT_TTL_MS);
  }

  async get(key) {
    // Tentar Supabase
    try {
      const { data, error } = await this.supabase
        .from('conversation_flows')
        .select('state, updated_at')
        .eq('id', key)
        .maybeSingle();
      if (!error && data?.state) return data.state;
    } catch {}

    // Fallback memória
    const item = memoryStore.get(key);
    if (!item) return null;
    if (now() - item.updatedAt > this.ttlMs) {
      memoryStore.delete(key);
      return null;
    }
    return item.state;
  }

  async set(key, state) {
    const payload = { id: key, state, updated_at: new Date().toISOString() };
    // Supabase upsert
    try {
      await this.supabase.from('conversation_flows').upsert(payload, { onConflict: 'id' });
    } catch {}
    // Memória
    memoryStore.set(key, { state, updatedAt: now() });
  }

  async clear(key) {
    try { await this.supabase.from('conversation_flows').delete().eq('id', key); } catch {}
    memoryStore.delete(key);
  }
}
