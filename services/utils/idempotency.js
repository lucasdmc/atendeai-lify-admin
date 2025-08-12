import crypto from 'crypto';

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

export function computeIdempotencyKey({ method = 'POST', url = '', body = {}, extra = '' }) {
  const payload = `${method}|${url}|${stableStringify(body)}|${extra}`;
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  return hash;
}
