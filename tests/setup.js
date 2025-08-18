/**
 * Jest Test Setup - AtendeAI Lify
 * VERSÃO CORRIGIDA - Setup robusto e isolado
 */

import { jest } from '@jest/globals';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.WEBHOOK_VERIFY_TOKEN = 'test-webhook-token';
process.env.WHATSAPP_META_ACCESS_TOKEN = 'test-meta-token';
process.env.WHATSAPP_META_PHONE_NUMBER_ID = 'test-phone-id';
process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE = '100';

// Global test utilities - VERSÃO ROBUSTA
global.mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockReturnThis(),
  upsert: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  range: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    signIn: jest.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    })
  }
};

global.mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  startOperation: jest.fn(),
  endOperation: jest.fn(),
  failOperation: jest.fn(),
  lgpdLog: jest.fn()
};

// Mock global console para reduzir ruído nos testes
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Helper para resetar todos os mocks
global.resetAllMocks = () => {
  jest.clearAllMocks();
  
  // Reset Supabase client para estado limpo
  Object.keys(global.mockSupabaseClient).forEach(key => {
    if (typeof global.mockSupabaseClient[key] === 'function') {
      global.mockSupabaseClient[key].mockClear();
      if (key !== 'auth') {
        global.mockSupabaseClient[key].mockReturnThis();
      }
    }
  });
  
  // Reset auth methods
  global.mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: 'test-user-id' } }
  });
  global.mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
  global.mockSupabaseClient.auth.signIn.mockResolvedValue({ 
    data: { user: { id: 'test-user-id' } }, 
    error: null 
  });
  
  // Reset logger
  Object.values(global.mockLogger).forEach(mock => {
    if (typeof mock.mockClear === 'function') {
      mock.mockClear();
    }
  });
  
  // Reset console mocks
  global.console.log.mockClear();
  global.console.warn.mockClear();
  global.console.error.mockClear();
  global.console.info.mockClear();
};

// Helper para configurar Supabase responses comuns
global.setupSupabaseDefaults = () => {
  global.mockSupabaseClient.maybeSingle.mockResolvedValue({
    data: null,
    error: null
  });
  
  global.mockSupabaseClient.single.mockResolvedValue({
    data: { id: 'test-default-id' },
    error: null
  });
  
  global.mockSupabaseClient.insert.mockResolvedValue({
    data: { id: 'test-inserted-id' },
    error: null
  });
  
  global.mockSupabaseClient.upsert.mockResolvedValue({
    data: { id: 'test-upserted-id' },
    error: null
  });
  
  global.mockSupabaseClient.select.mockResolvedValue({
    data: [],
    error: null
  });
};

// Setup inicial para todos os testes
beforeEach(() => {
  global.resetAllMocks();
  global.setupSupabaseDefaults();
});

// Cleanup após cada teste
afterEach(() => {
  jest.clearAllTimers();
});

// Configurar timers para testes que precisam de setTimeout
jest.useFakeTimers({ doNotFake: ['setTimeout'] });
