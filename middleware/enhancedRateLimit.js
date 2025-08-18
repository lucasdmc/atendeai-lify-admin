/**
 * Enhanced Rate Limiting Middleware - AtendeAI Lify
 * Integra rate limiting com observabilidade, retries e logging estruturado
 */

import { allowRequest, remainingTokens } from '../services/utils/rateLimiter.js';
import logger from '../services/utils/logger.js';
import { generateTraceId } from '../services/utils/trace.js';

/**
 * Configurações de rate limiting por tipo de endpoint
 */
const RATE_LIMIT_CONFIGS = {
  webhook: {
    capacity: Number(process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE || 60),
    windowMs: 60000, // 1 minuto
    keyGenerator: (req) => `webhook:${req.ip}:${req.body?.entry?.[0]?.id || 'unknown'}`,
    message: 'WhatsApp webhook rate limit exceeded',
    component: 'webhook'
  },
  
  api: {
    capacity: Number(process.env.API_RATE_LIMIT_PER_MINUTE || 100),
    windowMs: 60000, // 1 minuto
    keyGenerator: (req) => `api:${req.ip}:${req.user?.id || 'anonymous'}`,
    message: 'API rate limit exceeded',
    component: 'api'
  },
  
  ai: {
    capacity: Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 20),
    windowMs: 60000, // 1 minuto
    keyGenerator: (req) => `ai:${req.body?.clinicId || 'unknown'}:${req.body?.userId || 'anonymous'}`,
    message: 'AI processing rate limit exceeded',
    component: 'ai'
  },
  
  google: {
    capacity: Number(process.env.GOOGLE_RATE_LIMIT_PER_MINUTE || 30),
    windowMs: 60000, // 1 minuto
    keyGenerator: (req) => `google:${req.body?.clinicId || req.query?.clinicId || 'unknown'}`,
    message: 'Google API rate limit exceeded',
    component: 'google'
  }
};

/**
 * Cria middleware de rate limiting para um tipo específico
 * @param {string} type - Tipo de rate limiting (webhook, api, ai, google)
 * @param {object} customConfig - Configurações customizadas
 * @returns {Function} Middleware Express
 */
export function createRateLimit(type = 'api', customConfig = {}) {
  const config = { ...RATE_LIMIT_CONFIGS[type], ...customConfig };
  
  return (req, res, next) => {
    const traceId = req.traceId || generateTraceId();
    const startTime = Date.now();
    
    try {
      // Gerar chave para rate limiting
      const key = config.keyGenerator(req);
      
      // Extrair contexto para logging
      const context = {
        traceId,
        component: config.component,
        operation: 'rate_limit_check',
        rateLimitType: type,
        key: key.replace(/:[^:]*:/, ':***:'), // Redact IPs/IDs sensíveis
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        clinicId: req.body?.clinicId || req.query?.clinicId,
        userId: req.body?.userId || req.query?.userId || req.user?.id
      };
      
      logger.debug('Checking rate limit', context);
      
      // Verificar se a requisição é permitida
      const allowed = allowRequest(key, config.capacity, config.windowMs);
      const remaining = remainingTokens(key, config.capacity, config.windowMs);
      
      // Headers de rate limiting
      res.set({
        'X-RateLimit-Limit': config.capacity,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': new Date(Date.now() + config.windowMs).toISOString(),
        'X-RateLimit-Type': type
      });
      
      if (!allowed) {
        const duration = Date.now() - startTime;
        
        // Log de rate limit excedido
        logger.warn('Rate limit exceeded', {
          ...context,
          operationStatus: 'RATE_LIMITED',
          durationMs: duration,
          remainingTokens: remaining,
          limitCapacity: config.capacity,
          windowMs: config.windowMs
        });
        
        // Resposta com informações úteis para retry
        return res.status(429).json({
          success: false,
          error: config.message,
          code: 'RATE_LIMIT_EXCEEDED',
          rateLimitInfo: {
            limit: config.capacity,
            remaining: remaining,
            resetTime: new Date(Date.now() + config.windowMs).toISOString(),
            retryAfter: Math.ceil(config.windowMs / 1000),
            type: type
          },
          traceId
        });
      }
      
      // Rate limit OK
      const duration = Date.now() - startTime;
      logger.debug('Rate limit check passed', {
        ...context,
        operationStatus: 'ALLOWED',
        durationMs: duration,
        remainingTokens: remaining
      });
      
      // Adicionar informações ao request para uso posterior
      req.rateLimitInfo = {
        type,
        key,
        remaining,
        limit: config.capacity
      };
      
      next();
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Rate limit check failed', {
        traceId,
        component: config.component,
        operation: 'rate_limit_check',
        operationStatus: 'ERROR',
        durationMs: duration,
        error: error.message,
        errorStack: error.stack
      });
      
      // Em caso de erro no rate limiting, permitir a requisição mas logar
      next();
    }
  };
}

