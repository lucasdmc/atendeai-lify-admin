import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();

// Configuração de CORS
const corsOptions = {
  origin: [
    'https://atendeai.lify.com.br',
    'https://www.atendeai.lify.com.br',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Inicializar cliente Supabase
const supabase = createClient(
  'https://niakqdolcdwxtrkbqmdi.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'
);

// Estrutura para gerenciar sessões
const sessions = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  const activeSessions = Array.from(sessions.keys()).map(key => {
    const [agentId, whatsappNumber] = key.split('_');
    const session = sessions.get(key);
    return {
      agentId,
      whatsappNumber,
      status: session.status,
      connected: session.status === 'connected',
      connectedAt: session.connectedAt
    };
  });

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeSessions: activeSessions.length,
    sessions: activeSessions,
    server: 'Baileys WhatsApp Server (Simple)'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Baileys Server is running',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      generateQR: '/api/whatsapp/generate-qr',
      initialize: '/api/whatsapp/initialize',
      status: '/api/whatsapp/status',
      sendMessage: '/api/whatsapp/send-message',
      disconnect: '/api/whatsapp/disconnect',
      clearAuth: '/api/whatsapp/clear-auth',
      webhook: '/webhook/whatsapp'
    }
  });
});

// Endpoint para gerar QR Code (simulado)
app.post('/api/whatsapp/generate-qr', async (req, res) => {
  try {
    const { agentId, whatsappNumber, connectionId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'agentId é obrigatório' 
      });
    }

    const sessionKey = `${agentId}_${whatsappNumber || 'temp'}`;
    
    // Simular QR Code (base64 de um QR Code de teste)
    const qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Criar sessão
    sessions.set(sessionKey, {
      status: 'connecting',
      agentId,
      whatsappNumber: whatsappNumber || 'temp',
      connectionId: connectionId || `temp-${Date.now()}`,
      createdAt: Date.now()
    });

    // Atualizar no Supabase se connectionId for fornecido
    if (connectionId) {
      try {
        await supabase
          .from('agent_whatsapp_connections')
          .update({ 
            qr_code: qrCode, 
            updated_at: new Date().toISOString(),
            connection_status: 'qr_generated'
          })
          .eq('id', connectionId);
      } catch (error) {
        console.error('Error updating QR code in Supabase:', error);
      }
    }

    res.json({ 
      success: true, 
      message: 'QR Code gerado com sucesso (simulado)',
      agentId,
      whatsappNumber: whatsappNumber || 'temp',
      connectionId: connectionId || `temp-${Date.now()}`,
      qrCode: qrCode
    });
  } catch (error) {
    console.error('Error generating QR Code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para verificar status
app.post('/api/whatsapp/status', (req, res) => {
  try {
    const { agentId, whatsappNumber, connectionId } = req.body;
    
    if (!agentId || !whatsappNumber || !connectionId) {
      return res.status(400).json({ 
        error: 'agentId, whatsappNumber e connectionId são obrigatórios' 
      });
    }

    const sessionKey = `${agentId}_${whatsappNumber}`;
    const session = sessions.get(sessionKey);

    if (!session) {
      return res.json({
        status: 'disconnected',
        agentId,
        whatsappNumber,
        connectionId
      });
    }

    res.json({
      status: session.status,
      agentId,
      whatsappNumber,
      connectionId,
      connectedAt: session.connectedAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para enviar mensagem (simulado)
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { agentId, connectionId, to, message } = req.body;
    
    if (!agentId || !connectionId || !to || !message) {
      return res.status(400).json({ 
        error: 'agentId, connectionId, to e message são obrigatórios' 
      });
    }

    // Simular envio de mensagem
    console.log(`Simulando envio de mensagem: ${message} para ${to} via agente ${agentId}`);
    
    res.json({ 
      success: true, 
      agentId,
      connectionId,
      messageId: `msg_${Date.now()}`,
      message: 'Mensagem enviada com sucesso (simulado)'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para desconectar WhatsApp
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { agentId, whatsappNumber, connectionId } = req.body;
    
    if (!agentId || !whatsappNumber || !connectionId) {
      return res.status(400).json({ 
        error: 'agentId, whatsappNumber e connectionId são obrigatórios' 
      });
    }

    const sessionKey = `${agentId}_${whatsappNumber}`;
    sessions.delete(sessionKey);
    
    // Atualizar no Supabase
    try {
      await supabase
        .from('agent_whatsapp_connections')
        .update({ 
          connection_status: 'disconnected',
          updated_at: new Date().toISOString()
        })
        .eq('id', connectionId);
    } catch (error) {
      console.error('Error updating connection status in Supabase:', error);
    }
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
      agentId,
      whatsappNumber,
      connectionId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint webhook para receber mensagens do WhatsApp
app.post('/webhook/whatsapp', (req, res) => {
  console.log('Webhook received:', req.body);
  
  const webhookData = req.body;
  
  fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/whatsapp-integration/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw'}`
    },
    body: JSON.stringify(webhookData)
  }).then(response => {
    if (!response.ok) {
      console.error('Supabase webhook error:', response.status, response.statusText);
    } else {
      console.log('Webhook forwarded to Supabase successfully');
    }
  }).catch(error => {
    console.error('Error forwarding webhook to Supabase:', error);
  });
  
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Baileys server (simple) running on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 