import fetch from 'node-fetch';

async function testWebhookUrl() {
  console.log('🧪 TESTANDO URL DO WEBHOOK');
  console.log('===========================');

  // Você precisa substituir esta URL pela URL real do seu Railway
  const webhookUrl = 'https://seu-app.railway.app/webhook/whatsapp-meta';
  
  console.log('🔍 Testando URL:', webhookUrl);
  
  try {
    // Teste 1: Verificação GET (challenge)
    console.log('\n1️⃣ Testando verificação GET...');
    const getResponse = await fetch(`${webhookUrl}?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=atendeai-lify-backend`);
    
    console.log('Status GET:', getResponse.status);
    console.log('Headers GET:', Object.fromEntries(getResponse.headers.entries()));
    
    if (getResponse.ok) {
      const getText = await getResponse.text();
      console.log('Resposta GET:', getText);
    }

    // Teste 2: Verificação POST (challenge)
    console.log('\n2️⃣ Testando verificação POST...');
    const postResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'subscribe',
        'hub.challenge': 'test123',
        'hub.verify_token': 'atendeai-lify-backend'
      })
    });
    
    console.log('Status POST:', postResponse.status);
    console.log('Headers POST:', Object.fromEntries(postResponse.headers.entries()));
    
    if (postResponse.ok) {
      const postText = await postResponse.text();
      console.log('Resposta POST:', postText);
    }

    // Teste 3: Mensagem simulada
    console.log('\n3️⃣ Testando mensagem simulada...');
    const messageResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
          id: '123456789',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '554730915628',
                phone_number_id: '123456789'
              },
              contacts: [{
                profile: {
                  name: 'Lucas Cantoni'
                },
                wa_id: '5547997192447'
              }],
              messages: [{
                from: '5547997192447',
                id: 'test-message-id',
                timestamp: Math.floor(Date.now() / 1000),
                type: 'text',
                text: {
                  body: 'Teste de webhook'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      })
    });
    
    console.log('Status Mensagem:', messageResponse.status);
    console.log('Headers Mensagem:', Object.fromEntries(messageResponse.headers.entries()));
    
    if (messageResponse.ok) {
      const messageText = await messageResponse.text();
      console.log('Resposta Mensagem:', messageText);
    }

    console.log('\n📊 RESULTADO DOS TESTES:');
    console.log('=========================');
    
    if (getResponse.ok && postResponse.ok) {
      console.log('✅ Webhook está respondendo corretamente');
      console.log('✅ Verificação GET e POST funcionando');
      console.log('✅ URL do webhook está correta');
    } else {
      console.log('❌ Webhook não está respondendo');
      console.log('❌ Verifique a URL e configuração');
    }

  } catch (error) {
    console.error('💥 Erro ao testar webhook:', error.message);
    console.log('❌ Webhook não está acessível');
    console.log('🔧 Verifique:');
    console.log('   1. URL do Railway está correta');
    console.log('   2. Railway está rodando');
    console.log('   3. Domínio está configurado');
  }
}

testWebhookUrl(); 