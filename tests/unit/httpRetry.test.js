import assert from 'assert';
import httpInstance, { postWithRetry } from '../../services/utils/http.js';

// Monkey patch em runtime para simular 2 falhas e depois sucesso
let calls = 0;
const originalPost = httpInstance.post;
httpInstance.post = async (url, data, options) => {
  calls += 1;
  if (calls < 3) {
    const err = new Error('Server error');
    err.response = { status: 500, headers: {} };
    throw err;
  }
  return { status: 200, data: { ok: true } };
};

try {
  const res = await postWithRetry('https://api.test/retry', { a: 1 }, { headers: {}, maxRetries: 3 });
  assert.strictEqual(res.status, 200, 'deve retornar 200 após retries');
  assert.strictEqual(calls, 3, 'deve tentar 3 vezes');
  console.log('httpRetry.test.js OK');
  process.exit(0);
} catch (err) {
  console.error('httpRetry.test.js FAILED', err);
  process.exit(1);
} finally {
  httpInstance.post = originalPost;
}
