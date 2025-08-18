/**
 * Testes para ClinicContextManager - AtendeAI Lify
 */

import { jest } from '@jest/globals';

// Mock dependencies
jest.unstable_mockModule('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => global.mockSupabaseClient)
}));

jest.unstable_mockModule('../services/config/index.js', () => ({
  default: {
    getSupabaseClient: jest.fn(() => global.mockSupabaseClient)
  }
}));

describe('ClinicContextManager', () => {
  let ClinicContextManager;

  beforeAll(async () => {
    const module = await import('../services/core/clinicContextManager.js');
    ClinicContextManager = module.default;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.mockSupabaseClient.from.mockReturnThis();
    global.mockSupabaseClient.select.mockReturnThis();
    global.mockSupabaseClient.eq.mockReturnThis();
    global.mockSupabaseClient.ilike.mockReturnThis();
  });

  describe('getClinicContext', () => {
    it('deve retornar contexto quando clínica é encontrada', async () => {
      const mockClinic = {
        id: 'clinic-1',
        name: 'Clínica Teste',
        contextualization: {
          servicos: ['Consulta', 'Exame'],
          horarios: '08:00-18:00'
        },
        has_contextualization: true
      };

      global.mockSupabaseClient.single.mockResolvedValue({
        data: mockClinic,
        error: null
      });

      const result = await ClinicContextManager.getClinicContext('Clínica Teste');

      expect(result).toEqual(expect.objectContaining({
        id: 'clinic-1',
        name: 'Clínica Teste',
        contextualization: expect.objectContaining({
          servicos: ['Consulta', 'Exame']
        })
      }));
    });

    it('deve tentar busca case insensitive quando não encontra por nome exato', async () => {
      // Primeira busca falha
      global.mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }
        })
        // Segunda busca com ilike é bem-sucedida
        .mockResolvedValueOnce({
          data: {
            id: 'clinic-1',
            name: 'clínica teste',
            contextualization: { servicos: [] },
            has_contextualization: true
          },
          error: null
        });

      const result = await ClinicContextManager.getClinicContext('CLÍNICA TESTE');

      expect(global.mockSupabaseClient.ilike).toHaveBeenCalledWith('name', '%CLÍNICA TESTE%');
      expect(result.name).toBe('clínica teste');
    });

    it('deve lançar erro quando clínica não é encontrada', async () => {
      global.mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }
      });

      await expect(ClinicContextManager.getClinicContext('Inexistente'))
        .rejects.toThrow('Clínica não encontrada');
    });

    it('deve retornar contexto padrão quando clínica não tem contextualização', async () => {
      const mockClinic = {
        id: 'clinic-1',
        name: 'Clínica Sem Contexto',
        contextualization: null,
        has_contextualization: false
      };

      global.mockSupabaseClient.single.mockResolvedValue({
        data: mockClinic,
        error: null
      });

      const result = await ClinicContextManager.getClinicContext('Clínica Sem Contexto');

      expect(result.contextualization).toEqual({
        servicos: [],
        horarios_funcionamento: {},
        politicas: {}
      });
    });
  });

  describe('loadAllJsonContexts', () => {
    it('deve carregar contextos de todas as clínicas ativas', async () => {
      const mockClinics = [
        {
          id: 'clinic-1',
          name: 'Clínica A',
          contextualization: { servicos: ['Consulta'] },
          has_contextualization: true
        },
        {
          id: 'clinic-2',
          name: 'Clínica B',
          contextualization: { servicos: ['Exame'] },
          has_contextualization: true
        }
      ];

      global.mockSupabaseClient.select.mockResolvedValue({
        data: mockClinics,
        error: null
      });

      await ClinicContextManager.loadAllJsonContexts();

      expect(global.mockSupabaseClient.from).toHaveBeenCalledWith('clinics');
      expect(global.mockSupabaseClient.eq).toHaveBeenCalledWith('has_contextualization', true);
    });

    it('deve lidar com erro ao carregar contextos', async () => {
      global.mockSupabaseClient.select.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      // Não deve lançar erro, apenas logar
      await expect(ClinicContextManager.loadAllJsonContexts()).resolves.not.toThrow();
    });
  });

  describe('validateContext', () => {
    it('deve validar contexto JSON válido', () => {
      const validContext = {
        servicos: ['Consulta'],
        horarios_funcionamento: {
          segunda: '08:00-18:00'
        }
      };

      const result = ClinicContextManager.validateContext(validContext);
      expect(result.isValid).toBe(true);
    });

    it('deve invalidar contexto sem servicos', () => {
      const invalidContext = {
        horarios_funcionamento: {
          segunda: '08:00-18:00'
        }
      };

      const result = ClinicContextManager.validateContext(invalidContext);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('servicos é obrigatório');
    });
  });
});
