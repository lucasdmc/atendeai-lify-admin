import assert from 'assert';
import { computeIdempotencyKey } from '../../services/utils/idempotency.js';

try {
  const key1 = computeIdempotencyKey({ method: 'POST', url: 'https://api.test/send', body: { a: 1, b: 2 } });
  const key2 = computeIdempotencyKey({ method: 'POST', url: 'https://api.test/send', body: { b: 2, a: 1 } });
  const key3 = computeIdempotencyKey({ method: 'POST', url: 'https://api.test/send', body: { a: 1, b: 3 } });

  assert.ok(typeof key1 === 'string' && key1.length === 64, 'key1 deve ser um sha256 hex');
  assert.strictEqual(key1, key2, 'keys com objeto equivalente devem ser iguais');
  assert.notStrictEqual(key1, key3, 'keys com objeto diferente devem ser diferentes');

  console.log('idempotency.test.js OK');
  process.exit(0);
} catch (err) {
  console.error('idempotency.test.js FAILED', err);
  process.exit(1);
}
