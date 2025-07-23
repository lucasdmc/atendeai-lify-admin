const express = require('express');
const { saveReceivedMessage, getOrCreateConversation } = require('../services/supabaseService');
const { sendWhatsAppTextMessage } = require('../services/whatsappMetaService');
const logger = require('../utils/logger');
const router = express.Router();

// Função para enviar resposta automática
async function sendAutoReply(phoneNumber) {
  try {
    const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      logger.warn('Credenciais do WhatsApp Meta não configuradas para resposta automática');
      return false;
    }

    const autoReplyMessage = `📩 Mensagem recebida com sucesso no WhatsApp!
✅ O Atende Ai já está se preparando…
🤖 Em breve você receberá uma resposta automática!
⏳ Aguarde só um pouquinho 😉`;

    const result = await sendWhatsAppTextMessage({
      accessToken,
      phoneNumberId,
      to: phoneNumber,
      text: autoReplyMessage
    });

    logger.webhook('Resposta automática enviada', { 
      phoneNumber, 
      messageId: result.messages?.[0]?.id 
    });

    return true;
  } catch (error) {
    logger.error('Erro ao enviar resposta automática', { 
      error: error.message, 
      phoneNumber 
    });
    return false;
  }
}

// GET endpoint para verificação do webhook
router.get('/whatsapp-meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  logger.webhook('Verificação do webhook solicitada', {
    mode,
    hasToken: !!token,
    hasChallenge: !!challenge
  });

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === 'subscribe' && token === verifyToken) {
    logger.webhook('Webhook verificado com sucesso');
    res.status(200).send(challenge);
  } else {
    logger.error('Falha na verificação do webhook', { mode, token });
    res.status(403).send('Forbidden');
  }
});

// POST endpoint para receber mensagens
router.post('/whatsapp-meta', async (req, res) => {
  const body = req.body;
  
  logger.webhook('Webhook recebido da Meta', {
    entryCount: body.entry?.length || 0
  });

  const entries = body.entry || [];
  let saved = 0;
  let processed = 0;
  let failed = 0;

  for (const entry of entries) {
    const changes = entry.changes || [];
    for (const change of changes) {
      const value = change.value || {};
      const messages = value.messages || [];
      
      for (const msg of messages) {
        processed++;
        const from = msg.from;
        const messageText = msg.text?.body || msg.button?.text || msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || '';
        const timestamp = msg.timestamp ? parseInt(msg.timestamp) * 1000 : Date.now();
        const messageId = msg.id;
        
        logger.webhook('Processando mensagem recebida', {
          from,
          messageId,
          textLength: messageText.length,
          timestamp: new Date(timestamp).toISOString()
        });

        try {
          // Buscar ou criar conversationId usando o serviço corrigido
          const conversationId = await getOrCreateConversation(from);
          
          // Salvar mensagem recebida
          await saveReceivedMessage({ 
            conversationId, 
            from, 
            messageText, 
            messageId, 
            timestamp 
          });
          
          saved++;

          // Enviar resposta automática
          await sendAutoReply(from);

        } catch (error) {
          failed++;
          logger.error('Erro ao processar mensagem do webhook', {
            error: error.message,
            from,
            messageId,
            messageText
          });
        }
      }
    }
  }

  logger.webhook('Webhook processado com sucesso', {
    processed,
    saved,
    failed
  });

  res.status(200).json({ 
    success: true, 
    message: `Webhook processado`,
    stats: {
      processed,
      saved,
      failed
    }
  });
});

module.exports = router; 