import axios from 'axios';

/**
 * Envia uma mensagem de texto usando a API oficial do WhatsApp Business (Meta)
 * @param {string} accessToken - Token de acesso da API Meta
 * @param {string} phoneNumberId - ID do número de telefone provisionado na Meta
 * @param {string} to - Número do destinatário (formato internacional, ex: 5511999999999)
 * @param {string} text - Mensagem de texto a ser enviada
 * @returns {Promise<any>} - Resposta da API Meta
 */
export async function sendWhatsAppTextMessage({ accessToken, phoneNumberId, to, text }: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  text: string;
}) {
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