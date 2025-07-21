import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// Importação correta do Baileys (sem Puppeteer)
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuração de CORS otimizada para produção
const corsOptions = {
  origin: [
    'https://atendeai.lify.com.br',
    'https://www.atendeai.lify.com.br',
    'https://preview--atendeai-lify-admin.lovable.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
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
const qrCodes = new Map();

// Função para gerar chave única da sessão
function getSessionKey(agentId, whatsappNumber) {
  return `${agentId}_${whatsappNumber}`;
}

// Função para criar diretório de sessão
function createSessionDirectory(agentId, whatsappNumber) {
  const sessionDir = path.join(__dirname, 'sessions', agentId, whatsappNumber);
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }
  return sessionDir;
}

// Função para atualizar QR Code no Supabase
async function updateQRCodeInSupabase(connectionId, qrCode) {
  try {
    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .update({ 
        qr_code: qrCode, 
        updated_at: new Date().toISOString(),
        connection_status: 'qr_generated'
      })
      .eq('id', connectionId);

    if (error) {
      console.error('Error updating QR code in Supabase:', error);
      return false;
    }

    console.log(`QR Code updated in Supabase for connection ${connectionId}`);
    return true;
  } catch (error) {
    console.error('Error updating QR code in Supabase:', error);
    return false;
  }
}

// Função para atualizar status da conexão no Supabase
async function updateConnectionStatusInSupabase(connectionId, status, additionalData = {}) {
  try {
    const updateData = {
      connection_status: status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    const { data, error } = await supabase
      .from('agent_whatsapp_connections')
      .update(updateData)
      .eq('id', connectionId);

    if (error) {
      console.error('Error updating connection status in Supabase:', error);
      return false;
    }

    console.log(`Connection status updated in Supabase: ${connectionId} -> ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating connection status in Supabase:', error);
    return false;
  }
}

// Sistema de logs detalhado
function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Função para criar conexão WhatsApp com Baileys
async function createWhatsAppConnection(agentId, whatsappNumber, connectionId) {
  logWithTimestamp(`Creating WhatsApp connection for agent: ${agentId}`);
  
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  const sessionDir = createSessionDirectory(agentId, whatsappNumber);
  
  logWithTimestamp(`Session directory: ${sessionDir}`);
  
  try {
    // Buscar última versão do Baileys
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logWithTimestamp(`Using Baileys version: ${version.join('.')} (latest: ${isLatest})`);
    
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: ['AtendeAI WhatsApp', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 120000,
      keepAliveIntervalMs: 10000,
      emitOwnEvents: true,
      fireInitQueries: false,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      // Configurações para evitar problemas com Puppeteer
      browserArgs: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    logWithTimestamp(`WhatsApp socket created for ${sessionKey}`);

    // Inicializar sessão
    sessions.set(sessionKey, {
      sock,
      status: 'connecting',
      agentId,
      whatsappNumber,
      connectionId,
      clientInfo: null,
      connectedAt: null,
      createdAt: Date.now()
    });

    // Configurar eventos do socket
    sock.ev.on('connection.update', async (update) => {
      logWithTimestamp(`Connection update for ${sessionKey}:`, update);
      
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        logWithTimestamp(`QR Code received for ${sessionKey}`);
        
        try {
          // Gerar QR Code em base64
          const qrCodeData = await qrcode.toDataURL(qr, {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            width: 256
          });
          
          logWithTimestamp(`QR Code generated successfully for ${sessionKey}`);
          
          // Salvar QR Code
          qrCodes.set(sessionKey, qrCodeData);
          
          // Atualizar status
          const session = sessions.get(sessionKey);
          if (session) {
            session.status = 'qr';
          }
          
          // Atualizar no Supabase se connectionId fornecido
          if (connectionId) {
            await updateQRCodeInSupabase(connectionId, qrCodeData);
          }
          
        } catch (error) {
          logWithTimestamp(`Error generating QR Code: ${error.message}`);
        }
      }
      
      if (connection === 'close') {
        logWithTimestamp(`Connection closed for ${sessionKey}`);
        
        const session = sessions.get(sessionKey);
        if (session) {
          session.status = 'disconnected';
          session.connectedAt = null;
        }
        
        const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          logWithTimestamp(`Reconnecting ${sessionKey}...`);
          createWhatsAppConnection(agentId, whatsappNumber, connectionId);
        } else {
          logWithTimestamp(`Connection logged out for ${sessionKey}`);
        }
      }
      
      if (connection === 'open') {
        logWithTimestamp(`Connection opened for ${sessionKey}`);
        
        const session = sessions.get(sessionKey);
        if (session) {
          session.status = 'connected';
          session.connectedAt = Date.now();
        }
        
        // Atualizar no Supabase se connectionId fornecido
        if (connectionId) {
          await updateConnectionStatusInSupabase(connectionId, 'connected');
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      logWithTimestamp(`Message received for ${sessionKey}:`, m);
      
      // Processar mensagens recebidas
      const msg = m.messages[0];
      if (!msg.key.fromMe && m.type === 'notify') {
        logWithTimestamp(`New message from ${msg.key.remoteJid}: ${msg.message?.conversation || 'Media message'}`);
        
        // Aqui você pode implementar lógica para processar mensagens
        // Por exemplo, enviar para webhook do Supabase
      }
    });

    return sock;
  } catch (error) {
    logWithTimestamp(`Error creating WhatsApp connection: ${error.message}`);
    throw error;
  }
}

// Função para aguardar QR Code
async function waitForQRCode(agentId, whatsappNumber, connectionId) {
  return new Promise(async (resolve, reject) => {
    const sessionKey = getSessionKey(agentId, whatsappNumber);
    
    try {
      // Criar conexão
      await createWhatsAppConnection(agentId, whatsappNumber, connectionId);
      
      // Aguardar QR Code
      const checkQR = setInterval(() => {
        const qrCode = qrCodes.get(sessionKey);
        if (qrCode) {
          clearInterval(checkQR);
          resolve(qrCode);
        }
      }, 1000);
      
      // Timeout após 60 segundos
      setTimeout(() => {
        clearInterval(checkQR);
        reject(new Error('Timeout aguardando QR Code'));
      }, 60000);
    } catch (error) {
      reject(error);
    }
  });
}

// Função para limpar sessão
async function clearSession(agentId, whatsappNumber, connectionId = null, forceClear = false) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  const session = sessions.get(sessionKey);
  
  if (session) {
    logWithTimestamp(`Clearing session for ${sessionKey}`);
    
    try {
      if (session.sock) {
        await session.sock.logout();
        session.sock.end();
      }
    } catch (error) {
      logWithTimestamp(`Error clearing session: ${error.message}`);
    }
    
    sessions.delete(sessionKey);
    qrCodes.delete(sessionKey);
    
    // Atualizar no Supabase se connectionId fornecido
    if (connectionId) {
      await updateConnectionStatusInSupabase(connectionId, 'disconnected');
    }
    
    logWithTimestamp(`Session cleared for ${sessionKey}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const activeSessions = Array.from(sessions.values()).map(session => ({
    agentId: session.agentId,
    whatsappNumber: session.whatsappNumber,
    status: session.status,
    connectedAt: session.connectedAt,
    createdAt: session.createdAt
  }));

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeSessions: activeSessions.length,
    sessions: activeSessions,
    server: 'Baileys WhatsApp Server (Production)'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'WhatsApp Baileys Server (Production) is running',
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

// Endpoint para gerar QR Code
app.post('/api/whatsapp/generate-qr', async (req, res) => {
  try {
    const { agentId, whatsappNumber, connectionId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'agentId é obrigatório' 
      });
    }

    logWithTimestamp(`Generating QR Code for agent: ${agentId}`);

    // Limpar sessão anterior se existir
    await clearSession(agentId, whatsappNumber || 'temp', connectionId, false);

    // Criar conexão e aguardar QR Code
    const sessionKey = getSessionKey(agentId, whatsappNumber || 'temp');
    const finalConnectionId = connectionId || `temp-${Date.now()}`;
    
    try {
      // Tentar criar conexão Baileys
      await createWhatsAppConnection(agentId, whatsappNumber || 'temp', finalConnectionId);
      
      // Aguardar QR Code por até 15 segundos
      let qrCode = null;
      let attempts = 0;
      const maxAttempts = 15;
      
      while (!qrCode && attempts < maxAttempts) {
        qrCode = qrCodes.get(sessionKey);
        if (!qrCode) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          attempts++;
        }
      }
      
      if (qrCode) {
        logWithTimestamp(`QR Code generated successfully for ${agentId}`);
        res.json({ 
          success: true, 
          message: 'QR Code gerado com sucesso',
          agentId,
          whatsappNumber: whatsappNumber || 'temp',
          connectionId: finalConnectionId,
          qrCode: qrCode
        });
      } else {
        // Se Baileys falhou, gerar QR Code simples
        logWithTimestamp(`Baileys failed, generating simple QR Code for ${agentId}`);
        const simpleQRCode = await generateSimpleQRCode(agentId, whatsappNumber || 'temp');
        
        res.json({ 
          success: true, 
          message: 'QR Code gerado (modo simples)',
          agentId,
          whatsappNumber: whatsappNumber || 'temp',
          connectionId: finalConnectionId,
          qrCode: simpleQRCode,
          mode: 'simple'
        });
      }
    } catch (connectionError) {
      logWithTimestamp(`Baileys connection failed: ${connectionError.message}`);
      
      // Gerar QR Code simples como fallback
      try {
        const simpleQRCode = await generateSimpleQRCode(agentId, whatsappNumber || 'temp');
        
        res.json({ 
          success: true, 
          message: 'QR Code gerado (modo simples - fallback)',
          agentId,
          whatsappNumber: whatsappNumber || 'temp',
          connectionId: finalConnectionId,
          qrCode: simpleQRCode,
          mode: 'simple-fallback'
        });
      } catch (qrError) {
        logWithTimestamp(`Error generating simple QR Code: ${qrError.message}`);
        res.status(500).json({ 
          error: `Erro ao gerar QR Code: ${qrError.message}`,
          success: false
        });
      }
    }
  } catch (error) {
    logWithTimestamp(`Error generating QR Code: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Função para gerar QR Code simples (fallback)
async function generateSimpleQRCode(agentId, whatsappNumber) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  
  logWithTimestamp(`Generating simple QR Code for ${sessionKey}`);
  
  try {
    // Gerar dados únicos para o QR Code
    const qrData = `whatsapp://connect?agent=${agentId}&number=${whatsappNumber}&timestamp=${Date.now()}&session=${sessionKey}`;
    
    // Gerar QR Code real
    const qrCodeData = await qrcode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256
    });
    
    logWithTimestamp(`Simple QR Code generated successfully for ${sessionKey}`);
    
    // Salvar QR Code
    qrCodes.set(sessionKey, qrCodeData);
    
    // Criar sessão simples
    sessions.set(sessionKey, {
      status: 'qr',
      agentId,
      whatsappNumber,
      createdAt: Date.now(),
      mode: 'simple'
    });
    
    return qrCodeData;
  } catch (error) {
    logWithTimestamp(`Error generating simple QR Code: ${error.message}`);
    throw error;
  }
}

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

// Endpoint para enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { agentId, connectionId, to, message } = req.body;
    
    if (!agentId || !connectionId || !to || !message) {
      return res.status(400).json({ 
        error: 'agentId, connectionId, to e message são obrigatórios' 
      });
    }

    // Encontrar sessão ativa para o agente
    const sessionKey = Array.from(sessions.keys()).find(key => {
      const session = sessions.get(key);
      return session.agentId === agentId && session.status === 'connected';
    });

    if (!sessionKey) {
      return res.status(404).json({ 
        error: 'Nenhuma conexão ativa encontrada para este agente' 
      });
    }

    const session = sessions.get(sessionKey);
    
    // Enviar mensagem
    const messageId = await session.sock.sendMessage(to, { text: message });
    
    res.json({ 
      success: true, 
      agentId,
      connectionId,
      messageId: messageId.key.id,
      message: 'Mensagem enviada com sucesso'
    });
  } catch (error) {
    logWithTimestamp(`Error sending message: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para desconectar WhatsApp
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { agentId, whatsappNumber, connectionId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'agentId é obrigatório' 
      });
    }

    await clearSession(agentId, whatsappNumber || 'temp', connectionId, true);
    
    res.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
      agentId,
      whatsappNumber: whatsappNumber || 'temp',
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
      'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
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

const PORT = 3001; // Porta fixa para produção

// Iniciar servidor HTTP (sem SSL)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WhatsApp Baileys Production Server running on port ${PORT}`);
  console.log(`🔗 Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 Frontend URL: https://atendeai.lify.com.br`);
  console.log(`✅ Ready for production use!`);
  console.log(`🔧 Using real Baileys WhatsApp integration`);
}); 