// ========================================
// WEBHOOK WHATSAPP COM AI ROBUSTA INTEGRADA
// ========================================

import express from 'express';
import { sendWhatsAppTextMessage } from '../services/whatsappMetaService.js';

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
      const clinicId = 'test-clinic';
      const userId = 'system-user';

      // Processar com AI ROBUSTA
      const result = await processWhatsAppWebhookRobust(
        webhookData,
        clinicId,
        userId,
        whatsappConfig
      );

      if (result.success) {
        console.log('[Webhook] Processamento concluído com sucesso');
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com AI Robusta',
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
    message: 'Webhook WhatsApp com AI Robusta está funcionando',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    webhookUrl: process.env.WEBHOOK_URL || 'não configurado'
  });
});

// Rota para testar envio de mensagem com AI Robusta
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

    // Processar com AI Robusta
    const aiResponse = await processMessageWithAIRobust(
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
        message: 'Mensagem processada e enviada com AI Robusta',
        aiResponse,
        sendResult
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Falha ao processar mensagem com AI Robusta'
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

/**
 * Processa mensagem recebida do WhatsApp usando AI Robusta
 * @param {object} message - Mensagem recebida do webhook
 * @param {string} clinicId - ID da clínica
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} - Resposta processada pela AI Robusta
 */
async function processMessageWithAIRobust(message, clinicId, userId) {
  try {
    // Extrair texto da mensagem
    const messageText = message.text?.body || message.message || '';
    
    if (!messageText) {
      console.log('[AI-Robusta] Mensagem sem texto, ignorando');
      return null;
    }

    console.log(`[AI-Robusta] Processando mensagem: "${messageText}"`);

    // Usar LLMOrchestratorService diretamente
    const { LLMOrchestratorService } = await import('../src/services/ai/llmOrchestratorService.js');
    
    const request = {
      phoneNumber: message.from,
      message: messageText,
      conversationId: `whatsapp-${message.from}-${Date.now()}`,
      userId: userId
    };

    console.log('[AI-Robusta] Chamando LLMOrchestratorService...');
    const response = await LLMOrchestratorService.processMessage(request);

    console.log(`[AI-Robusta] Resposta AI gerada:`, {
      response: response.response,
      intent: response.intent?.name,
      toolsUsed: response.toolsUsed
    });

    return {
      text: response.response,
      confidence: 0.9,
      modelUsed: 'llm-orchestrator',
      medicalContent: false,
      intent: response.intent?.name,
      toolsUsed: response.toolsUsed
    };

  } catch (error) {
    console.error('[AI-Robusta] Erro ao processar com AI:', error.message);
    console.error('Stack:', error.stack);
    
    // Resposta de fallback
    return {
      text: 'Olá! Como posso ajudá-lo hoje?',
      confidence: 0,
      modelUsed: 'fallback',
      medicalContent: false,
      error: true
    };
  }
}

/**
 * Envia resposta processada pela AI Robusta via WhatsApp
 * @param {string} to - Número do destinatário
 * @param {object} aiResponse - Resposta da AI
 * @param {object} config - Configuração do WhatsApp
 */
async function sendAIResponseViaWhatsApp(to, aiResponse, config) {
  try {
    const { accessToken, phoneNumberId } = config;
    
    // Preparar mensagem com informações da AI Robusta
    let messageText = aiResponse.text;
    
    // Adicionar informações de confiança se baixa
    if (aiResponse.confidence < 0.7) {
      messageText += '\n\n💡 Nota: Esta resposta foi gerada com confiança moderada. Para informações mais precisas, consulte um profissional de saúde.';
    }
    
    // Adicionar aviso de conteúdo médico se aplicável
    if (aiResponse.medicalContent) {
      messageText += '\n\n⚠️ Aviso: Esta informação não substitui consulta médica.';
    }

    // Enviar via API Meta
    const response = await sendWhatsAppTextMessage({
      accessToken,
      phoneNumberId,
      to,
      text: messageText
    });

    console.log('[AI-Robusta] Mensagem enviada via WhatsApp:', {
      to,
      messageLength: messageText.length,
      confidence: aiResponse.confidence,
      modelUsed: aiResponse.modelUsed,
      intent: aiResponse.intent
    });

    return {
      success: true,
      messageId: response.messages?.[0]?.id,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[AI-Robusta] Erro ao enviar mensagem:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Processa webhook do WhatsApp com AI Robusta
 * @param {object} webhookData - Dados do webhook
 * @param {string} clinicId - ID da clínica
 * @param {string} userId - ID do usuário
 * @param {object} whatsappConfig - Configuração do WhatsApp
 */
async function processWhatsAppWebhookRobust(webhookData, clinicId, userId, whatsappConfig) {
  try {
    const processed = [];
    
    for (const entry of webhookData.entry) {
      for (const change of entry.changes) {
        if (change.value.messages && change.value.messages.length > 0) {
          for (const message of change.value.messages) {
            console.log(`[AI-Robusta] Processando mensagem de ${message.from}`);
            
            // Processar com AI Robusta
            const aiResponse = await processMessageWithAIRobust(
              message,
              clinicId,
              userId
            );

            if (aiResponse && !aiResponse.error) {
              // Enviar resposta via WhatsApp
              const sendResult = await sendAIResponseViaWhatsApp(
                message.from,
                aiResponse,
                whatsappConfig
              );

              processed.push({
                from: message.from,
                messageId: message.id,
                aiResponse: aiResponse.text,
                confidence: aiResponse.confidence,
                modelUsed: aiResponse.modelUsed,
                intent: aiResponse.intent,
                toolsUsed: aiResponse.toolsUsed,
                sendResult
              });

              console.log(`[AI-Robusta] Mensagem processada e enviada para ${message.from}`);
            } else {
              console.error(`[AI-Robusta] Erro ao processar mensagem de ${message.from}`);
            }
          }
        }
      }
    }

    return {
      success: true,
      processed
    };

  } catch (error) {
    console.error('[AI-Robusta] Erro no processamento do webhook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default router; 