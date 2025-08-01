// ========================================
// TESTE SIMPLES DO TOKEN WHATSAPP
// ========================================

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

console.log('🔑 TESTE SIMPLES DO TOKEN WHATSAPP');
console.log('==================================');

// Importar função de envio do WhatsApp
const { sendWhatsAppTextMessage } = await import('./services/whatsappMetaService.js');

try {
  console.log('📤 Enviando mensagem de teste...');
  
  const messageData = {
    accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID,
    to: '5547997192447',
    text: '🔑 Teste do novo token - Se você recebeu esta mensagem, o token está funcionando!'
  };

  console.log('Token usado:', process.env.WHATSAPP_META_ACCESS_TOKEN?.substring(0, 20) + '...');
  console.log('Phone ID:', process.env.WHATSAPP_META_PHONE_NUMBER_ID);
  
  const response = await sendWhatsAppTextMessage(messageData);
  
  console.log('✅ Mensagem enviada com sucesso!');
  console.log('Message ID:', response.messages?.[0]?.id);
  console.log('Status:', response.status);
  
} catch (error) {
  console.error('❌ Erro ao enviar mensagem:', error.message);
  console.error('Stack:', error.stack);
} 