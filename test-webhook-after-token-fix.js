import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

async function testWebhookAfterTokenFix() {
  console.log('🧪 TESTE: Verificando webhook após correção do token');
  
  try {
    // Simular um webhook do WhatsApp
    const webhookData = {
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
                contacts: [
                  {
                    profile: {
                      name: 'Lucas Cantoni'
                    },
                    wa_id: '554797192447'
                  }
                ],
                messages: [
                  {
                    from: '554797192447',
                    id: 'wamid.HBgMNTU0Nzk3MTkyNDQ3FQIAERgSNkU4OEExMjQzRjA1QzgxOTM1AA==',
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    text: {
                      body: 'Teste após correção do token'
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

    console.log('📝 Enviando webhook para o Railway...');
    
    const response = await axios.post('https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta', webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'facebookexternalua'
      }
    });
    
    console.log('✅ Webhook processado com sucesso!');
    console.log('Status:', response.status);
    console.log('Resposta:', response.data);
    
  } catch (error) {
    console.error('❌ Erro ao testar webhook:', error.response?.data || error.message);
    
    if (error.response?.status) {
      console.log('Status do erro:', error.response.status);
      console.log('Headers:', error.response.headers);
    }
  }
}

// Executar teste
testWebhookAfterTokenFix().then(() => {
  console.log('\n✅ Teste concluído!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
}); 