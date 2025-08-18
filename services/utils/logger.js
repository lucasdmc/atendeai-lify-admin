/**
 * Enhanced Logger - AtendeAI Lify
 * Sistema de logging estruturado com support para correlation IDs, LGPD compliance e contexto enriquecido
 */

import { generateTraceId } from './trace.js';

// Chaves sensíveis que devem ser redacted (LGPD compliance)
const SENSITIVE_KEYS = [
  'authorization', 'access_token', 'accessToken', 'phoneNumberId', 
  'apiKey', 'apikey', 'password', 'refresh_token', 'refreshToken',
  'secret', 'token', 'bearer', 'phone', 'phoneNumber', 'cpf', 
  'email', 'whatsapp_number', 'user_phone', 'patient_phone',
  'credit_card', 'creditCard', 'personal_data', 'personalData'
];

// Padrões de dados sensíveis para LGPD
const SENSITIVE_PATTERNS = [
  /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/, // CPF
  /\b\d{11}\b/, // CPF sem formatação
  /\b\+?55\d{10,11}\b/, // Telefone brasileiro
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/ // Email
];

function redact(value) {
  if (typeof value === 'string') {
    // Verificar padrões sensíveis
    let redacted = value;
    SENSITIVE_PATTERNS.forEach(pattern => {
      redacted = redacted.replace(pattern, '***REDACTED***');
    });
    
    // Se ainda não foi redacted e é longo, fazer redação parcial
    if (redacted === value && value.length > 8) {
      return value.slice(0, 4) + '****' + value.slice(-2);
    }
    return redacted;
  }
  return '***redacted***';
}

function safe(obj, depth = 0) {
  // Prevenir recursão infinita
  if (depth > 10) return '[MAX_DEPTH_REACHED]';
  
  if (!obj || typeof obj !== 'object') return obj;
  
  // Tratar arrays
  if (Array.isArray(obj)) {
    return obj.map(item => safe(item, depth + 1));
  }
  
  const clone = { ...obj };
  for (const key of Object.keys(clone)) {
    const lowerKey = key.toLowerCase();
    
    // Verificar se a chave é sensível
    if (SENSITIVE_KEYS.some(sensitiveKey => lowerKey.includes(sensitiveKey.toLowerCase()))) {
      clone[key] = redact(clone[key]);
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = safe(clone[key], depth + 1);
    } else if (typeof clone[key] === 'string') {
      // Verificar padrões sensíveis no valor
      clone[key] = redact(clone[key]);
    }
  }
  return clone;
}

function extractContextFromMeta(meta = {}) {
  const context = {};
  
  // Extrair IDs importantes
  if (meta.clinicId) context.clinicId = meta.clinicId;
  if (meta.conversationId) context.conversationId = meta.conversationId;
  if (meta.userId) context.userId = meta.userId;
  if (meta.traceId) context.traceId = meta.traceId;
  if (meta.requestId) context.requestId = meta.requestId;
  
  // Extrair contexto de operação
  if (meta.operation) context.operation = meta.operation;
  if (meta.component) context.component = meta.component;
  if (meta.service) context.service = meta.service;
  
  return context;
}

function log(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const context = extractContextFromMeta(meta);
  
  // Garantir que sempre temos um traceId
  if (!context.traceId && !meta.traceId) {
    context.traceId = generateTraceId();
  }
  
  const payload = {
    level: level.toUpperCase(),
    timestamp,
    message,
    ...context,
    ...(Object.keys(meta).length > 0 ? { meta: safe(meta) } : {}),
    
    // Metadados do sistema
    pid: process.pid,
    hostname: process.env.HOSTNAME || 'unknown',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  // LGPD compliance: marcar logs com dados pessoais
  if (hasPersonalData(payload)) {
    payload.lgpd_warning = 'Contains personal data - handle according to LGPD';
  }
  
  const line = JSON.stringify(payload);
  
  // Output baseado no nível
  switch (level) {
    case 'error':
      console.error(line);
      break;
    case 'warn':
      console.warn(line);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        console.debug(line);
      }
      break;
    default:
      console.log(line);
  }
  
  // Em produção, também enviar para sistema de monitoramento
  if (process.env.NODE_ENV === 'production' && level === 'error') {
    // TODO: Integrar com Sentry, DataDog, etc.
    // sendToMonitoring(payload);
  }
}

