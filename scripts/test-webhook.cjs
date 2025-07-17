// Script para testar se a Edge Function está funcionando

const WEBHOOK_URL = 'https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/webhook';

async function testWebhook() {
  console.log('🧪 TESTANDO WEBHOOK');
  console.log('=' .repeat(40));
  
  const testData = {
    agentId: '36e62010-e74a-4eaa-b1f7-4037d4721b81', // Agente "Teste final 1"
    connectionId: '36e62010-e74a-4eaa-b1f7-4037d4721b81',
    phoneNumber: '5547999528232@c.us', // Número correto
    contactName: 'Lucas Cantoni',
    message: 'Teste de mensagem',
    messageType: 'received',
    messageId: 'test_message_123',
    timestamp: Date.now()
  };

  console.log('📤 Enviando dados de teste:');
  console.log(JSON.stringify(testData, null, 2));
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || 'test'}`
      },
      body: JSON.stringify(testData)
    });

    console.log(`\n📥 Resposta do webhook:`);
    console.log(`Status: ${response.status}`);
    console.log(`Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log(`Body: ${responseText}`);
    
    if (response.ok) {
      console.log('\n✅ Webhook funcionando corretamente!');
    } else {
      console.log('\n❌ Erro no webhook');
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao testar webhook:', error.message);
  }
}

// Executar teste
testWebhook().catch(console.error); 