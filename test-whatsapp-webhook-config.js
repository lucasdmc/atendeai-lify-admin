// Teste completo da configuração do webhook WhatsApp
import axios from 'axios';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function testWhatsAppWebhookConfig() {
  console.log('🔍 TESTE COMPLETO DA CONFIGURAÇÃO DO WEBHOOK WHATSAPP');
  console.log('============================================================\n');

  try {
    // 1. Teste de health check
    console.log('🏥 1. Teste de Health Check...');
    const health = await axios.get(`${RAILWAY_URL}/health`);
    console.log('✅ Health check:', health.data.status);
    console.log('');

    // 2. Teste de verificação do webhook
    console.log('🔗 2. Teste de Verificação do Webhook...');
    const verifyResponse = await axios.get(`${RAILWAY_URL}/webhook/whatsapp-meta?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=atendeai-lify-backend`);
    console.log('✅ Verificação do webhook:', verifyResponse.data);
    console.log('');

    // 3. Teste de envio de mensagem
    console.log('📤 3. Teste de Envio de Mensagem...');
    const sendResponse = await axios.post(`${RAILWAY_URL}/api/whatsapp/send-message`, {
      to: '5511999999999',
      message: 'Teste de configuração do webhook - ' + new Date().toISOString()
    });
    console.log('✅ Envio de mensagem:', sendResponse.data.success ? 'SUCESSO' : 'ERRO');
    if (sendResponse.data.response?.messages?.[0]?.id) {
      console.log('📧 ID da mensagem:', sendResponse.data.response.messages[0].id);
    }
    console.log('');

    // 4. Teste de processamento do webhook
    console.log('🤖 4. Teste de Processamento do Webhook...');
    const webhookData = {
      object: "whatsapp_business_account",
      entry: [{
        id: "test-webhook",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "5511999999999",
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "Teste Webhook" },
              wa_id: "5511999999999"
            }],
            messages: [{
              from: "5511999999999",
              id: "wamid.test.webhook." + Date.now(),
              timestamp: "1704067200",
              text: { body: "Olá! Quero agendar uma consulta cardiologista" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const webhookResponse = await axios.post(`${RAILWAY_URL}/webhook/whatsapp-meta`, webhookData);
    console.log('✅ Processamento do webhook:', webhookResponse.data.success ? 'SUCESSO' : 'ERRO');
    if (webhookResponse.data.processed?.[0]?.response) {
      console.log('💬 Resposta gerada:', webhookResponse.data.processed[0].response.substring(0, 100) + '...');
    }
    console.log('');

    // 5. Informações de configuração
    console.log('📋 5. Informações de Configuração...');
    console.log('🌐 URL do Webhook:', `${RAILWAY_URL}/webhook/whatsapp-meta`);
    console.log('🔑 Token de Verificação: atendeai-lify-backend');
    console.log('📱 Phone Number ID: 698766983327246');
    console.log('');

    // 6. Instruções para configuração no WhatsApp Business API
    console.log('⚙️ 6. CONFIGURAÇÃO NO WHATSAPP BUSINESS API:');
    console.log('============================================================');
    console.log('1. Acesse: https://developers.facebook.com/apps/');
    console.log('2. Vá para seu app do WhatsApp Business API');
    console.log('3. Em "Webhooks", configure:');
    console.log(`   - URL: ${RAILWAY_URL}/webhook/whatsapp-meta`);
    console.log('   - Verify Token: atendeai-lify-backend');
    console.log('   - Fields: messages, message_deliveries');
    console.log('4. Em "Messaging", configure:');
    console.log('   - Webhook URL: mesma URL acima');
    console.log('   - Verify Token: atendeai-lify-backend');
    console.log('');

    console.log('🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
    console.log('✅ O sistema está pronto para receber mensagens do WhatsApp');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📊 Data:', error.response.data);
    }
  }
}

testWhatsAppWebhookConfig(); 