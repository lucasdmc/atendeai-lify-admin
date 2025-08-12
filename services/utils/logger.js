const SENSITIVE_KEYS = ['authorization', 'access_token', 'accessToken', 'phoneNumberId', 'apiKey', 'apikey', 'password'];

function redact(value) {
  if (typeof value === 'string' && value.length > 8) {
    return value.slice(0, 4) + '****' + value.slice(-2);
  }
  return '***redacted***';
}

function safe(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  for (const key of Object.keys(clone)) {
    if (SENSITIVE_KEYS.includes(key)) {
      clone[key] = redact(clone[key]);
    } else if (typeof clone[key] === 'object') {
      clone[key] = safe(clone[key]);
    }
  }
  return clone;
}

function log(level, message, meta) {
  const payload = {
    level,
    time: new Date().toISOString(),
    message,
    ...(meta ? { meta: safe(meta) } : {}),
  };
  // Simples: imprimir como JSON uma linha
  const line = JSON.stringify(payload);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export default {
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};
