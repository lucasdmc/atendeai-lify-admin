/**
 * Testes de Integração - AtendeAI Lify
 * VERSÃO CORRIGIDA - Mocks robustos e isolamento completo
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';

// Mock completo de todas as dependências ANTES das importações
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => global.mockSupabaseClient)
}));

jest.unstable_mockModule('../services/utils/logger.js', () => ({
  default: global.mockLogger
}));

// Mock rate limiter com controle completo
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
  generateTraceId: jest.fn(() => 'integration-test-trace-id')
}));

// Mock completo do WhatsApp service
const mockSendWhatsAppTextMessage = jest.fn();
jest.unstable_mockModule('../services/whatsappMetaService.js', () => ({
  sendWhatsAppTextMessage: mockSendWhatsAppTextMessage
}));

// Mock completo do LLM Orchestrator
const mockProcessMessage = jest.fn();
jest.unstable_mockModule('../services/core/index.js', () => ({
  LLMOrchestratorService: {
    processMessage: mockProcessMessage
  }
}));

// Mock do SimulationMessageService
const mockProcessSimulationMessage = jest.fn();
jest.unstable_mockModule('../services/simulationMessageService.js', () => ({
  SimulationMessageService: {
    processSimulationMessage: mockProcessSimulationMessage
  }
}));

describe('Testes de Integração - CORRIGIDOS', () => {
  let app;
  let webhookRouter;

  beforeAll(async () => {
    // Setup da aplicação para testes
    const webhookModule = await import('../routes/webhook-final.js');
    webhookRouter = webhookModule.default;
    
    app = express();
    app.use(express.json());
    app.use('/webhook', webhookRouter);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset todos os mocks para valores padrão seguros
    setupDefaultMocks();
  });

  function setupDefaultMocks() {
    // Rate limiting SEMPRE permite por padrão
    mockAllowRequest.mockReturnValue(true);
    mockRemainingTokens.mockReturnValue(50);
    
    // WhatsApp service sempre sucesso
    mockSendWhatsAppTextMessage.mockResolvedValue({
      success: true,
      messageId: 'mock-meta-message-id'
    });
    
    // LLM Orchestrator sempre responde
    mockProcessMessage.mockResolvedValue({
      response: 'Resposta automática do sistema',
      intent: { name: 'greeting', confidence: 0.9 },
      toolsUsed: ['llm_orchestrator']
    });
    
    // Simulation service sempre sucesso
    mockProcessSimulationMessage.mockResolvedValue({
      success: true,
      response: 'Resposta de simulação',
      conversationId: 'sim-conv-123',
      intent: 'greeting',
      confidence: 0.9
    });
    
    // Setup Supabase mocks
    setupSupabaseMocks();
  }

  function setupSupabaseMocks() {
    // Reset chain methods
    global.mockSupabaseClient.from.mockReturnThis();
    global.mockSupabaseClient.select.mockReturnThis();
    global.mockSupabaseClient.eq.mockReturnThis();
    global.mockSupabaseClient.single.mockReturnThis();
    global.mockSupabaseClient.maybeSingle.mockReturnThis();
    global.mockSupabaseClient.insert.mockReturnThis();
    global.mockSupabaseClient.upsert.mockReturnThis();
    global.mockSupabaseClient.limit.mockReturnThis();
    global.mockSupabaseClient.ilike.mockReturnThis();
    
    // Padrões seguros
    global.mockSupabaseClient.maybeSingle.mockResolvedValue({
      data: null,
      error: null
    });
    
    global.mockSupabaseClient.single.mockResolvedValue({
      data: { id: 'test-id' },
      error: null
    });
    
    global.mockSupabaseClient.upsert.mockResolvedValue({
      data: { id: 'conversation-id' },
      error: null
    });
  }

  describe('Fluxo Completo: WhatsApp → Banco → IA → Resposta', () => {
    it('deve processar mensagem completa de agendamento', async () => {
      // Mock específico para este teste
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number' && value === '5547999999999') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { clinic_id: 'clinic-test-123' },
              error: null
            })
          };
        }
        if (field === 'id' && value === 'clinic-test-123') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { 
                whatsapp_phone: '+5547999999999',
                name: 'Clínica Teste Integração',
                simulation_mode: false
              },
              error: null
            })
          };
        }
        return global.mockSupabaseClient;
      });

      const webhookPayload = {
        entry: [{
          id: 'entry-123',
          changes: [{
            field: 'messages',
            value: {
              metadata: {
                display_phone_number: '+5547999999999'
              },
              messages: [{
                id: 'wamid.integration_test_123',
                from: '+5547988888888',
                timestamp: '1640995200',
                type: 'text',
                text: {
                  body: 'Olá, gostaria de agendar uma consulta para amanhã'
                }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(webhookPayload);

      // Verificações básicas
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verificar se o rate limiting permitiu
      expect(mockAllowRequest).toHaveBeenCalled();
      
      // Verificar se o logger foi chamado
      expect(global.mockLogger.startOperation).toHaveBeenCalledWith(
        'webhook_message_processing',
        expect.objectContaining({
          traceId: 'integration-test-trace-id'
        })
      );
    });

    it('deve lidar com erro de clínica não encontrada', async () => {
      // Mock para clínica não encontrada
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'No rows found' }
            })
          };
        }
        return global.mockSupabaseClient;
      });

      const webhookPayload = {
        entry: [{
          id: 'entry-123',
          changes: [{
            field: 'messages',
            value: {
              metadata: {
                display_phone_number: '+5547999999999'
              },
              messages: [{
                id: 'wamid.no_clinic_test',
                from: '+5547988888888',
                timestamp: '1640995200',
                type: 'text',
                text: {
                  body: 'Mensagem para clínica inexistente'
                }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(global.mockLogger.startOperation).toHaveBeenCalled();
    });

    it('deve aplicar rate limiting quando necessário', async () => {
      // EXPLICITAMENTE bloquear para este teste
      mockAllowRequest.mockReturnValue(false);
      mockRemainingTokens.mockReturnValue(0);

      const webhookPayload = {
        entry: [{
          id: 'entry-rate-limit',
          changes: [{
            field: 'messages',
            value: {
              messages: [{
                id: 'wamid.rate_limit_test',
                from: '+5547988888888',
                type: 'text',
                text: { body: 'Teste rate limit' }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(webhookPayload);

      expect(response.status).toBe(429);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Too Many Requests');
      expect(response.body.traceId).toBe('integration-test-trace-id');
    });
  });

  describe('Fluxo de Idempotência', () => {
    it('deve ignorar mensagens duplicadas', async () => {
      // Mock para mensagem já existente
      global.mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: { id: 'existing-message-123' },
        error: null
      });

      // Mock da clínica
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { clinic_id: 'clinic-test-123' },
              error: null
            })
          };
        }
        return global.mockSupabaseClient;
      });

      const webhookPayload = {
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              metadata: { display_phone_number: '+5547999999999' },
              messages: [{
                id: 'wamid.duplicate_test_123',
                from: '+5547988888888',
                type: 'text',
                text: { body: 'Mensagem duplicada' }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      
      // Verificar log de duplicação
      expect(global.mockLogger.info).toHaveBeenCalledWith(
        'Message already exists, skipping insert',
        expect.objectContaining({
          action: 'DUPLICATE_SKIPPED',
          existingMessageId: 'existing-message-123'
        })
      );
    });
  });

  describe('Fluxo de Simulação', () => {
    it('deve processar mensagem em modo simulação', async () => {
      // Mock para clínica em modo simulação
      global.mockSupabaseClient.eq.mockImplementation((field, value) => {
        if (field === 'whatsapp_number') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { clinic_id: 'clinic-simulation-123' },
              error: null
            })
          };
        }
        if (field === 'id' && value === 'clinic-simulation-123') {
          return {
            ...global.mockSupabaseClient,
            single: jest.fn().mockResolvedValue({
              data: { simulation_mode: true },
              error: null
            })
          };
        }
        return global.mockSupabaseClient;
      });

      const webhookPayload = {
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              metadata: { display_phone_number: '+5547999999999' },
              messages: [{
                id: 'wamid.simulation_test',
                from: '+5547988888888',
                type: 'text',
                text: { body: 'Teste simulação' }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verificar se simulation service foi chamado
      expect(mockProcessSimulationMessage).toHaveBeenCalled();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar graciosamente com erro de banco de dados', async () => {
      // Mock de erro de banco
      global.mockSupabaseClient.eq.mockImplementation(() => ({
        ...global.mockSupabaseClient,
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed')
        })
      }));

      const webhookPayload = {
        entry: [{
          changes: [{
            field: 'messages',
            value: {
              metadata: { display_phone_number: '+5547999999999' },
              messages: [{
                id: 'wamid.db_error_test',
                from: '+5547988888888',
                type: 'text',
                text: { body: 'Teste erro BD' }
              }]
            }
          }]
        }]
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(webhookPayload);

      // Deve retornar sucesso mesmo com erro interno
      expect(response.status).toBe(200);
    });

    it('deve validar payload do webhook', async () => {
      const invalidPayload = {
        invalid: 'payload'
      };

      const response = await request(app)
        .post('/webhook/whatsapp-meta')
        .send(invalidPayload);

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('sem mensagens para processar');
    });
  });
});
