// ========================================
// SERVIÇO AI-WHATSAPP INTEGRADO
// ========================================

const axios = require('axios');
const { sendWhatsAppTextMessage } = require('./whatsappMetaService');

/**
 * Processa mensagem recebida do WhatsApp usando AI
 * @param {object} message - Mensagem recebida do webhook
 * @param {string} clinicId - ID da clínica
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} - Resposta processada pela AI
 */
async function processMessageWithAI(message, clinicId, userId) {
  try {
    // Extrair texto da mensagem
    const messageText = message.text?.body || message.message || '';
    
    if (!messageText) {
      console.log('[AI-WhatsApp] Mensagem sem texto, ignorando');
      return null;
    }

    console.log(`[AI-WhatsApp] Processando mensagem: "${messageText}"`);

    // Chamar API AI para processar a mensagem
    const aiResponse = await axios.post('http://localhost:3001/api/ai/process', {
      message: messageText,
      clinicId: clinicId,
      userId: userId,
      sessionId: `whatsapp-${message.from}`,
      options: {
        enableMedicalValidation: true,
        enableEmotionAnalysis: true,
        enableProactiveSuggestions: true,
        enableCache: true,
        enableStreaming: false // WhatsApp não suporta streaming
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (aiResponse.data.success) {
      const aiData = aiResponse.data.data;
      
      console.log(`[AI-WhatsApp] Resposta AI gerada:`, {
        response: aiData.response,
        confidence: aiData.confidence,
        modelUsed: aiData.modelUsed,
        medicalContent: aiData.medicalContent
      });

      return {
        text: aiData.response,
        confidence: aiData.confidence,
        modelUsed: aiData.modelUsed,
        medicalContent: aiData.medicalContent,
        emotion: aiData.emotion,
        processingTime: aiData.processingTime
      };
    } else {
      console.error('[AI-WhatsApp] Erro na API AI:', aiResponse.data.error);
      return {
        text: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.',
        confidence: 0,
        modelUsed: 'fallback',
        medicalContent: false,
        error: true
      };
    }

  } catch (error) {
    console.error('[AI-WhatsApp] Erro ao processar com AI:', error.message);
    
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
 * Envia resposta processada pela AI via WhatsApp
 * @param {string} to - Número do destinatário
 * @param {object} aiResponse - Resposta da AI
 * @param {object} config - Configuração do WhatsApp
 */
async function sendAIResponseViaWhatsApp(to, aiResponse, config) {
  try {
    const { accessToken, phoneNumberId } = config;
    
    // Preparar mensagem com informações da AI
    let messageText = aiResponse.text;
    
    // Adicionar informações de debug (opcional)
    if (process.env.NODE_ENV === 'development') {
      messageText += `\n\n[Debug: ${aiResponse.modelUsed} | Confiança: ${Math.round(aiResponse.confidence * 100)}%]`;
    }

    // Enviar via WhatsApp
    const response = await sendWhatsAppTextMessage({
      accessToken,
      phoneNumberId,
      to,
      text: messageText
    });

    console.log(`[AI-WhatsApp] Resposta enviada para ${to}:`, {
      messageId: response.messages?.[0]?.id,
      modelUsed: aiResponse.modelUsed,
      confidence: aiResponse.confidence
    });

    return response;

  } catch (error) {
    console.error('[AI-WhatsApp] Erro ao enviar resposta:', error.message);
    throw error;
  }
}

/**
 * Processa webhook do WhatsApp com AI
 * @param {object} webhookData - Dados do webhook
 * @param {string} clinicId - ID da clínica
 * @param {string} userId - ID do usuário
 * @param {object} whatsappConfig - Configuração do WhatsApp
 */
async function processWhatsAppWebhook(webhookData, clinicId, userId, whatsappConfig) {
  try {
    console.log('[AI-WhatsApp] Processando webhook:', {
      clinicId,
      userId,
      webhookType: webhookData.entry?.[0]?.changes?.[0]?.value?.object
    });

    const entry = webhookData.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Verificar se é uma mensagem
    if (value?.object === 'whatsapp_business_account' && value?.messages) {
      for (const message of value.messages) {
        console.log(`[AI-WhatsApp] Processando mensagem de ${message.from}`);

        // Processar com AI
        const aiResponse = await processMessageWithAI(message, clinicId, userId);
        
        if (aiResponse) {
          // Enviar resposta via WhatsApp
          await sendAIResponseViaWhatsApp(message.from, aiResponse, whatsappConfig);
        }
      }
    }

    return { success: true, processed: true };

  } catch (error) {
    console.error('[AI-WhatsApp] Erro no processamento do webhook:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Testa conectividade da AI
 * @returns {Promise<object>} - Status da conectividade
 */
async function testAIConnectivity() {
  try {
    const response = await axios.get('http://localhost:3001/api/ai/test-connection');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Obtém estatísticas da AI
 * @param {string} clinicId - ID da clínica
 * @returns {Promise<object>} - Estatísticas
 */
async function getAIStats(clinicId) {
  try {
    const response = await axios.get(`http://localhost:3001/api/ai/stats?clinicId=${clinicId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  processMessageWithAI,
  sendAIResponseViaWhatsApp,
  processWhatsAppWebhook,
  testAIConnectivity,
  getAIStats
}; 