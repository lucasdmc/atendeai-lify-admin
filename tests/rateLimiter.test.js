/**
 * Testes para Rate Limiter - AtendeAI Lify
 * VERSÃO CORRIGIDA - Reset completo entre testes
 */

import { jest } from '@jest/globals';

// Limpar módulo cache para isolamento completo
beforeEach(async () => {
  // Reset do cache de módulos para isolar testes
  jest.resetModules();
});

describe('Rate Limiter - CORRIGIDO', () => {
  let allowRequest, remainingTokens;

  beforeEach(async () => {
    // Import fresh module para cada teste
    const module = await import('../services/utils/rateLimiter.js');
    allowRequest = module.allowRequest;
    remainingTokens = module.remainingTokens;
  });

  describe('allowRequest', () => {
    it('deve permitir requests dentro do limite', () => {
      const key = `test-key-isolated-${Date.now()}`;
      const capacity = 5;

      // Deve permitir até 5 requests
      for (let i = 0; i < capacity; i++) {
        expect(allowRequest(key, capacity, 60000)).toBe(true);
      }

      // O 6º request deve ser negado
      expect(allowRequest(key, capacity, 60000)).toBe(false);
    });

    it('deve usar valores padrão quando não especificados', () => {
      const key = `test-key-default-${Date.now()}`;
      
      // Deve usar valor padrão do environment (100) ou fallback (60)
      const result = allowRequest(key);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Primeiro request sempre permite
    });

    it('deve recarregar tokens após intervalo', async () => {
      const key = `test-key-refill-${Date.now()}`;
      const capacity = 2;
      const refillInterval = 50; // 50ms para teste rápido

      // Esgotar tokens
      expect(allowRequest(key, capacity, refillInterval)).toBe(true);
      expect(allowRequest(key, capacity, refillInterval)).toBe(true);
      expect(allowRequest(key, capacity, refillInterval)).toBe(false);

      // Aguardar recarregamento
      await new Promise(resolve => setTimeout(resolve, 70));

      // Deve permitir novamente
      expect(allowRequest(key, capacity, refillInterval)).toBe(true);
    });

    it('deve manter buckets separados por key', () => {
      const key1 = `test-key-separate-a-${Date.now()}`;
      const key2 = `test-key-separate-b-${Date.now()}`;
      const capacity = 2;

      // Esgotar tokens da key1
      expect(allowRequest(key1, capacity, 60000)).toBe(true);
      expect(allowRequest(key1, capacity, 60000)).toBe(true);
      expect(allowRequest(key1, capacity, 60000)).toBe(false);

      // key2 deve ainda ter tokens
      expect(allowRequest(key2, capacity, 60000)).toBe(true);
      expect(allowRequest(key2, capacity, 60000)).toBe(true);
      expect(allowRequest(key2, capacity, 60000)).toBe(false);
    });
  });

  describe('remainingTokens', () => {
    it('deve retornar número correto de tokens restantes', () => {
      const key = `test-key-remaining-${Date.now()}`;
      const capacity = 5;

      expect(remainingTokens(key, capacity, 60000)).toBe(5);

      allowRequest(key, capacity, 60000);
      expect(remainingTokens(key, capacity, 60000)).toBe(4);

      allowRequest(key, capacity, 60000);
      expect(remainingTokens(key, capacity, 60000)).toBe(3);
    });

    it('deve retornar 0 quando tokens esgotados', () => {
      const key = `test-key-zero-${Date.now()}`;
      const capacity = 2;

      allowRequest(key, capacity, 60000);
      allowRequest(key, capacity, 60000);

      expect(remainingTokens(key, capacity, 60000)).toBe(0);
    });
  });

  describe('Integração com environment variables', () => {
    const originalEnv = process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE;

    afterEach(() => {
      // Restaurar valor original
      if (originalEnv !== undefined) {
        process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE = originalEnv;
      } else {
        delete process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE;
      }
    });

    it('deve usar valor do environment quando definido', () => {
      process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE = '3';
      
      const key = `test-key-env-${Date.now()}`;
      
      // Deve permitir 3 requests
      expect(allowRequest(key)).toBe(true);
      expect(allowRequest(key)).toBe(true);
      expect(allowRequest(key)).toBe(true);
      
      // O 4º deve ser negado
      expect(allowRequest(key)).toBe(false);
    });

    it('deve usar fallback quando environment não está definido', () => {
      delete process.env.WHATSAPP_RATE_LIMIT_PER_MINUTE;
      
      const key = `test-key-fallback-${Date.now()}`;
      
      // Deve usar fallback de 60
      const result = allowRequest(key);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Primeiro sempre permite
    });
  });

  describe('Edge cases', () => {
    it('deve lidar com capacidade zero', () => {
      const key = `test-key-zero-capacity-${Date.now()}`;
      const capacity = 0;

      expect(allowRequest(key, capacity, 60000)).toBe(false);
      expect(remainingTokens(key, capacity, 60000)).toBe(0);
    });

    it('deve lidar com capacidade negativa', () => {
      const key = `test-key-negative-${Date.now()}`;
      const capacity = -1;

      expect(allowRequest(key, capacity, 60000)).toBe(false);
      expect(remainingTokens(key, capacity, 60000)).toBe(0);
    });

    it('deve lidar com intervalo de recarga muito pequeno', () => {
      const key = `test-key-small-interval-${Date.now()}`;
      const capacity = 2;
      const refillInterval = 1; // 1ms

      expect(allowRequest(key, capacity, refillInterval)).toBe(true);
      expect(allowRequest(key, capacity, refillInterval)).toBe(true);
      expect(allowRequest(key, capacity, refillInterval)).toBe(false);
    });
  });
});
