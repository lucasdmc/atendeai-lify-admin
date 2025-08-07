// Script de teste para simular uma mensagem real do WhatsApp
import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta';

// Simular uma mensagem real do WhatsApp
const mockMessage = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '742991528315493',
      changes: [
        {
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '554730915628',
              phone_number_id: '698766983327246'
            },
            messages: [
              {
                from: '554797192447',
                id: 'wamid.HBgMNTU0Nzk3MTkyNDQ3FQIAERgSNkMyMUU2Q0YyMEJENTQxRUM5AA==',
                timestamp: '1754583313',
                text: {
                  body: 'oi'
                },
                type: 'text'
              }
            ]
          },
          field: 'messages'
        }
      ]
    }
  ]
};

async function testWebhook() {
  try {
    console.log('🧪 Testando webhook com mensagem simulada...');
    console.log('📤 Enviando para:', WEBHOOK_URL);
    console.log('📝 Mensagem:', JSON.stringify(mockMessage, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'facebookexternalua'
      },
      body: JSON.stringify(mockMessage)
    });

    const responseText = await response.text();
    console.log('📥 Resposta do webhook:');
    console.log('Status:', response.status);
    console.log('Body:', responseText);

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testWebhook(); 