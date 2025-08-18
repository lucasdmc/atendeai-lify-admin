/**
 * Testes para WhatsApp Webhook - AtendeAI Lify
 * VERSÃO CORRIGIDA - Mocks isolados e rate limiting controlado
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock dependencies ANTES da importação
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => global.mockSupabaseClient)
}));

jest.unstable_mockModule('../services/utils/logger.js', () => ({
  default: global.mockLogger
}));

// Mock rate limiter com controle total
const mockAllowRequest = jest.fn();
const mockRemainingTokens = jest.fn();
jest.unstable_mockModule('../services/utils/rateLimiter.js', () => ({
  allowRequest: mockAllowRequest,
  remainingTokens: mockRemainingTokens
}));

jest.unstable_mockModule('../services/utils/retryHandler.js', () => ({
  withRetry: jest.fn((fn) => fn()),
  retryHandlers: {}
}));

jest.unstable_mockModule('../services/utils/trace.js', () => ({
  generateTraceId: jest.fn(() => 'test-trace-id')
}));

// Mock do WhatsApp service
jest.unstable_mockModule('../services/whatsappMetaService.js', () => ({
  sendWhatsAppTextMessage: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-meta-message-id'
  })
}));

// Mock do LLM Orchestrator
jest.unstable_mockModule('../services/core/index.js', () => ({
  LLMOrchestratorService: {
    processMessage: jest.fn().mockResolvedValue({
      response: 'Resposta mock do sistema',
      intent: { name: 'greeting', confidence: 0.9 },
      toolsUsed: ['llm_orchestrator']
    })
  }
}));

describe('WhatsApp Webhook - CORRIGIDO', () => {
  let app;
  let webhookRouter;

  beforeAll(async () => {
    // Import after mocking
    const webhookModule = await import('../routes/webhook-final.js');
    webhookRouter = webhookModule.default;
    
    app = express();
    app.use(express.json());
    app.use('/webhook', webhookRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset rate limiting to ALLOW by default
    mockAllowRequest.mockReturnValue(true);
    mockRemainingTokens.mockReturnValue(50);
    
    // Setup default Supabase mocks
    setupDefaultSupabaseMocks();
  });

  function setupDefaultSupabaseMocks() {
    global.mockSupabaseClient.from.mockReturnThis();
    global.mockSupabaseClient.select.mockReturnThis();
    global.mockSupabaseClient.eq.mockReturnThis();
    global.mockSupabaseClient.single.mockReturnThis();
    global.mockSupabaseClient.maybeSingle.mockReturnThis();
    global.mockSupabaseClient.insert.mockReturnThis();
    global.mockSupabaseClient.upsert.mockReturnThis();
    global.mockSupabaseClient.limit.mockReturnThis();
    global.mockSupabaseClient.ilike.mockReturnThis();
    
    // Mock padrão para não encontrar mensagem duplicada
    global.mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: null,
      error: null
    });
    
    // Mock padrão para inserção de mensagem
    global.mockSupabaseClient.single.mockResolvedValue({
      data: { id: 'test-message-id' },
      error: null
    });
  }

  describe('GET /webhook/whatsapp-meta - Verificação', () => {
    it('deve retornar challenge quando token é válido', async () => {
      const challenge = 'test-challenge-123';
      const token = 'test-webhook-token';

      const response = await request(app)
        .get('/webhook/whatsapp-meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': token,
          'hub.challenge': challenge
        });

      expect(response.status).toBe(200);
      expect(response.text).toBe(challenge);
      expect(global.mockLogger.info).toHaveBeenCalledWith(
        'Webhook verification successful',
        expect.objectContaining({
          action: 'VERIFICATION_SUCCESS'
        })
      );
    });

    it('deve retornar 403 quando token é inválido', async () => {
      const challenge = 'test-challenge-123';
      const invalidToken = 'invalid-token';

      const response = await request(app)
        .get('/webhook/whatsapp-meta')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': invalidToken,
          'hub.challenge': challenge
        });

      expect(response.status).toBe(403);
      expect(response.text).toBe('Forbidden');
      expect(global.mockLogger.warn).toHaveBeenCalledWith(
        'Webhook verification failed - invalid token',
        expect.objectContaining({
          action: 'VERIFICATION_FAILED',
          reason: 'INVALID_TOKEN'
        })
      );
    });

    it('deve retornar OK quando não há challenge', async () => {
      const response = await request(app)
        .get('/webhook/whatsapp-meta');

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });
  });

  describe('POST /webhook/whatsapp-meta - Mensagens', () => {
    const validWebhookPayload = {
      entry: [{
        id: 'test-entry-id',
        changes: [{
          field: 'messages',
          value: {
            metadata: {
              display_phone_number: '+5547999999999'
            },
            messages: [{
              id: 'wamid.test123',
              from: '+5547988888888',
              timestamp: '1640995200',
              type: 'text',
              text: {
                body: 'Olá, gostaria de agendar uma consulta'
              }
            }]
          }
        }]
      }]
    };

    it('deve processar mensagem válida com sucesso', async () => {
      // Mock clínica encontrada
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number' && value === '5547999999999') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { clinic_id: 'test-clinic-id' },
              error: null
            })
          };
        }
        if (field === 'id' && value === 'test-clinic-id') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { 
                whatsapp_phone: '+5547999999999',
                simulation_mode: false
              },
              error: null
            })
          };
        }
        return global.mockSupabaseClient;
      });

      // Mock conversa criada
      global.mockSupabaseClient.upsert.mockResolvedValue({
        data: { id: 'conversation-test-id' },
        error: null
      });

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(validWebhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(global.mockLogger.startOperation).toHaveBeenCalledWith(
        'webhook_message_processing',
        expect.objectContaining({
          operation: 'webhook_message_processing'
        })
      );
    });

    it('deve aplicar rate limiting quando configurado', async () => {
      // EXPLICITAMENTE bloquear rate limiting para este teste
      mockAllowRequest.mockReturnValue(false);
      mockRemainingTokens.mockReturnValue(0);

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(validWebhookPayload);

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Too Many Requests');
      expect(mockAllowRequest).toHaveBeenCalled();
    });

    it('deve ignorar mensagens duplicadas', async () => {
      // Mock para mensagem já existente
      global.mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: { id: 'existing-message-id' },
        error: null
      });

      // Mock clínica
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { clinic_id: 'test-clinic-id' },
              error: null
            })
          };
        }
        return global.mockSupabaseClient;
      });

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(validWebhookPayload);

      expect(response.status).toBe(200);
      expect(global.mockLogger.info).toHaveBeenCalledWith(
        'Message already exists, skipping insert',
        expect.objectContaining({
          action: 'DUPLICATE_SKIPPED'
        })
      );
    });

    it('deve retornar 200 quando não há mensagens para processar', async () => {
      const emptyPayload = {
        entry: [{
          id: 'test-entry-id',
          changes: [{
            field: 'messages',
            value: {}
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(emptyPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sem mensagens para processar');
    });
  });

  describe('Função insertMessageIfNotExists', () => {
    it('deve inserir nova mensagem quando não existe', async () => {
      global.mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      global.mockSupabaseClient.single.mockResolvedValue({
        data: { id: 'new-message-id' },
        error: null
      });

      // Mock clínica
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { clinic_id: 'test-clinic-id' },
              error: null
            })
          };
        }
        return global.mockSupabaseClient;
      });

      const validWebhookPayload = {
        entry: [{
          id: 'test-entry-id',
          changes: [{
            field: 'messages',
            value: {
              metadata: {
                display_phone_number: '+5547999999999'
              },
              messages: [{
                id: 'wamid.new_test_123',
                from: '+5547988888888',
                timestamp: '1640995200',
                type: 'text',
                text: {
                  body: 'Nova mensagem de teste'
                }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(validWebhookPayload);

      expect(response.status).toBe(200);
      expect(global.mockLogger.endOperation).toHaveBeenCalledWith(
        'insertMessageIfNotExists',
        expect.objectContaining({
          action: 'MESSAGE_INSERTED'
        }),
        expect.any(Number)
      );
    });
  });
});
