import express from 'express';
import cors from 'cors';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Armazenar clientes WhatsApp com timeout e limpeza automática
const whatsappClients = new Map();
const sessionStates = new Map();
const sessionTimeouts = new Map();

// Configurações de timeout
const QR_TIMEOUT = 5 * 60 * 1000; // 5 minutos para QR Code
const CONNECTION_TIMEOUT = 10 * 60 * 1000; // 10 minutos para conexão
const CLEANUP_INTERVAL = 2 * 60 * 1000; // Limpeza a cada 2 minutos

// Função para limpar sessão
const cleanupSession = async (agentId) => {
  console.log(`🧹 Limpando sessão para: ${agentId}`);
  
  try {
    const client = whatsappClients.get(agentId);
    if (client) {
      await client.destroy();
      whatsappClients.delete(agentId);
    }
    
    sessionStates.delete(agentId);
    
    const timeoutId = sessionTimeouts.get(agentId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      sessionTimeouts.delete(agentId);
    }
    
    console.log(`✅ Sessão limpa para: ${agentId}`);
  } catch (error) {
    console.error(`❌ Erro ao limpar sessão para ${agentId}:`, error);
  }
};

// Função para configurar timeout de sessão
const setupSessionTimeout = (agentId, timeoutMs, reason) => {
  // Limpar timeout anterior se existir
  const existingTimeout = sessionTimeouts.get(agentId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  const timeoutId = setTimeout(async () => {
    console.log(`⏰ Timeout de sessão para ${agentId}: ${reason}`);
    await cleanupSession(agentId);
  }, timeoutMs);
  
  sessionTimeouts.set(agentId, timeoutId);
};

// Limpeza automática periódica
setInterval(() => {
  const now = Date.now();
  
  for (const [agentId, state] of sessionStates.entries()) {
    const lastUpdate = state.lastUpdate || 0;
    const timeSinceUpdate = now - lastUpdate;
    
    // Limpar sessões que não foram atualizadas há muito tempo
    if (timeSinceUpdate > 15 * 60 * 1000) { // 15 minutos
      console.log(`🕐 Limpeza automática para sessão antiga: ${agentId}`);
      cleanupSession(agentId);
    }
  }
}, CLEANUP_INTERVAL);

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    activeSessions: whatsappClients.size,
    sessions: Array.from(sessionStates.entries()).map(([agentId, state]) => ({
      agentId,
      status: state.status,
      connected: state.connected || false,
      connectedAt: state.connectedAt,
      lastUpdate: state.lastUpdate
    }))
  });
});

// Rota para gerar QR Code
app.post('/api/whatsapp/generate-qr', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    console.log('🔍 Tentando gerar QR Code para agentId:', agentId);
    
    if (!agentId) {
      return res.status(400).json({ error: 'agentId é obrigatório' });
    }

    // Limpar sessão anterior se existir
    await cleanupSession(agentId);

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
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--disable-javascript',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-field-trial-config',
          '--disable-ipc-flooding-protection'
        ],
        headless: 'new',
        executablePath: process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : undefined
      }
    });

    // Configurar eventos do cliente
    client.on('qr', async (qr) => {
      console.log('QR Code gerado para:', agentId);
      const qrCode = await qrcode.toDataURL(qr);
      
      sessionStates.set(agentId, { 
        status: 'qr', 
        qrCode,
        connected: false,
        lastUpdate: Date.now()
      });
      
      // Configurar timeout para QR Code
      setupSessionTimeout(agentId, QR_TIMEOUT, 'QR Code não foi escaneado');
    });

    client.on('ready', () => {
      console.log('WhatsApp conectado para:', agentId);
      sessionStates.set(agentId, { 
        status: 'connected', 
        connected: true,
        connectedAt: new Date().toISOString(),
        lastUpdate: Date.now()
      });
      
      // Limpar timeout quando conectado
      const timeoutId = sessionTimeouts.get(agentId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        sessionTimeouts.delete(agentId);
      }
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp desconectado para:', agentId, 'Razão:', reason);
      sessionStates.set(agentId, { 
        status: 'disconnected', 
        connected: false,
        lastUpdate: Date.now()
      });
      
      // Limpar sessão após desconexão
      setTimeout(() => cleanupSession(agentId), 5000);
    });

    client.on('auth_failure', (msg) => {
      console.error('Falha na autenticação para:', agentId, msg);
      sessionStates.set(agentId, { 
        status: 'auth_failure', 
        connected: false,
        lastUpdate: Date.now()
      });
      
      // Limpar sessão após falha de autenticação
      setTimeout(() => cleanupSession(agentId), 5000);
    });

    console.log('🚀 Inicializando cliente WhatsApp para:', agentId);
    await client.initialize();
    whatsappClients.set(agentId, client);
    console.log('✅ Cliente WhatsApp inicializado com sucesso para:', agentId);

    res.json({ success: true, message: 'Cliente WhatsApp inicializado' });
  } catch (error) {
    console.error('❌ Erro ao gerar QR para', agentId, ':', error);
    console.error('Stack trace:', error.stack);
    
    // Limpar cliente se houver erro
    await cleanupSession(agentId);
    
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
    await cleanupSession(agentId);
    console.log('Cliente desconectado:', agentId);
    
    res.json({ success: true, message: 'Desconectado com sucesso' });
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para limpar todas as sessões
app.post('/api/whatsapp/clear-sessions', async (req, res) => {
  try {
    const agentIds = Array.from(whatsappClients.keys());
    
    for (const agentId of agentIds) {
      await cleanupSession(agentId);
    }
    
    res.json({ success: true, message: 'Todas as sessões foram limpas' });
  } catch (error) {
    console.error('Erro ao limpar sessões:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para resetar sessão específica
app.post('/api/whatsapp/reset-session', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'agentId é obrigatório' });
    }
    
    await cleanupSession(agentId);
    console.log('Sessão resetada:', agentId);
    
    res.json({ success: true, message: 'Sessão resetada com sucesso' });
  } catch (error) {
    console.error('Erro ao resetar sessão:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});
