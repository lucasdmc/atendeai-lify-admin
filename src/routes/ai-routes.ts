// ========================================
// ROTAS DA API AI
// ========================================

import { Router } from 'express';
import { AIOrchestrator } from '../services/ai';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

// ========================================
// ROTAS PRINCIPAIS
// ========================================

// Processar requisição AI completa
router.post('/process', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const {
      message,
      clinicId,
      userId,
      sessionId,
      options = {},
    } = req.body;

    if (!message || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, clinicId, userId',
      });
    }

    const result = await AIOrchestrator.processRequest({
      message,
      clinicId,
      userId,
      sessionId,
      options,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('AI Process Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE TESTE
// ========================================

// Testar conectividade das APIs
router.get('/test-connection', authenticateToken, async (req, res) => {
  try {
    const result = await AIOrchestrator.testConnectivity();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Test Connection Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE ESTATÍSTICAS
// ========================================

// Obter todas as estatísticas
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { clinicId } = req.query;
    const result = await AIOrchestrator.getAllStats(clinicId as string);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE VALIDAÇÃO MÉDICA (SPRINT 1)
// ========================================

// Validar conteúdo médico
router.post('/validate-medical', authenticateToken, async (req, res) => {
  try {
    const { content, clinicId, userId } = req.body;

    if (!content || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, clinicId, userId',
      });
    }

    const { MedicalValidationService } = await import('../services/ai');
    const result = await MedicalValidationService.validateMedicalContent(
      content,
      clinicId,
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Medical Validation Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE ENSEMBLE DE MODELOS (SPRINT 2)
// ========================================

// Processar com ensemble
router.post('/ensemble', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { query, clinicId, userId, context } = req.body;

    if (!query || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: query, clinicId, userId',
      });
    }

    const { ModelEnsembleService } = await import('../services/ai');
    const result = await ModelEnsembleService.processWithEnsemble(
      query,
      clinicId,
      userId,
      context
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Ensemble Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE CACHE E STREAMING (SPRINT 3)
// ========================================

// Processar com cache e streaming
router.post('/cache-streaming', authenticateToken, rateLimiter, async (req, res) => {
  try {
    const { query, clinicId, userId, sessionId } = req.body;

    if (!query || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: query, clinicId, userId',
      });
    }

    const { CacheStreamingService } = await import('../services/ai');
    const result = await CacheStreamingService.processWithCacheAndStreaming(
      query,
      clinicId,
      userId,
      sessionId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Cache Streaming Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE RECURSOS AVANÇADOS (SPRINT 4)
// ========================================

// Análise de emoções
router.post('/emotion-analysis', authenticateToken, async (req, res) => {
  try {
    const { text, clinicId, userId } = req.body;

    if (!text || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text, clinicId, userId',
      });
    }

    const { AdvancedFeaturesService } = await import('../services/ai');
    const result = await AdvancedFeaturesService.analyzeEmotion(
      text,
      clinicId,
      userId
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Emotion Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Sugestões proativas
router.post('/proactive-suggestions', authenticateToken, async (req, res) => {
  try {
    const { userId, clinicId, trigger, context } = req.body;

    if (!userId || !clinicId || !trigger) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, clinicId, trigger',
      });
    }

    const { AdvancedFeaturesService } = await import('../services/ai');
    const result = await AdvancedFeaturesService.generateProactiveSuggestions(
      userId,
      clinicId,
      trigger,
      context
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Proactive Suggestions Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Análise multimodal
router.post('/multimodal-analysis', authenticateToken, async (req, res) => {
  try {
    const { type, content, clinicId, userId, purpose } = req.body;

    if (!type || !content || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, content, clinicId, userId',
      });
    }

    const { AdvancedFeaturesService } = await import('../services/ai');
    const result = await AdvancedFeaturesService.analyzeMultimodal(
      type,
      content,
      clinicId,
      userId,
      purpose
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Multimodal Analysis Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Processamento de voz
router.post('/voice-input', authenticateToken, async (req, res) => {
  try {
    const { audioData, userId, clinicId, sessionId, audioFormat, sampleRate, language } = req.body;

    if (!audioData || !userId || !clinicId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: audioData, userId, clinicId',
      });
    }

    const { AdvancedFeaturesService } = await import('../services/ai');
    const result = await AdvancedFeaturesService.processVoiceInput(
      audioData,
      userId,
      clinicId,
      sessionId,
      audioFormat,
      sampleRate,
      language
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Voice Input Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Geração de resposta de voz
router.post('/voice-response', authenticateToken, async (req, res) => {
  try {
    const { text, modelUsed, audioFormat } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: text',
      });
    }

    const { AdvancedFeaturesService } = await import('../services/ai');
    const result = await AdvancedFeaturesService.generateVoiceResponse(
      text,
      modelUsed,
      audioFormat
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Voice Response Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// ========================================
// ROTAS DE MANUTENÇÃO
// ========================================

// Limpar dados antigos
router.post('/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await AIOrchestrator.cleanupOldData();
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Cleanup Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router; 