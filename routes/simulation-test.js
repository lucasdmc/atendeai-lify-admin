// ========================================
// ENDPOINT PARA TESTE DE SIMULAÇÃO
// ========================================

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://niakqdolcdwxtrkbqmdi.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Endpoint para testar mensagem em modo simulação
 * POST /api/simulation/test
 */
router.post('/test', async (req, res) => {
  try {
    const { clinicId, messageText, fromNumber, toNumber } = req.body;

    console.log('🎭 [Simulation-Test] Testando mensagem:', {
      clinicId,
      messageText,
      fromNumber,
      toNumber
    });

    // Verificar se a clínica existe e está em modo simulação
    const { data: clinicData, error: clinicError } = await supabase
      .from('clinics')
      .select('id, name, simulation_mode')
      .eq('id', clinicId)
      .single();

    if (clinicError || !clinicData) {
      return res.status(404).json({
        success: false,
        error: 'Clínica não encontrada'
      });
    }

    if (!clinicData.simulation_mode) {
      return res.status(400).json({
        success: false,
        error: 'Clínica não está em modo simulação'
      });
    }

    // Importar e usar o serviço de simulação
    const { SimulationMessageService } = await import('../services/simulationMessageService.js');
    
    const result = await SimulationMessageService.processSimulationMessage(
      fromNumber || '5511999999999',
      toNumber || clinicData.whatsapp_phone,
      messageText,
      clinicId
    );

    if (result.success) {
      console.log('✅ [Simulation-Test] Mensagem processada com sucesso:', result);
      
      return res.status(200).json({
        success: true,
        message: 'Mensagem processada em modo simulação',
        data: {
          conversationId: result.conversationId,
          response: result.response,
          intent: result.intent,
          confidence: result.confidence,
          simulationMode: true
        }
      });
    } else {
      console.error('❌ [Simulation-Test] Erro ao processar mensagem:', result.error);
      
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('💥 [Simulation-Test] Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para listar clínicas em modo simulação
 * GET /api/simulation/clinics
 */
router.get('/clinics', async (req, res) => {
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select('id, name, whatsapp_phone, simulation_mode')
      .eq('simulation_mode', true);

    if (error) {
      console.error('[Simulation-Test] Erro ao buscar clínicas:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar clínicas'
      });
    }

    return res.status(200).json({
      success: true,
      data: clinics || []
    });

  } catch (error) {
    console.error('💥 [Simulation-Test] Erro geral:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Endpoint para buscar mensagens de simulação de uma clínica
 * GET /api/simulation/messages/:clinicId
 */
router.get('/messages/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params;

    // Importar e usar o serviço de simulação
    const { SimulationMessageService } = await import('../services/simulationMessageService.js');
    
    const messages = await SimulationMessageService.getSimulationMessages(clinicId);

    return res.status(200).json({
      success: true,
      data: messages
    });

  } catch (error) {
    console.error('💥 [Simulation-Test] Erro ao buscar mensagens:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 