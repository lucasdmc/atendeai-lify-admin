
// ========================================
// CONFIGURAÇÃO DE LOGS POR AMBIENTE
// ========================================

import winston from 'winston';
import { isProduction, isDevelopment } from '../config/environment.js';

const logLevel = isProduction() ? 'info' : 'debug';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Só mostrar logs no console em desenvolvimento
if (isDevelopment()) {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Função para logs que NUNCA devem ir para produção
logger.debug = function(message, meta = {}) {
  if (isDevelopment()) {
    this.log('debug', message, meta);
  }
};

// Função para logs de teste que NUNCA devem ir para produção
logger.test = function(message, meta = {}) {
  if (isDevelopment()) {
    this.log('info', `🧪 TEST: ${message}`, meta);
  }
};

// Função para logs de produção
logger.production = function(message, meta = {}) {
  if (isProduction()) {
    this.log('info', message, meta);
  }
};

// Funções específicas para diferentes componentes
logger.ai = function(message, meta = {}) {
  this.log('info', `🤖 [AI] ${message}`, meta);
};

logger.clinic = function(message, meta = {}) {
  this.log('info', `🏥 [Clinic] ${message}`, meta);
};

logger.whatsapp = function(message, meta = {}) {
  this.log('info', `📱 [WhatsApp] ${message}`, meta);
};

logger.memory = function(message, meta = {}) {
  this.log('info', `🧠 [Memory] ${message}`, meta);
};

logger.webhook = function(message, meta = {}) {
  this.log('info', `🔗 [Webhook] ${message}`, meta);
};

export default logger;
