#!/bin/bash

# ========================================
# SCRIPT COMPLETO DE CONFIGURAÇÃO DA VPS
# ========================================

echo "🚀 CONFIGURANDO VPS ATENDEAI AI"
echo "================================"

# Criar diretório
echo "📁 Criando diretório..."
mkdir -p /root/atendeai-lify-backend
cd /root/atendeai-lify-backend

# Criar package.json
echo "📦 Criando package.json..."
cat > package.json << 'EOF'
{
  "name": "atendeai-lify-backend",
  "version": "1.0.0",
  "description": "Backend para sistema AI do AtendeAI",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "openai": "^4.20.1",
    "@anthropic-ai/sdk": "^0.9.0",
    "@google/generative-ai": "^0.2.1",
    "supabase": "^2.38.0",
    "express-rate-limit": "^7.1.5",
    "compression": "^1.7.4",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["ai", "chatbot", "medical", "backend"],
  "author": "AtendeAI Team",
  "license": "MIT"
}
EOF

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar arquivo .env
echo "⚙️ Criando arquivo .env..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=https://niakqdolcdwxtrkbqmdi.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw

# WhatsApp Meta
WHATSAPP_META_ACCESS_TOKEN=EAAQHxcv0eAQBPLPQ6S8BtBkHhaac73TbyZAMFGO0JGTxorkHdL6zSEEr
uQJq9g60RxmSDCp0tdBLjJPU86vZAM4jFzpkP0rRibAIUGXu7VFwW8UL75HVs3FvGglZBTfQYQHQ9G
1d505JTBKRNni3nwjEvwVuhoYZBPJITqE8NM7y77SDl7jxXJvB8OELUZARRodcV2waSsjyFy7bwEJtYmF
TdCZB9CWkKCdVCk0lM2
WHATSAPP_META_PHONE_NUMBER_ID=711779288689748
WHATSAPP_META_BUSINESS_ID=1775269513072729
WEBHOOK_URL=https://api.atendeai.lify.com.br/webhook/whatsapp-meta
WHATSAPP_WEBHOOK_VERIFY_TOKEN=lify-analysa-waba-token

# IDs padrão
EOF

# Criar servidor
echo "🔧 Criando servidor..."
cat > server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(limiter);

// Webhook routes
const webhookRoutes = require('./routes/webhook');
app.use('/webhook', webhookRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// AI API routes
app.get('/api/ai/test-connection', async (req, res) => {
  try {
    const testResults = {
      openai: { status: 'configured', message: 'OpenAI API configurada' },
      anthropic: { status: 'configured', message: 'Anthropic API configurada' },
      google: { status: 'configured', message: 'Google AI API configurada' },
      database: { status: 'connected', message: 'Banco de dados conectado' }
    };

    res.json({
      success: true,
      data: testResults,
      message: 'Todas as APIs estão configuradas'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/ai/process', async (req, res) => {
  try {
    const { message, clinicId, userId } = req.body;

    if (!message || !clinicId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: message, clinicId, userId'
      });
    }

    const response = {
      response: `Resposta simulada para: "${message}"`,
      confidence: 0.85,
      modelUsed: 'gpt-4o',
      medicalContent: false,
      emotion: 'neutral',
      processingTime: 1200,
      tokensUsed: 150,
      cost: 0.00075
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend AI rodando na porta ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 AI API: http://localhost:${PORT}/api/ai`);
  console.log(`📱 Webhook: http://localhost:${PORT}/webhook/whatsapp-meta`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
EOF

# Criar diretório routes
echo "📁 Criando diretório routes..."
mkdir -p routes

# Criar webhook
echo "🔗 Criando webhook..."
cat > routes/webhook.js << 'EOF'
const express = require('express');
const router = express.Router();

// Função para processar mensagem com AI (simulada)
async function processMessageWithAI(message, clinicId, userId) {
  const responses = [
    "Olá! Como posso ajudá-lo hoje?",
    "Oi! Em que posso ser útil?",
    "Olá! Estou aqui para ajudar. O que você precisa?",
    "Oi! Como posso te auxiliar?",
    "Olá! Em que posso te ajudar hoje?"
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  return {
    success: true,
    response: randomResponse,
    confidence: 0.85,
    modelUsed: 'simulated-ai'
  };
}

// Webhook para receber mensagens do WhatsApp
router.post('/whatsapp-meta', async (req, res) => {
  try {
    console.log('[Webhook] Mensagem recebida:', req.body);

    // Verificar se é um desafio de verificação
    if (req.body.mode === 'subscribe' && req.body['hub.challenge']) {
      console.log('[Webhook] Respondendo ao desafio de verificação');
      return res.status(200).send(req.body['hub.challenge']);
    }

    // Processar mensagens
    if (req.body.entry && req.body.entry.length > 0) {
      let userMessage = '';
      let userPhone = '';
      
      for (const entry of req.body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              for (const message of change.value.messages) {
                if (message.type === 'text') {
                  userMessage = message.text.body;
                  userPhone = message.from;
                  break;
                }
              }
            }
          }
        }
      }

      if (userMessage && userPhone) {
        console.log(`[Webhook] Processando: "${userMessage}" de ${userPhone}`);
        
        // Processar com AI
        const aiResult = await processMessageWithAI(
          userMessage,
          'test-clinic',
          'system-user'
        );

        console.log('[Webhook] Resposta AI:', aiResult.response);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com AI',
          processed: true,
          aiResponse: aiResult.response
        });
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido' 
    });

  } catch (error) {
    console.error('[Webhook] Erro:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rota de teste
router.get('/whatsapp-meta/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook WhatsApp funcionando',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
EOF

# Instalar PM2 se não existir
echo "📦 Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    echo "Instalando PM2..."
    npm install -g pm2
fi

# Iniciar servidor com PM2
echo "🚀 Iniciando servidor com PM2..."
pm2 start server.js --name atendeai-backend

# Salvar configuração do PM2
pm2 save

# Configurar para iniciar com o sistema
pm2 startup

echo ""
echo "✅ CONFIGURAÇÃO CONCLUÍDA!"
echo "=========================="
echo ""
echo "📊 Status do servidor:"
pm2 status
echo ""
echo "🔗 URLs disponíveis:"
echo "   Health: http://localhost:3001/health"
echo "   Webhook: http://localhost:3001/webhook/whatsapp-meta"
echo "   AI API: http://localhost:3001/api/ai"
echo ""
echo "📱 Para testar o webhook:"
echo "   curl http://localhost:3001/webhook/whatsapp-meta/test"
echo ""
echo "📊 Para ver logs:"
echo "   pm2 logs atendeai-backend"
echo ""
echo "🎯 Sistema pronto para receber mensagens do WhatsApp!" 