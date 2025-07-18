import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // Buscar última versão do Baileys
  const { version, isLatest } = await fetchLatestBaileysVersion();
  logWithTimestamp(`Using Baileys version: ${version.join('.')} (latest: ${isLatest})`);
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    browser: ['Chrome (Linux)', '', ''],
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 120000,
    keepAliveIntervalMs: 10000,
    emitOwnEvents: true,
    fireInitQueries: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: false,
    markOnlineOnConnect: true
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
        
        // Atualizar no Supabase se necessário
        if (connectionId && connectionId !== `temp-${Date.now()}`) {
          await updateQRCodeInSupabase(connectionId, qrCodeData);
        }
      } catch (error) {
        logWithTimestamp(`Error generating QR Code for ${sessionKey}`, { error: error.message });
      }
    }
    
    if (connection === 'close') {
      const session = sessions.get(sessionKey);
      if (session) {
        session.status = 'disconnected';
        session.connectedAt = null;
      }
      
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logWithTimestamp(`Connection closed for ${sessionKey}, should reconnect: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        logWithTimestamp(`Reconnecting ${sessionKey}...`);
        createWhatsAppConnection(agentId, whatsappNumber, connectionId);
      } else {
        logWithTimestamp(`Connection logged out for ${sessionKey}`);
        clearSession(agentId, whatsappNumber, connectionId, true);
      }
    }
    
    if (connection === 'open') {
      logWithTimestamp(`Connection opened for ${sessionKey}`);
      
      const session = sessions.get(sessionKey);
      if (session) {
        session.status = 'connected';
        session.connectedAt = new Date().toISOString();
      }
      
      // Atualizar no Supabase
      if (connectionId && connectionId !== `temp-${Date.now()}`) {
        await updateConnectionStatusInSupabase(connectionId, 'connected', {
          last_connection_at: new Date().toISOString()
        });
      }
    }
  });

  // Configurar eventos de credenciais
  sock.ev.on('creds.update', saveCreds);

  // Configurar eventos de mensagens
  sock.ev.on('messages.upsert', async (m) => {
    const message = m.messages[0];
    if (!message?.key?.fromMe && m.type === 'notify') {
      logWithTimestamp(`Received message for ${sessionKey}:`, message);
      
      if (!message.key?.remoteJid) {
        logWithTimestamp('Message without remoteJid, skipping...');
        return;
      }
      
      const session = sessions.get(sessionKey);
      if (!session) {
        logWithTimestamp('Session not found for message');
        return;
      }
      
      // Processar mensagem recebida
      try {
        const messageText = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || 
                          message.message?.imageMessage?.caption || 
                          'Mensagem não suportada';
        
        logWithTimestamp(`Processing message: ${messageText} from ${message.key.remoteJid}`);
        
        // Enviar para webhook do Supabase
        await fetch('https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/whatsapp-integration/webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            agentId: session.agentId,
            connectionId: session.connectionId,
            message: {
              from: message.key.remoteJid,
              text: messageText,
              timestamp: message.messageTimestamp,
              type: 'received'
            }
          })
        });
      } catch (error) {
        logWithTimestamp(`Error processing message: ${error.message}`);
      }
    }
  });

  return { sock, sessionKey, saveCreds };
}

// Função para aguardar QR Code ser gerado
async function waitForQRCode(agentId, whatsappNumber, connectionId) {
  logWithTimestamp(`Starting QR Code generation for agent: ${agentId}, whatsapp: ${whatsappNumber}, connection: ${connectionId}`);
  
  try {
    const { sock, sessionKey, saveCreds } = await createWhatsAppConnection(agentId, whatsappNumber, connectionId);
    
    return new Promise((resolve, reject) => {
      let qrAttempts = 0;
      const maxQRAttempts = 5;
      let connectionEstablished = false;
      let qrGenerated = false;
      
      const timeout = setTimeout(() => {
        logWithTimestamp(`Timeout waiting for QR Code for ${sessionKey}`);
        if (!connectionEstablished && !qrGenerated) {
          clearSession(agentId, whatsappNumber, connectionId, false);
          reject(new Error('Timeout waiting for QR Code - tente novamente'));
        }
      }, 120000);

      // Tratamento de erros específicos
      sock.ev.on('connection.update', async (update) => {
        logWithTimestamp(`Connection update for ${sessionKey}`, update);
        
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
          qrAttempts++;
          qrGenerated = true;
          logWithTimestamp(`QR Code received for ${sessionKey} (attempt ${qrAttempts}/${maxQRAttempts})`);
          
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
            
            // Atualizar no Supabase se necessário
            if (connectionId && connectionId !== `temp-${Date.now()}`) {
              await updateQRCodeInSupabase(connectionId, qrCodeData);
            }
            
            clearTimeout(timeout);
            resolve(qrCodeData);
          } catch (error) {
            logWithTimestamp(`Error generating QR Code for ${sessionKey}`, { error: error.message });
            
            if (qrAttempts >= maxQRAttempts) {
              clearTimeout(timeout);
              reject(new Error(`Falha ao gerar QR Code após ${maxQRAttempts} tentativas`));
            }
          }
        }
        
        if (connection === 'open') {
          connectionEstablished = true;
          logWithTimestamp(`Connection established for ${sessionKey}`);
          clearTimeout(timeout);
          resolve(null); // QR Code não é mais necessário
        }
        
        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          if (!shouldReconnect) {
            clearTimeout(timeout);
            reject(new Error('Conexão fechada inesperadamente'));
          }
        }
      });
    });
  } catch (error) {
    logWithTimestamp(`Error in waitForQRCode: ${error.message}`);
    throw error;
  }
}

// Função para limpar sessão
async function clearSession(agentId, whatsappNumber, connectionId = null, forceClear = false) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  logWithTimestamp(`Clearing session: ${sessionKey}`);
  
  const session = sessions.get(sessionKey);
  if (session) {
    try {
      if (session.sock) {
        session.sock.end();
      }
    } catch (error) {
      logWithTimestamp(`Error ending socket: ${error.message}`);
    }
    
    sessions.delete(sessionKey);
    qrCodes.delete(sessionKey);
  }
  
  // Atualizar no Supabase se connectionId for fornecido
  if (connectionId) {
    try {
      await updateConnectionStatusInSupabase(connectionId, 'disconnected');
    } catch (error) {
      logWithTimestamp(`Error updating Supabase: ${error.message}`);
    }
  }
  
  logWithTimestamp(`Session cleared: ${sessionKey}`);
}

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
    server: 'Baileys WhatsApp Server'
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

    // Aguardar QR Code ser gerado
    const qrCode = await waitForQRCode(agentId, whatsappNumber || 'temp', connectionId || `temp-${Date.now()}`);

    res.json({ 
      success: true, 
      message: 'QR Code gerado com sucesso',
      agentId,
      whatsappNumber: whatsappNumber || 'temp',
      connectionId: connectionId || `temp-${Date.now()}`,
      qrCode: qrCode
    });
  } catch (error) {
    logWithTimestamp(`Error generating QR Code: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Baileys server running on port ${PORT}`);
  console.log(`Server accessible at: http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
}); 