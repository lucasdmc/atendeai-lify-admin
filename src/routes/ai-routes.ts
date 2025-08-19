// ========================================
// ROTAS DA API AI
// ========================================

import { Router } from 'express';
// import { AIOrchestrator } from '../services/ai'; // Temporarily disabled
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rate-limiter';

const router = Router();

// ========================================
// ROTAS PRINCIPAIS
// ========================================

router.post('/process', authenticateToken, rateLimiter, async (req, res) => {
  try {
    return res.status(501).json({
      success: false,
      error: 'AI processing temporarily disabled',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;