// ========================================
// WEBHOOK WHATSAPP COM AI INTEGRADA
// ========================================

const express = require('express');
const { processWhatsAppWebhook } = require('../services/aiWhatsAppService');
const router = express.Router();

// Webhook para receber mensagens do WhatsApp
router.post('/whatsapp-meta', async (req, res) => {
  try {
    console.log('[Webhook] Mensagem recebida:', {
      method: req.method,
      headers: req.headers,
      body: req.body
    });

    // Verificar se é um desafio de verificação
    if (req.body.mode === 'subscribe' && req.body['hub.challenge']) {
      console.log('[Webhook] Respondendo ao desafio de verificação');
      return res.status(200).send(req.body['hub.challenge']);
    }

    // Processar mensagens
    if (req.body.entry && req.body.entry.length > 0) {
      const webhookData = req.body;
      
      // Configuração do WhatsApp (pode vir do banco de dados)
      const whatsappConfig = {
        accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
        phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
      };

      // IDs de exemplo (em produção, viriam do contexto da clínica)
      const clinicId = process.env.DEFAULT_CLINIC_ID || 'test-clinic';
      const userId = process.env.DEFAULT_USER_ID || 'system-user';

      // Processar com AI
      const result = await processWhatsAppWebhook(
        webhookData,
        clinicId,
        userId,
        whatsappConfig
      );

      if (result.success) {
        console.log('[Webhook] Processamento concluído com sucesso');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com AI',
          processed: result.processed
        });
      } else {
        console.error('[Webhook] Erro no processamento:', result.error);
        return res.status(500).json({ 
          success: false, 
          error: result.error 
        });
      }
    }

    // Se não há mensagens para processar
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook recebido, mas sem mensagens para processar' 
    });

  } catch (error) {
    console.error('[Webhook] Erro geral:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Rota de teste para verificar se o webhook está funcionando
router.get('/whatsapp/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook WhatsApp com AI está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    webhookUrl: process.env.WEBHOOK_URL || 'não configurado'
  });
});

// Rota para testar envio de mensagem com AI
router.post('/whatsapp/test-send', async (req, res) => {
  try {
    const { to, message, clinicId, userId } = req.body;

    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetros "to" e "message" são obrigatórios'
      });
    }

    // Simular mensagem recebida
    const mockMessage = {
      from: to,
      text: { body: message },
      timestamp: Date.now()
    };

    // Configuração do WhatsApp
    const whatsappConfig = {
      accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
    };

    // Processar com AI
    const { processMessageWithAI, sendAIResponseViaWhatsApp } = require('../services/aiWhatsAppService');
    
    const aiResponse = await processMessageWithAI(
      mockMessage,
      clinicId || 'test-clinic',
      userId || 'test-user'
    );

    if (aiResponse) {
      // Enviar resposta via WhatsApp
      const sendResult = await sendAIResponseViaWhatsApp(
        to,
        aiResponse,
        whatsappConfig
      );

      return res.json({
        success: true,
        message: 'Mensagem processada e enviada com AI',
        aiResponse,
        sendResult
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Falha ao processar mensagem com AI'
      });
    }

  } catch (error) {
    console.error('[Webhook Test] Erro:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 