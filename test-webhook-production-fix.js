// ========================================
// TESTE DO WEBHOOK DE PRODUÇÃO
// Simula uma mensagem de agendamento no webhook
// ========================================

import { processWhatsAppWebhookFinal } from './routes/webhook-final.js';

async function testWebhookProduction() {
  console.log('🧪 [Teste Webhook] Iniciando teste do webhook de produção...');
  
  try {
    // Simular dados do webhook do WhatsApp
    const webhookData = {
      entry: [
        {
          id: '123456789',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+5547999999999',
                  phone_number_id: '698766983327246'
                },
                contacts: [
                  {
                    profile: {
                      name: 'Teste Usuário'
                    },
                    wa_id: '5547999999999'
                  }
                ],
                messages: [
                  {
                    from: '5547999999999',
                    id: 'wamid.test123',
                    timestamp: '1234567890',
                    type: 'text',
                    text: {
                      body: 'Quero agendar uma consulta de cardiologia'
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    // Configuração do WhatsApp
    const whatsappConfig = {
      accessToken: process.env.WHATSAPP_META_ACCESS_TOKEN || 'test_token',
      phoneNumberId: process.env.WHATSAPP_META_PHONE_NUMBER_ID || '698766983327246'
    };

    console.log('📤 [Teste Webhook] Processando webhook simulado...');
    console.log('📋 [Teste Webhook] Dados do webhook:', {
      hasEntry: !!webhookData.entry,
      entryLength: webhookData.entry?.length || 0,
      hasMessages: !!webhookData.entry?.[0]?.changes?.[0]?.value?.messages,
      messageCount: webhookData.entry?.[0]?.changes?.[0]?.value?.messages?.length || 0
    });

    // Processar webhook
    const result = await processWhatsAppWebhookFinal(webhookData, whatsappConfig);

    if (result.success) {
      console.log('✅ [Teste Webhook] Webhook processado com sucesso');
      console.log('📊 [Teste Webhook] Mensagens processadas:', result.processed?.length || 0);
      
      if (result.processed && result.processed.length > 0) {
        const processedMessage = result.processed[0];
        console.log('📝 [Teste Webhook] Resposta gerada:', processedMessage.response?.substring(0, 100) + '...');
        console.log('🎯 [Teste Webhook] Intenção detectada:', processedMessage.intent);
        console.log('📈 [Teste Webhook] Confiança:', processedMessage.confidence);
      }
    } else {
      console.log('❌ [Teste Webhook] Falha no processamento do webhook');
      console.log('💥 [Teste Webhook] Erro:', result.error);
      return false;
    }

    console.log('\n🎉 [Teste Webhook] Teste do webhook concluído com sucesso!');
    return true;

  } catch (error) {
    console.error('💥 [Teste Webhook] Erro durante o teste:', error);
    console.error('📋 [Teste Webhook] Stack trace:', error.stack);
    return false;
  }
}

// Executar teste se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  testWebhookProduction()
    .then(success => {
      if (success) {
        console.log('\n✅ [Teste Webhook] Webhook está funcionando corretamente em produção!');
        process.exit(0);
      } else {
        console.log('\n❌ [Teste Webhook] Webhook tem problemas!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 [Teste Webhook] Erro fatal no teste:', error);
      process.exit(1);
    });
}

export { testWebhookProduction };
