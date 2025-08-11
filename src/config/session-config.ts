export const SESSION_CONFIG = {
  // Intervalos de verificação (em milissegundos)
  VALIDATION_CACHE_DURATION: 5 * 60 * 1000, // 5 minutos
  PERIODIC_CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos
  BACKGROUND_REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutos
  
  // Buffers de tempo para renovação proativa (em milissegundos)
  PROACTIVE_REFRESH_BUFFER: 10 * 60 * 1000, // 10 minutos
  BACKGROUND_REFRESH_THRESHOLD: 15 * 60 * 1000, // 15 minutos
  
  // Configurações de cache
  MIN_CHECK_INTERVAL: 60 * 1000, // 1 minuto mínimo entre verificações
  
  // Configurações de notificação
  SHOW_EXPIRY_WARNING: true,
  EXPIRY_WARNING_THRESHOLD: 5 * 60 * 1000, // 5 minutos
  
  // Configurações de retry
  MAX_REFRESH_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Configurações de segurança
  AUTO_DISCONNECT_ON_INVALID_REFRESH: true,
  CLEAR_TOKENS_ON_REFRESH_FAILURE: true,
  
  // Configurações de debug
  ENABLE_DEBUG_LOGGING: process.env.NODE_ENV === 'development',
  LOG_TOKEN_REFRESH_ATTEMPTS: true,
  LOG_SESSION_VALIDATION: true,
  
  // Configurações de performance
  ENABLE_VALIDATION_CACHE: true,
  ENABLE_BACKGROUND_SERVICE: true,
  ENABLE_PROACTIVE_REFRESH: true,
} as const;

export const SESSION_MESSAGES = {
  SUCCESS: {
    TOKEN_REFRESHED: 'Token renovado com sucesso',
    SESSION_VALID: 'Sessão válida',
    CONNECTION_ESTABLISHED: 'Conexão estabelecida com sucesso',
  },
  WARNING: {
    TOKEN_EXPIRING_SOON: 'Token expirará em breve',
    SESSION_NEEDS_REFRESH: 'Sessão precisa ser renovada',
    RECONNECTION_REQUIRED: 'Reconexão necessária',
  },
  ERROR: {
    TOKEN_EXPIRED: 'Token expirado',
    REFRESH_FAILED: 'Falha ao renovar token',
    INVALID_SESSION: 'Sessão inválida',
    AUTHENTICATION_REQUIRED: 'Autenticação necessária',
  },
  INFO: {
    CHECKING_SESSION: 'Verificando status da sessão...',
    REFRESHING_TOKEN: 'Renovando token...',
    MONITORING_ACTIVE: 'Monitoramento ativo',
    BACKGROUND_SERVICE_RUNNING: 'Serviço de background ativo',
  },
} as const;

export const SESSION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  EXPIRED: 'expired',
  REFRESHING: 'refreshing',
  ERROR: 'error',
  NEEDS_REAUTH: 'needs_reauth',
} as const;

export type SessionStatus = typeof SESSION_STATUS[keyof typeof SESSION_STATUS];
