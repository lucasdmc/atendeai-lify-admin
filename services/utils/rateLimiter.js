import config from '../config/index.js';

const buckets = new Map();

function getBucket(key, capacity, refillIntervalMs) {
  let bucket = buckets.get(key);
  const now = Date.now();
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  } else {
    const elapsed = now - bucket.lastRefill;
    if (elapsed > refillIntervalMs) {
      const tokensToAdd = Math.floor(elapsed / refillIntervalMs) * capacity;
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }
  return bucket;
}

export function allowRequest(key, capacity = Number(process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE || 60), refillIntervalMs = 60000) {
  const bucket = getBucket(key, capacity, refillIntervalMs);
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true;
  }
  return false;
}

export function remainingTokens(key, capacity = Number(process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE || 60), refillIntervalMs = 60000) {
  return getBucket(key, capacity, refillIntervalMs).tokens;
}