/**
 * Middleware para endpoints de webhook do WhatsApp
 */
export const webhookRateLimit = createRateLimit('webhook');

/**
 * Middleware para endpoints de API geral
 */
export const apiRateLimit = createRateLimit('api');

/**
 * Middleware para endpoints de AI
 */
export const aiRateLimit = createRateLimit('ai');

/**
 * Middleware para endpoints do Google
 */
export const googleRateLimit = createRateLimit('google');

/**
 * Middleware de rate limiting inteligente que escolhe a configuração baseada na rota
 */
export function intelligentRateLimit(req, res, next) {
  const path = req.path.toLowerCase();
  
  // Determinar tipo de rate limiting baseado na rota
  let type = 'api'; // padrão
  
  if (path.includes('/webhook')) {
    type = 'webhook';
  } else if (path.includes('/ai/')) {
    type = 'ai';
  } else if (path.includes('/google/')) {
    type = 'google';
  }
  
  // Aplicar rate limiting específico
  const rateLimitMiddleware = createRateLimit(type);
  rateLimitMiddleware(req, res, next);
}

/**
 * Middleware para logging de métricas de rate limiting
 */
export function rateLimitMetrics(req, res, next) {
  const originalSend = res.send;
  const traceId = req.traceId || generateTraceId();
  
  res.send = function(data) {
    try {
      // Log métricas apenas se houve rate limiting info
      if (req.rateLimitInfo) {
        const context = {
          traceId,
          component: 'rate_limit_metrics',
          operation: 'request_processed',
          rateLimitType: req.rateLimitInfo.type,
          rateLimitRemaining: req.rateLimitInfo.remaining,
          rateLimitLimit: req.rateLimitInfo.limit,
          responseStatus: res.statusCode,
          method: req.method,
          path: req.path,
          clinicId: req.body?.clinicId || req.query?.clinicId,
          userId: req.body?.userId || req.query?.userId || req.user?.id
        };
        
        if (res.statusCode >= 400) {
          logger.warn('Request completed with error after rate limit check', context);
        } else {
          logger.debug('Request completed successfully after rate limit check', context);
        }
      }
    } catch (error) {
      logger.error('Failed to log rate limit metrics', {
        traceId,
        error: error.message
      });
    }
    
    originalSend.call(this, data);
  };
  
  next();
}

/**
 * Função utilitária para verificar status de rate limiting
 * @param {string} key - Chave do rate limiting
 * @param {string} type - Tipo de rate limiting
 * @returns {object} Status atual do rate limiting
 */
export function getRateLimitStatus(key, type = 'api') {
  const config = RATE_LIMIT_CONFIGS[type];
  if (!config) {
    throw new Error(`Invalid rate limit type: ${type}`);
  }
  
  const remaining = remainingTokens(key, config.capacity, config.windowMs);
  
  return {
    type,
    limit: config.capacity,
    remaining,
    resetTime: new Date(Date.now() + config.windowMs).toISOString(),
    isLimited: remaining <= 0
  };
}

export default {
  createRateLimit,
  webhookRateLimit,
  apiRateLimit,
  aiRateLimit,
  googleRateLimit,
  intelligentRateLimit,
  rateLimitMetrics,
  getRateLimitStatus
};
