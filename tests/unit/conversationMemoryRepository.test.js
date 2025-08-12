import assert from 'assert';
import ConversationMemoryRepository from '../../services/core/conversationMemoryRepository.js';

// Monkey patch simple para o supabase client interno
const repo = new ConversationMemoryRepository();
const originalSupabase = repo.supabase;

// Mock data
let mockRow = {
  memory_data: { history: [{ timestamp: new Date().toISOString(), user: 'oi', bot: 'olá' }] },
  user_name: JSON.stringify({ name: 'João' }),
  last_interaction: new Date().toISOString(),
};

repo.supabase = {
  from() {
    return {
      select() { return this; },
      eq() { return this; },
      maybeSingle: async () => ({ data: mockRow, error: null }),
      upsert: async () => ({ data: null, error: null }),
    };
  }
};

try {
  const loaded = await repo.load('5511999999999');
  assert.strictEqual(loaded.userProfile.name, 'João', 'deve parsear user_name JSON');
  assert.ok(Array.isArray(loaded.history), 'history deve ser array');

  // Teste saveName sem erros
  await repo.saveName('5511999999999', 'Maria');

  // Teste append sem erros
  await repo.append('5511999999999', 'hi', 'hello', { name: 'GREETING' }, { name: 'Maria' }, []);

  console.log('conversationMemoryRepository.test.js OK');
  process.exit(0);
} catch (err) {
  console.error('conversationMemoryRepository.test.js FAILED', err);
  process.exit(1);
} finally {
  repo.supabase = originalSupabase;
}
