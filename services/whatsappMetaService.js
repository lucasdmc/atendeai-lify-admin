const axios = require('axios');

/**
 * Envia uma mensagem de texto usando a API oficial do WhatsApp Business (Meta)
 * @param {string} accessToken - Token de acesso da API Meta
 * @param {string} phoneNumberId - ID do número de telefone provisionado na Meta
 * @param {string} to - Número do destinatário (formato internacional, ex: 5511999999999)
 * @param {string} text - Mensagem de texto a ser enviada
 * @returns {Promise<any>} - Resposta da API Meta
 */
async function sendWhatsAppTextMessage({ accessToken, phoneNumberId, to, text }) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text }
  };
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  const response = await axios.post(url, payload, { headers });
  return response.data;
}

/**
 * Envia uma mensagem de mídia (imagem, documento, etc) via API oficial da Meta
 * @param {string} accessToken
 * @param {string} phoneNumberId
 * @param {string} to
 * @param {string} mediaId - ID do arquivo já enviado para o servidor da Meta
 * @param {string} type - Tipo de mídia ('image', 'document', etc)
 * @param {string} caption - (opcional) legenda
 */
async function sendWhatsAppMediaMessage({ accessToken, phoneNumberId, to, mediaId, type, caption }) {
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type,
    [type]: {
      id: mediaId,
      ...(caption ? { caption } : {})
    }
  };
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  const response = await axios.post(url, payload, { headers });
  return response.data;
}

/**
 * Processa mensagens recebidas do webhook da Meta (stub para lógica futura)
 * @param {object} message - Objeto da mensagem recebida
 */
function processReceivedMessage(message) {
  // Aqui você pode implementar lógica de IA, respostas automáticas, etc.
  console.log('[MetaService] Mensagem recebida para processamento:', message);
  // Exemplo: se quiser responder automaticamente, pode chamar sendWhatsAppTextMessage aqui
}

module.exports = {
  sendWhatsAppTextMessage,
  sendWhatsAppMediaMessage,
  processReceivedMessage
}; 