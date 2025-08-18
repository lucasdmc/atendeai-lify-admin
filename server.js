import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { performance } from 'perf_hooks';
import { generateTraceId } from './services/utils/trace.js';

dotenv.config();

// ✅ INICIALIZAR CLINIC CONTEXT MANAGER
console.log('🚀 [Server] Inicializando AtendeAI Lify Admin...');

const whatsappRoutes = await import('./routes/whatsapp.js');
const webhookRoutes = await import('./routes/webhook-final.js');
const googleRoutes = await import('./routes/google.js');
// Removido: rota de simulação de testes

// ✅ INICIALIZAR SERVIÇOS CORE
console.log('🔧 [Server] Inicializando serviços core...');
try {
  const { ClinicContextManager } = await import('./services/core/index.js');
  await ClinicContextManager.initialize();
  console.log('✅ [Server] ClinicContextManager inicializado com sucesso');
} catch (error) {
  console.error('❌ [Server] Erro ao inicializar ClinicContextManager:', error);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Middleware de correlação e observabilidade
app.use((req, res, next) => {
  const traceId = req.headers['x-request-id'] || generateTraceId();
  res.setHeader('X-Request-Id', String(traceId));
  req.traceId = traceId;
  req.startTime = Date.now();
  
  // Log de início da requisição
  console.log(`🔄 [${traceId}] ${req.method} ${req.path} - Start`);
  
  next();
});

// Middleware de rate limiting inteligente
import { intelligentRateLimit, rateLimitMetrics } from './middleware/enhancedRateLimit.js';
app.use(intelligentRateLimit);
app.use(rateLimitMetrics);

// Rotas do WhatsApp / Google
app.use('/api/whatsapp', whatsappRoutes.default);
app.use('/webhook', webhookRoutes.default);
app.use('/api/google', googleRoutes.default);

// Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'atendeai-lify-backend rodando com webhook robusto', 
    endpoints: [
      '/webhook/whatsapp-meta', 
      '/api/whatsapp/send-message',
      '/api/google/oauth/start',
      '/api/google/oauth/callback',
      '/api/google/session/status',
      '/api/google/calendars/list',
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
    const start = performance.now();
    const { message, clinicId, userId, sessionId, options = {} } = req.body;

    if (!message || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, clinicId, userId',
      });
    }

    console.log('🤖 [AI Process] Processando mensagem:', { message, clinicId, userId, traceId: (req as any).traceId });

    const { LLMOrchestratorService } = await import('./services/core/index.js');
    
    const request = {
      phoneNumber: userId,
      message: message,
      conversationId: `whatsapp-${userId}-${Date.now()}`,
      userId: userId
    };

    const response = await LLMOrchestratorService.processMessage(request);

    const elapsedMs = performance.now() - start;
    res.json({
      success: true,
      data: {
        response: response.response,
        metadata: {
          confidence: response.intent?.confidence || 0.8,
          modelUsed: 'llm-orchestrator',
          tokensUsed: 0,
          cost: 0,
          responseTimeMs: Math.round(elapsedMs),
          memoryUsed: true,
          userProfile: { name: 'Usuário' },
          conversationContext: { lastIntent: response.intent?.name || 'GREETING' },
          intent: response.intent,
          toolsUsed: response.toolsUsed,
          traceId: (req as any).traceId
        }
      },
    });
  } catch (error) {
    console.error('❌ [AI Process] Erro:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

// Métricas simples em memória para o Dashboard (P01)
const metrics = {
  byClinic: new Map() // clinicId -> { started, completed, escalated, errors, lastUpdated }
};

// Hook leve no fluxo (via endpoint) para receber eventos
app.post('/api/metrics/track', (req, res) => {
  const { clinicId, event } = req.body || {};
  if (!clinicId || !event) return res.status(400).json({ success: false, error: 'clinicId e event são obrigatórios' });
  const now = new Date().toISOString();
  if (!metrics.byClinic.has(clinicId)) {
    metrics.byClinic.set(clinicId, { started: 0, completed: 0, escalated: 0, errors: 0, lastUpdated: now });
  }
  const agg = metrics.byClinic.get(clinicId);
  if (event === 'started') agg.started++;
  else if (event === 'completed') agg.completed++;
  else if (event === 'escalated') agg.escalated++;
  else if (event === 'error') agg.errors++;
  agg.lastUpdated = now;
  return res.json({ success: true });
});

// Agregado para o Dashboard
app.get('/api/metrics/appointments', (req, res) => {
  const result = Array.from(metrics.byClinic.entries()).map(([clinicId, v]) => ({ clinicId, ...v }));
  res.json({ success: true, data: result });
});

app.listen(PORT, () => {
  console.log(`🚀 atendeai-lify-backend rodando na porta ${PORT}`);
}); 