import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();

const whatsappRoutes = await import('./routes/whatsapp.js');
const webhookRoutes = await import('./routes/webhook.js');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas do WhatsApp
app.use('/api/whatsapp', whatsappRoutes.default);
app.use('/webhook', webhookRoutes.default);

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'atendeai-lify-backend rodando com webhook robusto', 
    endpoints: [
      '/webhook/whatsapp-meta', 
      '/api/whatsapp/send-message',
      '/health',
      '/api/ai/process'
    ] 
  });
});

// Rota de teste para verificar conectividade
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT
  });
});

// Rota de AI com AIOrchestrator real
app.post('/api/ai/process', async (req, res) => {
  try {
    const { message, clinicId, userId, sessionId, options = {} } = req.body;

    if (!message || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, clinicId, userId',
      });
    }

    console.log('🤖 [AI Process] Processando mensagem:', { message, clinicId, userId });

    // Usar LLMOrchestratorService diretamente (compatível com Node.js)
    const { LLMOrchestratorService } = await import('./src/services/ai/llmOrchestratorService.js');
    
    const request = {
      phoneNumber: userId, // Usar userId como phoneNumber
      message: message,
      conversationId: `whatsapp-${userId}-${Date.now()}`,
      userId: userId
    };

    console.log('[AI Process] Chamando LLMOrchestratorService...');
    const response = await LLMOrchestratorService.processMessage(request);

    console.log('✅ [AI Process] Resposta gerada:', {
      response: response.response,
      intent: response.intent?.name,
      confidence: response.intent?.confidence
    });

    res.json({
      success: true,
      data: {
        response: response.response,
        metadata: {
          confidence: response.intent?.confidence || 0.8,
          modelUsed: 'llm-orchestrator',
          tokensUsed: 0,
          cost: 0,
          responseTime: Date.now(),
          memoryUsed: true,
          userProfile: { name: 'Usuário' },
          conversationContext: { lastIntent: response.intent?.name || 'GREETING' },
          intent: response.intent,
          toolsUsed: response.toolsUsed
        }
      },
    });
  } catch (error) {
    console.error('❌ [AI Process] Erro:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 atendeai-lify-backend rodando na porta ${PORT}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   - Webhook: http://localhost:${PORT}/webhook/whatsapp-meta`);
  console.log(`   - AI Process: http://localhost:${PORT}/api/ai/process`);
  console.log(`   - Health: http://localhost:${PORT}/health`);
}); 