function hasPersonalData(payload) {
  const jsonStr = JSON.stringify(payload).toLowerCase();
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(jsonStr)) ||
         SENSITIVE_KEYS.some(key => jsonStr.includes(key));
}

// Sistema de logging estruturado
const logger = {
  /**
   * Log de informação
   * @param {string} message - Mensagem principal
   * @param {object} meta - Metadados estruturados
   */
  info: (message, meta = {}) => log('info', message, meta),
  
  /**
   * Log de warning
   * @param {string} message - Mensagem principal
   * @param {object} meta - Metadados estruturados
   */
  warn: (message, meta = {}) => log('warn', message, meta),
  
  /**
   * Log de erro
   * @param {string} message - Mensagem principal
   * @param {object} meta - Metadados estruturados
   */
  error: (message, meta = {}) => log('error', message, meta),
  
  /**
   * Log de debug (apenas em desenvolvimento)
   * @param {string} message - Mensagem principal
   * @param {object} meta - Metadados estruturados
   */
  debug: (message, meta = {}) => log('debug', message, meta),
  
  /**
   * Log com contexto enriquecido
   * @param {string} level - Nível do log
   * @param {string} message - Mensagem principal
   * @param {object} context - Contexto estruturado
   */
  withContext: (level, message, context = {}) => {
    log(level, message, {
      ...context,
      timestamp: new Date().toISOString()
    });
  },
  
  /**
   * Log de início de operação
   * @param {string} operation - Nome da operação
   * @param {object} context - Contexto da operação
   */
  startOperation: (operation, context = {}) => {
    log('info', `Starting operation: ${operation}`, {
      ...context,
      operation,
      operationStatus: 'START'
    });
  },
  
  /**
   * Log de fim de operação
   * @param {string} operation - Nome da operação
   * @param {object} context - Contexto da operação
   * @param {number} durationMs - Duração em millisegundos
   */
  endOperation: (operation, context = {}, durationMs = null) => {
    log('info', `Completed operation: ${operation}`, {
      ...context,
      operation,
      operationStatus: 'COMPLETE',
      ...(durationMs !== null ? { durationMs } : {})
    });
  },
  
  /**
   * Log de falha de operação
   * @param {string} operation - Nome da operação
   * @param {Error} error - Erro ocorrido
   * @param {object} context - Contexto da operação
   */
  failOperation: (operation, error, context = {}) => {
    log('error', `Failed operation: ${operation}`, {
      ...context,
      operation,
      operationStatus: 'FAILED',
      error: error.message,
      errorStack: error.stack,
      errorCode: error.code
    });
  },
  
  /**
   * Log específico para LGPD compliance
   * @param {string} action - Ação realizada com dados pessoais
   * @param {object} context - Contexto da operação
   */
  lgpdLog: (action, context = {}) => {
    log('info', `LGPD Action: ${action}`, {
      ...context,
      lgpd_action: action,
      lgpd_timestamp: new Date().toISOString(),
      compliance: 'LGPD'
    });
  },
  
  /**
   * Log de performance
   * @param {string} operation - Operação medida
   * @param {number} durationMs - Duração em millisegundos
   * @param {object} context - Contexto adicional
   */
  performance: (operation, durationMs, context = {}) => {
    const level = durationMs > 5000 ? 'warn' : 'info'; // Warn se > 5s
    log(level, `Performance: ${operation}`, {
      ...context,
      operation,
      durationMs,
      performance: true
    });
  }
};

export default logger;
