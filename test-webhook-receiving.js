import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const RAILWAY_WEBHOOK_URL = process.env.RAILWAY_WEBHOOK_URL || 'https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta';

async function testWebhookReceiving() {
  console.log('🧪 TESTANDO SE O WEBHOOK ESTÁ RECEBENDO MENSAGENS');
  console.log('==================================================');
  
  // Simular uma mensagem real do WhatsApp
  const testWebhookData = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: '698766983327246',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '554730915628',
                phone_number_id: '698766983327246'
              },
              contacts: [
                {
                  profile: {
                    name: 'Lucas Cantoni'
                  },
                  wa_id: '5547997192447'
                }
              ],
              messages: [
                {
                  from: '5547997192447',
                  id: 'wamid.HBgNNTU0Nzk5NzE5MjQ0N1U...',
                  timestamp: Math.floor(Date.now() / 1000),
                  type: 'text',
                  text: {
                    body: 'TESTE REAL - Esta é uma mensagem de teste real'
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

  try {
    console.log('📤 Enviando mensagem de teste para o webhook...');
    console.log('URL:', RAILWAY_WEBHOOK_URL);
    console.log('Dados:', JSON.stringify(testWebhookData, null, 2));
    
    const response = await axios.post(RAILWAY_WEBHOOK_URL, testWebhookData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Webhook respondeu com sucesso!');
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);

  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('🔍 Webhook não encontrado - verificar URL');
    } else if (error.response?.status === 500) {
      console.log('🔍 Erro interno do servidor - verificar logs');
    }
  }
}

testWebhookReceiving(); 