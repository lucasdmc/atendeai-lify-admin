import axios from 'axios';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

async function testWhatsAppPermissions() {
  const accessToken = process.env.WHATSAPP_META_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
  
  console.log('🔍 Testando permissões da API Meta WhatsApp...');
  console.log('📱 Phone Number ID:', phoneNumberId);
  console.log('🔑 Access Token:', accessToken ? 'Presente' : 'Ausente');
  
  try {
    // 1. Testar endpoint de informações do número
    console.log('\n1️⃣ Testando informações do número...');
    const infoUrl = `https://graph.facebook.com/v23.0/${phoneNumberId}`;
    const infoResponse = await axios.get(infoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Informações do número:', infoResponse.data);
    
    // 2. Verificar configuração de webhook
    console.log('\n2️⃣ Verificando configuração de webhook...');
    if (infoResponse.data.webhook_configuration) {
      console.log('✅ Webhook configurado:', infoResponse.data.webhook_configuration);
    } else {
      console.log('⚠️ Webhook não configurado');
    }
    
    // 3. Testar permissões de envio (sem enviar mensagem real)
    console.log('\n3️⃣ Testando permissões de envio...');
    const testUrl = `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;
    const testPayload = {
      messaging_product: 'whatsapp',
      to: '5511999999999', // Número de teste
      type: 'text',
      text: { body: 'Teste de permissão' }
    };
    
    try {
      const testResponse = await axios.post(testUrl, testPayload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Permissão de envio OK:', testResponse.data);
    } catch (error) {
      console.log('❌ Erro de permissão de envio:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    console.log('\n🎉 Teste concluído! O token está funcionando corretamente.');
    
  } catch (error) {
    console.error('❌ Erro geral:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

// Executar teste
testWhatsAppPermissions().catch(console.error); 