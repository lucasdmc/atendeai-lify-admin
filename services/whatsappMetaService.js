import axios from 'axios';
import config from './config/index.js';
import logger from './utils/logger.js';
import { postWithRetry } from './utils/http.js';
import { computeIdempotencyKey } from './utils/idempotency.js';
import { allowRequest, remainingTokens } from './utils/rateLimiter.js';
import { validateSendTextMessageInput, validateSendMediaMessageInput } from './utils/validate.js';
import crypto from 'crypto';

const http = axios.create({
  timeout: config.HTTP_DEFAULT_TIMEOUT_MS,
  headers: {
    'User-Agent': 'AtendeAI-Lify-Bot/1.0',
  },
});

async function sendWhatsAppTextMessage({ accessToken, phoneNumberId, to, text, traceId }) {
  validateSendTextMessageInput({ accessToken, phoneNumberId, to, text });

  const url = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  };
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const rateKey = `text:${phoneNumberId}:${to}`;
  if (!allowRequest(rateKey)) {
    const remaining = remainingTokens(rateKey);
    const error = new Error('Rate limit exceeded for WhatsApp text messages');
    error.code = 'RATE_LIMITED';
    logger.warn('[WhatsAppMetaService] Rate limited', { traceId, rateKey, remaining });
    throw error;
  }
  
  try {
    const idempotencyKey = computeIdempotencyKey({ method: 'POST', url, body: payload, extra: rateKey });
    const finalHeaders = { ...headers, 'X-Idempotency-Key': idempotencyKey };

    logger.info('[WhatsAppMetaService] Sending text message', { traceId, url, to, textLength: text.length });

    const response = await postWithRetry(url, payload, { headers: finalHeaders, maxRetries: 3 });
    logger.info('[WhatsAppMetaService] Text message sent', { traceId, status: response.status });
    return response.data;
  } catch (error) {
    logger.error('[WhatsAppMetaService] Error sending text message', { traceId, status: error.response?.status, data: error.response?.data, message: error.message });
    throw error;
  }
}

async function sendWhatsAppMediaMessage({ accessToken, phoneNumberId, to, mediaId, type, caption, traceId }) {
  validateSendMediaMessageInput({ accessToken, phoneNumberId, to, mediaId, type });

  const url = `https://graph.facebook.com/${config.WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type,
    [type]: {
      id: mediaId,
      ...(caption ? { caption } : {})
    }
  };
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const rateKey = `media:${type}:${phoneNumberId}:${to}`;
  if (!allowRequest(rateKey)) {
    const remaining = remainingTokens(rateKey);
    const error = new Error('Rate limit exceeded for WhatsApp media messages');
    error.code = 'RATE_LIMITED';
    logger.warn('[WhatsAppMetaService] Rate limited', { traceId, rateKey, remaining });
    throw error;
  }

  const idempotencyKey = computeIdempotencyKey({ method: 'POST', url, body: payload, extra: rateKey });
  const finalHeaders = { ...headers, 'X-Idempotency-Key': idempotencyKey };

  const response = await postWithRetry(url, payload, { headers: finalHeaders, maxRetries: 3 });
  return response.data;
}

function verifyMetaWebhookSignature(appSecret, rawBody, signatureHeader) {
  if (!appSecret || !signatureHeader) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
  } catch {
    return false;
  }
}

function processReceivedMessage(message, traceId) {
  logger.info('[MetaService] Mensagem recebida para processamento', { traceId });
}

export {
  sendWhatsAppTextMessage,
  sendWhatsAppMediaMessage,
  processReceivedMessage,
  verifyMetaWebhookSignature,
}; 