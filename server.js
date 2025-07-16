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
const QR_TIMEOUT = 10 * 60 * 1000; // Aumentar para 10 minutos
const CONNECTION_TIMEOUT = 15 * 60 * 1000; // Aumentar para 15 minutos
const QR_RETRY_INTERVAL = 3000; // Tentar reenviar QR a cada 3 segundos
const CLEANUP_INTERVAL = 2 * 60 * 1000; // Limpeza a cada 2 minutos

// Sistema de retry para QR Code
let qrRetryCount = 0;
const maxQrRetries = 5;

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

    // Sistema de retry para QR Code
    let qrRetryCount = 0;
    const maxQrRetries = 5;

    const client = new Client({
      authStrategy: new LocalAuth({ 
        clientId: agentId,
        dataPath: './.wwebjs_auth' // Caminho específico para dados de autenticação
      }),
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
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-blink-features=AutomationControlled',
          '--disable-extensions',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-ipc-flooding-protection',
          '--force-color-profile=srgb',
          '--metrics-recording-only',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain'
        ],
        headless: true, // Mudança: usar true ao invés de 'new'
        executablePath: process.platform === 'darwin' 
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' 
          : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/chromium-browser' // Para Linux/VPS
        // Removido userDataDir para compatibilidade com LocalAuth
      },
      webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
      }
    });

    // Configurar eventos do cliente
    client.on('qr', async (qr) => {
      console.log('QR Code gerado para:', agentId, 'Tentativa:', qrRetryCount + 1);
      
      try {
        const qrCode = await qrcode.toDataURL(qr, {
          width: 512, // Aumentar resolução
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        sessionStates.set(agentId, { 
          status: 'qr', 
          qrCode,
          connected: false,
          lastUpdate: Date.now(),
          qrRetryCount: qrRetryCount
        });
        
        // Configurar timeout mais longo para QR Code
        setupSessionTimeout(agentId, QR_TIMEOUT, 'QR Code não foi escaneado');
        
        qrRetryCount++;
        
        // Se falhar, tentar gerar novo QR após intervalo
        if (qrRetryCount < maxQrRetries) {
          setTimeout(() => {
            const currentState = sessionStates.get(agentId);
            if (currentState && currentState.status === 'qr' && !currentState.connected) {
              console.log('Tentando gerar novo QR Code...');
              client.initialize();
            }
          }, QR_RETRY_INTERVAL);
        }
      } catch (error) {
        console.error('Erro ao gerar QR Code:', error);
      }
    });

    // Adicionar evento de loading
    client.on('loading_screen', (percent, message) => {
      console.log('Carregando WhatsApp:', percent, message);
      
      sessionStates.set(agentId, { 
        status: 'loading', 
        loadingPercent: percent,
        loadingMessage: message,
        connected: false,
        lastUpdate: Date.now()
      });
    });

    // Melhor tratamento de autenticação
    client.on('authenticated', () => {
      console.log('Cliente autenticado com sucesso para:', agentId);
      qrRetryCount = 0; // Reset retry count
      
      sessionStates.set(agentId, { 
        status: 'authenticated', 
        connected: false,
        lastUpdate: Date.now()
      });
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

    // Adicionar listener de mensagens
    console.log('🟢 Registrando listener de mensagens WhatsApp...');
    client.on('message', async (message) => {
      console.log('📨 Mensagem recebida para agente:', agentId);
      console.log('📱 De:', message.from);
      console.log('💬 Conteúdo:', message.body);
      console.log('🆔 Message ID:', message.id._serialized);
      
      try {
        // Extrair informações da mensagem
        const from = message.from;
        const messageText = message.body;
        const messageId = message.id._serialized;
        const timestamp = message.timestamp * 1000; // Converter para milissegundos
        const contactName = message._data.notifyName || message.from.split('@')[0];
        
        console.log('📋 Dados da mensagem:', {
          agentId,
          from,
          messageText,
          messageId,
          timestamp,
          contactName
        });
        
        // Enviar para webhook do Supabase
        const webhookUrl = process.env.SUPABASE_WEBHOOK_URL || 'https://your-project.supabase.co/functions/v1/agent-whatsapp-manager/webhook';
        
        const webhookData = {
          agentId,
          connectionId: agentId, // Usar agentId como connectionId por enquanto
          phoneNumber: from,
          contactName,
          message: messageText,
          messageType: 'received',
          messageId,
          timestamp
        };
        
        console.log('🌐 Enviando para webhook:', webhookUrl);
        console.log('📤 Dados do webhook:', webhookData);
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify(webhookData)
        });
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook processado com sucesso');
        } else {
          console.error('❌ Erro no webhook:', webhookResponse.status, await webhookResponse.text());
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error);
      }
    });

    // Adicionar listener para mensagens de mídia
    console.log('🟢 Registrando listener de mensagens de mídia WhatsApp...');
    client.on('media_message', async (message) => {
      console.log('📷 Mensagem de mídia recebida para agente:', agentId);
      console.log('📱 De:', message.from);
      console.log('🖼️ Tipo de mídia:', message.type);
      
      try {
        const from = message.from;
        const messageText = `[${message.type.toUpperCase()}] ${message.body || 'Mídia recebida'}`;
        const messageId = message.id._serialized;
        const timestamp = message.timestamp * 1000;
        const contactName = message._data.notifyName || message.from.split('@')[0];
        
        // Enviar para webhook do Supabase
        const webhookUrl = process.env.SUPABASE_WEBHOOK_URL || 'https://your-project.supabase.co/functions/v1/agent-whatsapp-manager/webhook';
        
        const webhookData = {
          agentId,
          connectionId: agentId,
          phoneNumber: from,
          contactName,
          message: messageText,
          messageType: 'received',
          messageId,
          timestamp,
          mediaType: message.type
        };
        
        console.log('🌐 Enviando mídia para webhook:', webhookUrl);
        
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify(webhookData)
        });
        
        if (webhookResponse.ok) {
          console.log('✅ Webhook de mídia processado com sucesso');
        } else {
          console.error('❌ Erro no webhook de mídia:', webhookResponse.status, await webhookResponse.text());
        }
        
      } catch (error) {
        console.error('❌ Erro ao processar mensagem de mídia:', error);
      }
    });

    console.log('🚀 Inicializando cliente WhatsApp para:', agentId);
    await client.initialize();
    whatsappClients.set(agentId, client);
    console.log('✅ Cliente WhatsApp inicializado com sucesso para:', agentId);

    res.json({ success: true, message: 'Cliente WhatsApp inicializado' });
  } catch (error) {
    // Corrigido: garantir que agentId está definido
    const safeAgentId = (typeof agentId !== 'undefined') ? agentId : (req && req.body && req.body.agentId ? req.body.agentId : 'desconhecido');
    console.error('❌ Erro ao gerar QR para', safeAgentId, ':', error);
    console.error('Stack trace:', error.stack);
    
    // Limpar cliente se houver erro
    if (safeAgentId && safeAgentId !== 'desconhecido') {
      await cleanupSession(safeAgentId);
    }
    
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

// Rota para forçar novo QR Code
app.post('/api/whatsapp/refresh-qr', async (req, res) => {
  try {
    const { agentId } = req.body;
    
    if (!agentId) {
      return res.status(400).json({ error: 'agentId é obrigatório' });
    }
    
    const client = whatsappClients.get(agentId);
    const state = sessionStates.get(agentId);
    
    if (!client || !state || state.status !== 'qr') {
      return res.status(400).json({ error: 'Cliente não está em estado de QR' });
    }
    
    console.log('Forçando novo QR Code para:', agentId);
    
    // Reinicializar cliente
    await client.destroy();
    await client.initialize();
    
    res.json({ success: true, message: 'Novo QR Code será gerado' });
  } catch (error) {
    console.error('Erro ao atualizar QR:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  try {
    const { agentId, to, message } = req.body;
    
    if (!agentId || !to || !message) {
      return res.status(400).json({ error: 'agentId, to e message são obrigatórios' });
    }
    
    const client = whatsappClients.get(agentId);
    if (!client) {
      return res.status(400).json({ error: 'Agente não encontrado ou não conectado' });
    }
    
    const state = sessionStates.get(agentId);
    if (!state || !state.connected) {
      return res.status(400).json({ error: 'Agente não está conectado' });
    }
    
    console.log('📤 Enviando mensagem para:', to);
    console.log('💬 Conteúdo:', message);
    console.log('🤖 Agente:', agentId);
    
    // Formatar número do telefone
    const chatId = to.includes('@c.us') ? to : `${to}@c.us`;
    
    // Enviar mensagem
    const result = await client.sendMessage(chatId, message);
    
    console.log('✅ Mensagem enviada com sucesso');
    console.log('🆔 Message ID:', result.id._serialized);
    
    // Enviar confirmação para webhook
    try {
      const webhookUrl = process.env.SUPABASE_WEBHOOK_URL || 'https://your-project.supabase.co/functions/v1/agent-whatsapp-manager/webhook';
      
      const webhookData = {
        agentId,
        connectionId: agentId,
        phoneNumber: to,
        contactName: to.split('@')[0],
        message,
        messageType: 'sent',
        messageId: result.id._serialized,
        timestamp: Date.now()
      };
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(webhookData)
      });
      
      console.log('✅ Confirmação enviada para webhook');
    } catch (webhookError) {
      console.error('❌ Erro ao enviar confirmação para webhook:', webhookError);
    }
    
    res.json({ 
      success: true, 
      messageId: result.id._serialized,
      message: 'Mensagem enviada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error);
    res.status(500).json({ 
      error: 'Erro ao enviar mensagem',
      details: error.message 
    });
  }
});

// Garantir fetch global para Node.js
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
  console.log('🌐 fetch global habilitado via node-fetch');
}

app.listen(PORT, () => {
  console.log(`🚀 Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});
