// ========================================
// MIDDLEWARE DE RATE LIMITING
// ========================================

import { Request, Response, NextFunction } from 'express';
import { RATE_LIMITS } from '../config/ai-config';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export const rateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.body.userId || req.query.userId || 'anonymous';
  const clinicId = req.body.clinicId || req.query.clinicId || 'default';
  const key = `${userId}:${clinicId}`;
  
  // Usar limite básico por padrão
  const limit = RATE_LIMITS.BASIC;
  const now = Date.now();

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + limit.window,
    };
  }

  // Reset se a janela expirou
  if (now > rateLimitStore[key].resetTime) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + limit.window,
    };
  }

  // Verificar se excedeu o limite
  if (rateLimitStore[key].count >= limit.requests) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000),
    });
  }

  // Incrementar contador
  rateLimitStore[key].count++;

  // Adicionar headers de rate limit
  res.set({
    'X-RateLimit-Limit': limit.requests,
    'X-RateLimit-Remaining': limit.requests - rateLimitStore[key].count,
    'X-RateLimit-Reset': rateLimitStore[key].resetTime,
  });

  next();
};

// Rate limiter específico para AI
export const aiRateLimiter = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.body.userId || req.query.userId || 'anonymous';
  const clinicId = req.body.clinicId || req.query.clinicId || 'default';
  const key = `ai:${userId}:${clinicId}`;
  
  // Usar limite mais restritivo para AI
  const limit = RATE_LIMITS.FREE;
  const now = Date.now();

  if (!rateLimitStore[key]) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + limit.window,
    };
  }

  // Reset se a janela expirou
  if (now > rateLimitStore[key].resetTime) {
    rateLimitStore[key] = {
      count: 0,
      resetTime: now + limit.window,
    };
  }

  // Verificar se excedeu o limite
  if (rateLimitStore[key].count >= limit.requests) {
    return res.status(429).json({
      success: false,
      error: 'AI rate limit exceeded',
      retryAfter: Math.ceil((rateLimitStore[key].resetTime - now) / 1000),
    });
  }

  // Incrementar contador
  rateLimitStore[key].count++;

  // Adicionar headers de rate limit
  res.set({
    'X-RateLimit-Limit': limit.requests,
    'X-RateLimit-Remaining': limit.requests - rateLimitStore[key].count,
    'X-RateLimit-Reset': rateLimitStore[key].resetTime,
  });

  next();
}; 