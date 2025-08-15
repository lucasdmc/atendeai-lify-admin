// Teste que simula exatamente o que acontece no webhook em produção
import fetch from 'node-fetch';

async function testProductionWebhook() {
  try {
    console.log('🧪 Testando webhook em produção...');
    
    // Simular exatamente o webhook do WhatsApp
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
    
    console.log('📤 Enviando para produção...');
    const response = await fetch('https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });
    
    const responseText = await response.text();
    console.log('📥 Resposta:', responseText);
    
    if (response.ok) {
      const responseData = JSON.parse(responseText);
      
      if (responseData.processed && responseData.processed.length > 0) {
        const processed = responseData.processed[0];
        
        console.log('\n📋 Análise da resposta:');
        console.log('  - Intent:', processed.intent?.name);
        console.log('  - Confidence:', processed.intent?.confidence);
        console.log('  - Response:', processed.response);
        
        if (processed.response.includes('não foi possível carregar')) {
          console.log('\n❌ PROBLEMA: Dados da clínica não foram carregados em produção');
          console.log('📋 Isso indica que o problema está no carregamento dos dados no servidor Railway');
        } else {
          console.log('\n✅ SUCESSO: Webhook funcionando corretamente');
        }
      }
    } else {
      console.log('❌ Erro na resposta:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testProductionWebhook();
