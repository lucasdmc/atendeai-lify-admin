/**
 * Testes para Logger - AtendeAI Lify
 */

import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('../services/utils/trace.js', () => ({
  generateTraceId: jest.fn(() => 'test-trace-id')
}));

describe('Logger', () => {
  let logger;
  let consoleSpy;

  beforeAll(async () => {
    const module = await import('../services/utils/logger.js');
    logger = module.default;
  });

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(),
      error: jest.spyOn(console, 'error').mockImplementation(),
      warn: jest.spyOn(console, 'warn').mockImplementation(),
      info: jest.spyOn(console, 'info').mockImplementation()
    };
  });

  afterEach(() => {
    Object.values(consoleSpy).forEach(spy => spy.mockRestore());
  });

  describe('Redação de dados sensíveis', () => {
    it('deve redact informações de telefone', () => {
      const sensitiveData = {
        phone: '+5547999999999',
        message: 'Teste'
      };

      logger.info('Teste', sensitiveData);

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).not.toContain('+5547999999999');
      expect(logCall).toContain('***REDACTED***');
    });

    it('deve redact CPF', () => {
      const sensitiveData = {
        user: {
          cpf: '123.456.789-00',
          name: 'João'
        }
      };

      logger.info('Teste CPF', sensitiveData);

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).not.toContain('123.456.789-00');
      expect(logCall).toContain('***REDACTED***');
    });

    it('deve redact email', () => {
      const sensitiveData = {
        email: 'usuario@exemplo.com'
      };

      logger.info('Teste email', sensitiveData);

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).not.toContain('usuario@exemplo.com');
      expect(logCall).toContain('***REDACTED***');
    });

    it('deve redact tokens de acesso', () => {
      const sensitiveData = {
        access_token: 'sk-1234567890abcdef',
        api_key: 'very-secret-key'
      };

      logger.info('Teste tokens', sensitiveData);

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).not.toContain('sk-1234567890abcdef');
      expect(logCall).not.toContain('very-secret-key');
    });
  });

  describe('Níveis de log', () => {
    it('deve logar informações com nível info', () => {
      logger.info('Mensagem de info', { data: 'test' });

      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('[INFO]');
      expect(logCall).toContain('Mensagem de info');
    });

    it('deve logar erros com nível error', () => {
      logger.error('Mensagem de erro', { error: 'test error' });

      expect(consoleSpy.error).toHaveBeenCalled();
      const logCall = consoleSpy.error.mock.calls[0][0];
      expect(logCall).toContain('[ERROR]');
      expect(logCall).toContain('Mensagem de erro');
    });

    it('deve logar warnings com nível warn', () => {
      logger.warn('Mensagem de warning', { warning: 'test warning' });

      expect(consoleSpy.warn).toHaveBeenCalled();
      const logCall = consoleSpy.warn.mock.calls[0][0];
      expect(logCall).toContain('[WARN]');
      expect(logCall).toContain('Mensagem de warning');
    });
  });

  describe('Operações estruturadas', () => {
    it('deve logar início de operação', () => {
      const context = {
        traceId: 'test-trace',
        operation: 'test-op',
        component: 'test-component'
      };

      logger.startOperation('testOperation', context);

      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('⏰ [START]');
      expect(logCall).toContain('testOperation');
      expect(logCall).toContain('test-trace');
    });

    it('deve logar fim de operação com duração', () => {
      const context = {
        traceId: 'test-trace',
        operation: 'test-op'
      };

      logger.endOperation('testOperation', context, 150);

      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('✅ [END]');
      expect(logCall).toContain('testOperation');
      expect(logCall).toContain('150ms');
    });

    it('deve logar falha de operação', () => {
      const context = {
        traceId: 'test-trace',
        operation: 'test-op'
      };
      const error = new Error('Test error');

      logger.failOperation('testOperation', error, context);

      expect(consoleSpy.error).toHaveBeenCalled();
      const logCall = consoleSpy.error.mock.calls[0][0];
      expect(logCall).toContain('❌ [FAIL]');
      expect(logCall).toContain('testOperation');
      expect(logCall).toContain('Test error');
    });
  });

  describe('Log LGPD', () => {
    it('deve criar log específico para LGPD', () => {
      const context = {
        traceId: 'test-trace',
        userId: 'user-123'
      };

      logger.lgpdLog('data_access', context);

      expect(consoleSpy.log).toHaveBeenCalled();
      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).toContain('🔒 [LGPD]');
      expect(logCall).toContain('data_access');
      expect(logCall).toContain('test-trace');
    });

    it('deve redact dados sensíveis em logs LGPD', () => {
      const context = {
        traceId: 'test-trace',
        phone: '+5547999999999',
        operation: 'message_stored'
      };

      logger.lgpdLog('message_processing', context);

      const logCall = consoleSpy.log.mock.calls[0][0];
      expect(logCall).not.toContain('+5547999999999');
      expect(logCall).toContain('***REDACTED***');
    });
  });
});
