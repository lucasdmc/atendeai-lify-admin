// Script de teste para simular uma mensagem real do WhatsApp
import fetch from 'node-fetch';

const WEBHOOK_URL = 'https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta';

// Teste de webhook com mensagem de agendamento
const webhookData = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "742991528315493",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "554730915628",
              "phone_number_id": "698766983327246"
            },
            "messages": [
              {
                "from": "554797192447",
                "id": "wamid.HBgMNTU0Nzk3MTkyNDQ3FQIAERgSNkMyMUU2Q0YyMEJENTQxRUM5AA==",
                "timestamp": "1754583313",
                "text": {
                  "body": "Gostaria de realizar um agendamento"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
};

async function testWebhook() {
  try {
    console.log('🧪 Testando webhook com mensagem de agendamento...');
    console.log('📤 Enviando para:', WEBHOOK_URL);
    console.log('📝 Mensagem:', JSON.stringify(webhookData, null, 2));

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });

    const responseText = await response.text();
    
    console.log('📥 Resposta do webhook:');
    console.log('Status:', response.status);
    console.log('Body:', responseText);

    if (response.ok) {
      console.log('✅ Teste concluído com sucesso!');
    } else {
      console.log('❌ Teste falhou com status:', response.status);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testWebhook(); 