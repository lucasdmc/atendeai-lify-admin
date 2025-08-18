/**
 * Sistema de Retries e Backoff - AtendeAI Lify
 * Implementa estratégias robustas de retry com backoff exponencial
 */

import logger from './logger.js';
import { generateTraceId, withTraceId } from './trace.js';

export class RetryError extends Error {
  constructor(message, originalError, attempt, maxAttempts) {
    super(message);
    this.name = 'RetryError';
    this.originalError = originalError;
    this.attempt = attempt;
    this.maxAttempts = maxAttempts;
    this.isRetryable = true;
  }
}

export class RetryHandler {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
    this.baseDelayMs = options.baseDelayMs || 1000;
    this.maxDelayMs = options.maxDelayMs || 30000;
    this.exponentialBase = options.exponentialBase || 2;
    this.jitterRange = options.jitterRange || 0.1; // 10% jitter
    this.retryableErrors = options.retryableErrors || [
      'ECONNRESET',
      'ENOTFOUND', 
      'ECONNREFUSED',
      'ETIMEDOUT',
      'TIMEOUT',
      'NETWORK_ERROR',
      'SERVICE_UNAVAILABLE',
      'RATE_LIMITED',
      'TEMPORARY_FAILURE'
    ];
  }

  /**
   * Executa uma operação com retry automático
   * @param {Function} operation - Função assíncrona a ser executada
   * @param {Object} context - Contexto para logging (clinicId, conversationId, etc.)
   * @param {Object} options - Opções específicas para este retry
   * @returns {Promise} Resultado da operação
   */
  async execute(operation, context = {}, options = {}) {
    const traceId = context.traceId || generateTraceId();
    const maxAttempts = options.maxAttempts || this.maxAttempts;
    const operationName = options.operationName || 'Unknown Operation';
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info('Executing operation with retry', withTraceId({
          operationName,
          attempt,
          maxAttempts,
          ...context
        }, traceId));

        const result = await operation();
        
        if (attempt > 1) {
          logger.info('Operation succeeded after retry', withTraceId({
            operationName,
            attempt,
            maxAttempts,
            ...context
          }, traceId));
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        logger.warn('Operation failed', withTraceId({
          operationName,
          attempt,
          maxAttempts,
          error: error.message,
          errorCode: error.code,
          isRetryable: this.isRetryableError(error),
          ...context
        }, traceId));
        
        // Se não é retryable ou é a última tentativa, falha
        if (!this.isRetryableError(error) || attempt === maxAttempts) {
          break;
        }
        
        // Calcular delay para próxima tentativa
        const delay = this.calculateDelay(attempt);
        
        logger.info('Scheduling retry', withTraceId({
          operationName,
          attempt,
          nextAttempt: attempt + 1,
          delayMs: delay,
          ...context
        }, traceId));
        
        await this.sleep(delay);
      }
    }
    
    // Se chegou aqui, todas as tentativas falharam
    logger.error('Operation failed after all retries', withTraceId({
      operationName,
      totalAttempts: maxAttempts,
      finalError: lastError.message,
      ...context
    }, traceId));
    
    throw new RetryError(
      `Operation '${operationName}' failed after ${maxAttempts} attempts: ${lastError.message}`,
      lastError,
      maxAttempts,
      maxAttempts
    );
  }

  /**
   * Verifica se um erro é retryable
   * @param {Error} error - Erro a ser verificado
   * @returns {boolean} Se o erro é retryable
   */
  isRetryableError(error) {
    if (!error) return false;
    
    // Verificar por código de erro
    if (error.code && this.retryableErrors.includes(error.code)) {
      return true;
    }
    
    // Verificar por mensagem de erro (case insensitive)
    const message = error.message?.toLowerCase() || '';
    const retryableMessages = [
      'timeout',
      'connection reset',
      'network error',
      'service unavailable',
      'rate limit',
      'temporary failure',
      'econnreset',
      'enotfound',
      'econnrefused',
      'etimedout'
    ];
    
    return retryableMessages.some(msg => message.includes(msg));
  }

  /**
   * Calcula delay com backoff exponencial e jitter
   * @param {number} attempt - Número da tentativa (1-based)
   * @returns {number} Delay em millisegundos
   */
  calculateDelay(attempt) {
    // Backoff exponencial: baseDelay * (exponentialBase ^ (attempt - 1))
    const exponentialDelay = this.baseDelayMs * Math.pow(this.exponentialBase, attempt - 1);
    
    // Aplicar limite máximo
    const cappedDelay = Math.min(exponentialDelay, this.maxDelayMs);
    
    // Adicionar jitter para evitar thundering herd
    const jitter = cappedDelay * this.jitterRange * Math.random();
    const finalDelay = cappedDelay + jitter;
    
    return Math.round(finalDelay);
  }

  /**
   * Sleep utility
   * @param {number} ms - Millisegundos para aguardar
   * @returns {Promise} Promise que resolve após o delay
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cria uma instância configurada para operações específicas
   * @param {Object} config - Configuração específica
   * @returns {RetryHandler} Nova instância configurada
   */
  static createFor(config) {
    const presets = {
      // Para APIs externas (Google, Meta, etc.)
      externalApi: {
        maxAttempts: 5,
        baseDelayMs: 2000,
        maxDelayMs: 60000,
        exponentialBase: 2
      },
      
      // Para operações de banco de dados
      database: {
        maxAttempts: 3,
        baseDelayMs: 500,
        maxDelayMs: 5000,
        exponentialBase: 2
      },
      
      // Para operações de AI/LLM
      ai: {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 10000,
        exponentialBase: 1.5
      },
      
      // Para operações críticas
      critical: {
        maxAttempts: 7,
        baseDelayMs: 1000,
        maxDelayMs: 120000,
        exponentialBase: 2
      },
      
      // Para operações rápidas
      fast: {
        maxAttempts: 2,
        baseDelayMs: 200,
        maxDelayMs: 1000,
        exponentialBase: 2
      }
    };
    
    const preset = presets[config.preset] || {};
    return new RetryHandler({ ...preset, ...config });
  }
}

// Instâncias pré-configuradas para uso comum
export const retryHandlers = {
  externalApi: RetryHandler.createFor({ preset: 'externalApi' }),
  database: RetryHandler.createFor({ preset: 'database' }),
  ai: RetryHandler.createFor({ preset: 'ai' }),
  critical: RetryHandler.createFor({ preset: 'critical' }),
  fast: RetryHandler.createFor({ preset: 'fast' })
};

// Função utilitária para retry simples
export async function withRetry(operation, context = {}, options = {}) {
  const handler = options.preset 
    ? RetryHandler.createFor({ preset: options.preset })
    : new RetryHandler(options);
    
  return handler.execute(operation, context, options);
}

export default RetryHandler;
