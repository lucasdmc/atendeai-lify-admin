import assert from 'assert';
import FlowStateStore from '../../services/core/flowStateStore.js';

const store = new FlowStateStore();
const originalSupabase = store.supabase;

// Mock supabase para não gravar nada
store.supabase = {
  from() { return { select: () => this, eq: () => this, maybeSingle: async () => ({ data: null, error: null }), upsert: async () => ({}), delete: async () => ({}) }; }
};

try {
  const key = '5511999999999';
  const state = { step: 'service_selection', data: { clinicId: 'clinic-1' } };
  let loaded = await store.get(key);
  assert.strictEqual(loaded, null, 'store vazio deve retornar null');

  await store.set(key, state);
  loaded = await store.get(key);
  assert.deepStrictEqual(loaded, state, 'deve ler o mesmo estado gravado');

  await store.clear(key);
  loaded = await store.get(key);
  assert.strictEqual(loaded, null, 'deve limpar o estado');

  console.log('flowStateStore.test.js OK');
  process.exit(0);
} catch (err) {
  console.error('flowStateStore.test.js FAILED', err);
  process.exit(1);
} finally {
  store.supabase = originalSupabase;
}
