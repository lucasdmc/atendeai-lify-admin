// ========================================
// TESTE DO TOKEN ATUAL DO WHATSAPP
// ========================================

import dotenv from 'dotenv';
import axios from 'axios';

// Carregar variáveis do .env
dotenv.config();

const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;

console.log('🔍 Testando token atual do WhatsApp...');
console.log('Token (primeiros 20 chars):', accessToken?.substring(0, 20) + '...');
console.log('Phone Number ID:', phoneNumberId);

async function testWhatsAppToken() {
  try {
    // Teste 1: Verificar informações da conta
    console.log('\n📞 Teste 1: Verificando informações da conta...');
    const accountResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Conta verificada:', accountResponse.data);
    
    // Teste 2: Tentar enviar uma mensagem de teste
    console.log('\n📤 Teste 2: Tentando enviar mensagem de teste...');
    const messageResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '554797192447', // Seu número de teste
        type: 'text',
        text: {
          body: '🔧 Teste de token - ' + new Date().toISOString()
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Mensagem enviada com sucesso:', messageResponse.data);
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.error('🚨 TOKEN EXPIRADO OU INVÁLIDO!');
      console.error('Detalhes:', error.response.data);
    }
  }
}

testWhatsAppToken(); 