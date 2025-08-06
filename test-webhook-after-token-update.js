import axios from 'axios';

// URL do webhook no Railway
const RAILWAY_WEBHOOK_URL = 'https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta';

// Dados de teste do webhook
const webhookTestData = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '698766983327246',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '+55 47 3091-5628',
              phone_number_id: '698766983327246'
            },
            contacts: [
              {
                profile: {
                  name: 'Teste Token'
                },
                wa_id: '5511999999999'
              }
            ],
            messages: [
              {
                from: '5511999999999',
                id: 'wamid.test.token',
                timestamp: '1704067200',
                type: 'text',
                text: {
                  body: 'Teste após atualização do token'
                }
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
};

async function testWebhookAfterTokenUpdate() {
  console.log('🧪 Testando webhook após atualização do token...');
  console.log('🌐 URL do webhook:', RAILWAY_WEBHOOK_URL);
  
  try {
    // Teste 1: Verificar se o webhook está respondendo
    console.log('\n1️⃣ Testando resposta do webhook...');
    const response = await axios.post(RAILWAY_WEBHOOK_URL, webhookTestData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Bot-Test'
      },
      timeout: 10000
    });
    
    console.log('✅ Webhook respondeu com sucesso!');
    console.log('📋 Status:', response.status);
    console.log('📋 Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro no teste do webhook:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('🔍 O token ainda pode estar sendo atualizado no Railway.');
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('🔍 O serviço pode estar reiniciando após a atualização.');
    }
  }
}

// Executar teste
testWebhookAfterTokenUpdate(); 