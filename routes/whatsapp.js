const express = require('express');
const { sendWhatsAppTextMessage } = require('../services/whatsappMetaService');
const router = express.Router();

// Envio real de mensagem via API oficial da Meta
router.post('/send-message', async (req, res) => {
  const { to, message, accessToken, phoneNumberId } = req.body;
  // Usar do .env se não vier no body
  const token = accessToken || process.env.WHATSAPP_META_ACCESS_TOKEN;
  const phoneId = phoneNumberId || process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  if (!to || !message || !token || !phoneId) {
    return res.status(400).json({ error: 'to, message, accessToken e phoneNumberId são obrigatórios (pode ser via .env)' });
  }
  try {
    const response = await sendWhatsAppTextMessage({ accessToken: token, phoneNumberId: phoneId, to, text: message });
    res.json({ success: true, response });
  } catch (error) {
    console.error('Erro ao enviar mensagem via API Meta:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 