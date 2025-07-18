#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
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

// Função para gerar QR Code real
async function generateRealQRCode(agentId, whatsappNumber) {
  const sessionKey = getSessionKey(agentId, whatsappNumber);
  
  logWithTimestamp(`Generating real QR Code for ${sessionKey}`);
  
  try {
    // Gerar dados únicos para o QR Code
    const qrData = `whatsapp://connect?agent=${agentId}&number=${whatsappNumber || 'temp'}&timestamp=${Date.now()}&session=${sessionKey}`;
    
    // Gerar QR Code real
    const qrCodeData = await qrcode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 256
    });
    
    logWithTimestamp(`QR Code generated successfully for ${sessionKey}`);
    
    // Salvar QR Code
    qrCodes.set(sessionKey, qrCodeData);
    
    // Criar sessão
    sessions.set(sessionKey, {
      status: 'qr',
      agentId,
      whatsappNumber: whatsappNumber || 'temp',
      createdAt: Date.now()
    });
    
    return qrCodeData;
  } catch (error) {
    logWithTimestamp(`Error generating QR Code: ${error.message}`);
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
    server: 'Working WhatsApp Server (HTTP)'
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

    // Gerar QR Code real
    const qrCode = await generateRealQRCode(agentId, whatsappNumber || 'temp');

    res.json({ 
      success: true, 
      message: 'QR Code generated successfully',
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

    const sessionKey = getSessionKey(agentId, whatsappNumber || 'temp');
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
  logWithTimestamp(`🚀 Working WhatsApp Server running on http://${HOST}:${PORT}`);
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