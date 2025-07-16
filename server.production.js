import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração CORS para produção
app.use(cors({
  origin: [
    'https://atendeai.lify.com.br',
    'https://www.atendeai.lify.com.br',
    'https://preview--atendeai-lify-admin.lovable.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

// Armazenar clientes WhatsApp
const whatsappClients = new Map();
const sessionStates = new Map();

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: 'production',
    activeSessions: whatsappClients.size,
    sessions: Array.from(sessionStates.entries()).map(([agentId, state]) => ({
      agentId,
      status: state.status,
      connected: state.connected || false,
      connectedAt: state.connectedAt
    }))
  });
});

// Rota para gerar QR Code
app.post('/api/whatsapp/generate-qr', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'agentId é obrigatório' });
    }

    // Verificar se já existe uma sessão
    if (whatsappClients.has(agentId)) {
      const state = sessionStates.get(agentId);
      if (state && state.qrCode) {
        return res.json({ 
          success: true, 
          qrCode: state.qrCode,
          status: state.status 
        });
      }
    }

    const client = new Client({
      authStrategy: new LocalAuth({ clientId: agentId }),
      puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        headless: true
      }
    });

    client.on('qr', async (qr) => {
      console.log('QR Code gerado para:', agentId);
      const qrCode = await qrcode.toDataURL(qr);
      sessionStates.set(agentId, { 
        status: 'qr', 
        qrCode,
        connected: false 
      });
    });

    client.on('ready', () => {
      console.log('WhatsApp conectado para:', agentId);
      sessionStates.set(agentId, { 
        status: 'connected', 
        connected: true,
        connectedAt: new Date().toISOString()
      });
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado para:', agentId, 'Razão:', reason);
      sessionStates.set(agentId, { 
        status: 'disconnected', 
        connected: false 
      });
    });

    client.on('auth_failure', (msg) => {
      console.error('Falha na autenticação para:', agentId, msg);
      sessionStates.set(agentId, { 
        status: 'auth_failure', 
        connected: false 
      });
    });

    await client.initialize();
    whatsappClients.set(agentId, client);

    res.json({ success: true, message: 'Cliente WhatsApp inicializado' });
  } catch (error) {
    console.error('Erro ao gerar QR:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar status
app.get('/api/whatsapp/status/:agentId', (req, res) => {
  const { agentId } = req.params;
  const state = sessionStates.get(agentId) || { status: 'disconnected' };
  res.json(state);
});

// Rota para desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { agentId } = req.body;
    const client = whatsappClients.get(agentId);
    
    if (client) {
      await client.destroy();
      whatsappClients.delete(agentId);
      sessionStates.delete(agentId);
      console.log('Cliente desconectado:', agentId);
    }
    
    res.json({ success: true, message: 'Desconectado com sucesso' });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para limpar todas as sessões
app.post('/api/whatsapp/clear-sessions', async (req, res) => {
  try {
    const clients = Array.from(whatsappClients.values());
    for (const client of clients) {
      try {
        await client.destroy();
      } catch (error) {
        console.error('Erro ao destruir cliente:', error);
      }
    }
    
    whatsappClients.clear();
    sessionStates.clear();
    
    res.json({ success: true, message: 'Todas as sessões foram limpas' });
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
  console.log(`🔧 Ambiente: Produção`);
});
