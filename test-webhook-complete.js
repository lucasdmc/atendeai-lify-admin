// Teste completo do webhook
import dotenv from 'dotenv';
import { processWhatsAppWebhookWithContext } from './routes/webhook-contextualized.js';

// Carregar variáveis de ambiente
dotenv.config();

async function testWebhookComplete() {
  try {
    console.log('🧪 Testando webhook completo...');
    
    // Simular dados do webhook do WhatsApp
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
                "contacts": [
                  {
                    "profile": {
                      "name": "Lucas Cantoni"
                    },
                    "wa_id": "554797192447"
                  }
                ],
                "messages": [
                  {
                    "from": "554797192447",
                    "id": "wamid.HBgMNTU0Nzk3MTkyNDQ3FQIAEhgUM0E0NDY0RTQzQzQ4NkJBOEIyODIA",
                    "timestamp": "1754340343",
                    "text": {
                      "body": "oi"
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

    // Configuração do WhatsApp
    const whatsappConfig = {
      accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN,
      phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID
    };

    console.log('📤 Enviando dados do webhook:', {
      hasAccessToken: !!whatsappConfig.accessToken,
      hasPhoneNumberId: !!whatsappConfig.phoneNumberId,
      messageCount: webhookData.entry[0].changes[0].value.messages.length
    });
    
    const result = await processWhatsAppWebhookWithContext(webhookData, whatsappConfig);
    
    console.log('✅ Resultado do webhook:', {
      success: result.success,
      processed: result.processed?.length || 0,
      error: result.error
    });

    if (result.processed && result.processed.length > 0) {
      console.log('📝 Mensagens processadas:');
      result.processed.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.phoneNumber}: "${item.message}" -> "${item.response}"`);
      });
    }

    return result;
    
  } catch (error) {
    console.error('❌ Erro no teste do webhook:', error);
    throw error;
  }
}

// Executar teste
testWebhookComplete()
  .then(result => {
    console.log('🎉 Teste do webhook concluído com sucesso!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Teste do webhook falhou:', error);
    process.exit(1);
  }); 