import crypto from 'crypto';

export function generateTraceId() {
  return crypto.randomBytes(8).toString('hex');
}

export function withTraceId(obj, traceId) {
  return { ...(obj || {}), traceId };
}
