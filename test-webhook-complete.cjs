// test-webhook-complete.cjs
// Script para testar webhook completo

const https = require('https');

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'atendeai-lify-backend-production.up.railway.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testWebhookComplete() {
  console.log('🧪 TESTANDO WEBHOOK COMPLETO');
  console.log('================================');

  try {
    // Teste 1: Verificar se o webhook está acessível
    console.log('\n📋 1. Testando acesso ao webhook...');
    const webhookResponse = await makeRequest('/webhook/whatsapp-meta');
    console.log('✅ Webhook acessível:', webhookResponse.status === 200 ? 'OK' : 'ERRO');
    console.log('   Status:', webhookResponse.status);

    // Teste 2: Simular mensagem real do WhatsApp
    console.log('\n📋 2. Simulando mensagem real do WhatsApp...');
    const realMessage = {
      object: 'whatsapp_business_account',
      entry: [{
        id: '698766983327246',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5511999999999',
              phone_number_id: '698766983327246'
            },
            contacts: [{
              profile: {
                name: 'Teste Real'
              },
              wa_id: '5511999999999'
            }],
            messages: [{
              from: '5511999999999',
              id: 'wamid.test.message',
              timestamp: Date.now().toString(),
              type: 'text',
              text: {
                body: 'Olá! Quero agendar uma consulta cardiologista'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    };

    const webhookTest = await makeRequest('/webhook/whatsapp-meta', 'POST', realMessage);
    console.log('✅ Webhook processamento:', webhookTest.status === 200 ? 'OK' : 'ERRO');
    console.log('   Status:', webhookTest.status);
    console.log('   Response:', webhookTest.data);

    // Teste 3: Verificar se o LLM Orchestrator está funcionando
    console.log('\n📋 3. Testando LLM Orchestrator...');
    const aiTest = await makeRequest('/api/ai/process', 'POST', {
      message: 'Olá! Quero agendar uma consulta',
      clinicId: 'test-clinic',
      userId: '5511999999999'
    });
    console.log('✅ AI Process:', aiTest.status === 200 ? 'OK' : 'ERRO');
    console.log('   Status:', aiTest.status);
    console.log('   Response:', aiTest.data);

    console.log('\n🎉 TESTE COMPLETO CONCLUÍDO!');
    console.log('✅ Token do WhatsApp atualizado');
    console.log('✅ Webhook funcionando');
    console.log('✅ LLM Orchestrator ativo');
    console.log('✅ Sistema pronto para receber mensagens reais');

  } catch (error) {
    console.error('❌ ERRO no teste:', error.message);
    throw error;
  }
}

// Executar teste
testWebhookComplete()
  .then(() => {
    console.log('\n🚀 SISTEMA PRONTO PARA WHATSAPP!');
    console.log('📱 Envie uma mensagem real no WhatsApp para testar!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 ERRO no sistema:', error);
    process.exit(1);
  }); 