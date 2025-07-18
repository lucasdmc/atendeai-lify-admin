#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
const HOST = '0.0.0.0';

// Configurar CORS
app.use(cors({
  origin: [
    'https://atendeai.lify.com.br',
    'http://localhost:8080',
    'http://localhost:3000'
  ],
  credentials: true
}));

app.use(express.json());

// Criar diretório para sessões se não existir
const sessionsDir = path.join(process.cwd(), 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Armazenar sessões ativas
const sessions = new Map();
const qrCodes = new Map();

// Função para log com timestamp
function logWithTimestamp(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${message}`);
  if (data) {
    console.log(`${timestamp} - Data:`, data);
  }
}

// Função para obter chave da sessão
function getSessionKey(agentId, whatsappNumber) {
  return `${agentId}_${whatsappNumber || 'temp'}`;
}

// Função para limpar sessão
async function clearSession(agentId, whatsappNumber, connectionId, force = false) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  
  const session = sessions.get(sessionKey);
  if (session && session.sock) {
    try {
      if (force) {
        session.sock.end();
      } else {
        session.sock.logout();
      }
    } catch (error) {
      logWithTimestamp(`Error clearing session ${sessionKey}:`, error.message);
    }
  }
  
  sessions.delete(sessionKey);
  qrCodes.delete(sessionKey);
  
  logWithTimestamp(`Session cleared: ${sessionKey}`);
}

// Função para criar conexão WhatsApp
async function createWhatsAppConnection(agentId, whatsappNumber, connectionId) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  
  logWithTimestamp(`Creating WhatsApp connection for ${sessionKey}`);
  
  try {
    // Limpar sessão anterior se existir
    await clearSession(agentId, whatsappNumber, connectionId, false);
    
    // Criar diretório para este agente
    const agentDir = path.join(sessionsDir, agentId);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }
    
    // Configurar autenticação
    const { state, saveCreds } = await useMultiFileAuthState(agentDir);
    
    // Criar socket
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['AtendeAI', 'Chrome', '1.0.0'],
      connectTimeoutMs: 60000,
      qrTimeout: 40000,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250
    });
    
    // Configurar eventos
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
        } catch (error) {
          logWithTimestamp(`Error generating QR Code: ${error.message}`);
        }
      }
      
      if (connection === 'open') {
        logWithTimestamp(`Connection opened for ${sessionKey}`);
        
        const session = sessions.get(sessionKey);
        if (session) {
          session.status = 'connected';
          session.connectedAt = Date.now();
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
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    // Salvar sessão
    sessions.set(sessionKey, {
      sock,
      status: 'connecting',
      agentId,
      whatsappNumber,
      connectionId,
      createdAt: Date.now()
    });
    
    logWithTimestamp(`WhatsApp connection created for ${sessionKey}`);
    
  } catch (error) {
    logWithTimestamp(`Error creating WhatsApp connection for ${sessionKey}:`, error.message);
    throw error;
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    activeSessions: sessions.size,
    sessions: Array.from(sessions.keys()),
    server: 'Baileys WhatsApp Server (HTTP)'
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

    // Criar nova conexão
    await createWhatsAppConnection(agentId, whatsappNumber || 'temp', connectionId || `temp-${Date.now()}`);

    // Aguardar QR Code por até 30 segundos
    const sessionKey = getSessionKey(agentId, whatsappNumber || 'temp');
    let attempts = 0;
    const maxAttempts = 30; // 30 segundos
    
    while (attempts < maxAttempts) {
      const qrCode = qrCodes.get(sessionKey);
      if (qrCode) {
        logWithTimestamp(`QR Code ready for ${sessionKey}`);
        return res.json({ 
          success: true, 
          message: 'QR Code generated successfully',
          agentId,
          whatsappNumber: whatsappNumber || 'temp',
          connectionId: connectionId || `temp-${Date.now()}`,
          qrCode: qrCode
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }
    
    // Timeout
    logWithTimestamp(`Timeout waiting for QR Code for ${sessionKey}`);
    return res.status(500).json({ 
      error: 'Timeout waiting for QR Code',
      success: false
    });
    
  } catch (error) {
    logWithTimestamp(`Error generating QR Code: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Endpoint para desconectar
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { agentId, whatsappNumber } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ 
        error: 'agentId é obrigatório' 
      });
    }

    logWithTimestamp(`Disconnecting agent: ${agentId}`);

    await clearSession(agentId, whatsappNumber || 'temp', null, true);

    res.json({ 
      success: true, 
      message: 'Disconnected successfully'
    });
    
  } catch (error) {
    logWithTimestamp(`Error disconnecting: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Endpoint para status
app.get('/api/whatsapp/status/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const { whatsappNumber } = req.query;
    
    const sessionKey = getSessionKey(agentId, whatsappNumber || 'temp');
    const session = sessions.get(sessionKey);
    const qrCode = qrCodes.get(sessionKey);
    
    if (!session) {
      return res.json({
        status: 'disconnected',
        connected: false,
        hasQR: false
      });
    }
    
    res.json({
      status: session.status,
      connected: session.status === 'connected',
      hasQR: !!qrCode,
      qrCode: qrCode || null,
      connectedAt: session.connectedAt,
      createdAt: session.createdAt
    });
    
  } catch (error) {
    logWithTimestamp(`Error getting status: ${error.message}`);
    res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  logWithTimestamp(`🚀 Baileys WhatsApp Server running on http://${HOST}:${PORT}`);
  logWithTimestamp(`🏥 Health check: http://${HOST}:${PORT}/health`);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logWithTimestamp('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logWithTimestamp('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
}); 