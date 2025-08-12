import axios from 'axios';
import config from '../config/index.js';
import logger from './logger.js';

const axiosInstance = axios.create({
  timeout: config.HTTP_DEFAULT_TIMEOUT_MS,
  headers: {
    'User-Agent': 'AtendeAI-Lify-Bot/1.0',
  },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function computeBackoffMs(attempt) {
  const base = 500 * Math.pow(2, attempt); // 500ms, 1000ms, 2000ms
  const jitter = Math.floor(Math.random() * 250); // +[0..250)ms
  return base + jitter;
}

function parseRetryAfterMs(retryAfter) {
  if (!retryAfter) return null;
  const seconds = Number(retryAfter);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = new Date(retryAfter);
  const diff = date.getTime() - Date.now();
  return diff > 0 ? diff : null;
}

export async function postWithRetry(url, data, { headers = {}, maxRetries = 3 } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axiosInstance.post(url, data, { headers });
      return response;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const retriable = status === 429 || (status >= 500 && status < 600) || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      if (!retriable || attempt === maxRetries) break;
      const retryAfterMs = parseRetryAfterMs(retryAfterHeader);
      const delayMs = retryAfterMs != null ? retryAfterMs : computeBackoffMs(attempt);
      logger.warn('HTTP retry scheduled', { url, status, attempt, delayMs });
      await sleep(delayMs);
    }
  }
  throw lastError;
}

export default axiosInstance;
