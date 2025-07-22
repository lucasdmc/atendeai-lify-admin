#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { default as makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { Boom } from '@hapi/boom';

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
  return `${agentId}_${whatsappNumber || 'default'}`;
}

// Função para gerar QR Code real do WhatsApp
async function generateWhatsAppQRCode(agentId, whatsappNumber) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  const sessionDir = path.join(sessionsDir, sessionKey);
  
  logWithTimestamp(`Generating real WhatsApp QR Code for ${sessionKey}`);
  
  try {
    // Criar diretório da sessão se não existir
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    // Usar autenticação multi-arquivo do Baileys
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    // Criar conexão Baileys
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Não imprimir QR no terminal
      logger: console,
      browser: ['AtendeAI', 'Chrome', '1.0.0'],
      version: [2, 2323, 4],
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      emitOwnEvents: false,
      defaultQueryTimeoutMs: 60000,
      retryRequestDelayMs: 250,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: true,
      getMessage: async () => {
        return { conversation: 'hello' };
      }
    });

    // Evento de conexão
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      
      if (qr) {
        logWithTimestamp(`QR Code generated for ${sessionKey}`);
        
        // Gerar QR Code como data URL
        const qrCodeData = await qrcode.toDataURL(qr, {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          width: 256
        });
        
        // Salvar QR Code
        qrCodes.set(sessionKey, qrCodeData);
        
        // Atualizar sessão
        const session = sessions.get(sessionKey) || {
          agentId,
          whatsappNumber: whatsappNumber || 'default',
          createdAt: Date.now()
        };
        session.status = 'qr';
        session.qrCode = qrCodeData;
        sessions.set(sessionKey, session);
        
        logWithTimestamp(`QR Code saved for ${sessionKey}`);
      }
      
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        logWithTimestamp(`Connection closed for ${sessionKey}, should reconnect: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          // Tentar reconectar
          setTimeout(() => {
            logWithTimestamp(`Attempting to reconnect ${sessionKey}`);
            generateWhatsAppQRCode(agentId, whatsappNumber);
          }, 3000);
        }
      } else if (connection === 'open') {
        logWithTimestamp(`WhatsApp connected for ${sessionKey}`);
        
        // Atualizar sessão
        const session = sessions.get(sessionKey);
        if (session) {
          session.status = 'connected';
          session.connectedAt = Date.now();
          session.qrCode = null; // Limpar QR Code após conexão
          sessions.set(sessionKey, session);
        }
        
        // Salvar credenciais
        await saveCreds();
      }
    });

    // Evento de credenciais
    sock.ev.on('creds.update', saveCreds);

    // Salvar sock na sessão
    const session = sessions.get(sessionKey) || {
      agentId,
      whatsappNumber: whatsappNumber || 'default',
      createdAt: Date.now(),
      sock: sock
    };
    session.sock = sock;
    sessions.set(sessionKey, session);

    // Retornar QR Code se disponível
    const qrCode = qrCodes.get(sessionKey);
    if (qrCode) {
      return qrCode;
    } else {
      // Aguardar QR Code ser gerado
      return new Promise((resolve) => {
        const checkQR = setInterval(() => {
          const qrCode = qrCodes.get(sessionKey);
          if (qrCode) {
            clearInterval(checkQR);
            resolve(qrCode);
          }
        }, 1000);
        
        // Timeout após 30 segundos
        setTimeout(() => {
          clearInterval(checkQR);
          resolve(null);
        }, 30000);
      });
    }
    
  } catch (error) {
    logWithTimestamp(`Error generating WhatsApp QR Code: ${error.message}`);
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

    // Gerar QR Code real do WhatsApp
    const qrCode = await generateWhatsAppQRCode(agentId, whatsappNumber || 'default');

    if (!qrCode) {
      return res.status(500).json({ 
        error: 'Não foi possível gerar QR Code',
        success: false
      });
    }

    res.json({ 
      success: true, 
      message: 'QR Code generated successfully',
      agentId,
      whatsappNumber: whatsappNumber || 'default',
      connectionId: connectionId || `baileys-${Date.now()}`,
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

    const sessionKey = getSessionKey(agentId, whatsappNumber || 'default');
    const session = sessions.get(sessionKey);
    
    if (session && session.sock) {
      // Desconectar sock
      await session.sock.logout();
      session.sock.end();
    }
    
    sessions.delete(sessionKey);
    qrCodes.delete(sessionKey);

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
    
    const sessionKey = getSessionKey(agentId, whatsappNumber || 'default');
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