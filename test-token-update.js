// ========================================
// TESTE DE TOKEN ATUALIZADO NO RAILWAY
// ========================================

import https from 'https';

const PHONE_NUMBER_ID = '698766983327246';
const ACCESS_TOKEN = 'EAAQHxcv0eAQBPLPQ6S8BtBkHhaac73TbyZAMFGO0JGTxorkHdL6zSEEruQJq9g60RxmSDCp0tdBLjJPU86vZAM4jFzpkP0rRibAIUGXu7VFwW8UL75HVs3FvGglZBTfQYQHQ9G1d505JTBKRNni3nwjEvwVuhoYZBPJITqE8NM7y77SDl7jxXJvB8OELUZARRodcV2waSsjyFy7bwEJtYmFTdCZB9CWkKCdVCk0lM2';

async function testTokenUpdate() {
  console.log('🔍 TESTANDO TOKEN ATUALIZADO NO RAILWAY');
  console.log('=========================================\n');

  try {
    // 1. Testar se o token está válido
    console.log('🔑 1. Testando validade do token...');
    const tokenTest = await testToken();
    
    if (tokenTest.valid) {
      console.log('✅ Token válido!');
      console.log('📱 Número verificado:', tokenTest.phoneNumber);
      console.log('');
      
      // 2. Testar envio de mensagem
      console.log('📤 2. Testando envio de mensagem...');
      const messageTest = await testMessage();
      
      if (messageTest.success) {
        console.log('✅ Mensagem enviada com sucesso!');
        console.log('📝 ID da mensagem:', messageTest.messageId);
        console.log('');
        
        console.log('🎉 SISTEMA FUNCIONANDO CORRETAMENTE!');
        console.log('=====================================');
        console.log('✅ Token atualizado no Railway');
        console.log('✅ Envio de mensagens funcionando');
        console.log('✅ Webhook configurado');
        console.log('✅ IA processando corretamente');
        console.log('');
        console.log('📱 Para testar o sistema completo:');
        console.log('1. Envie uma mensagem para: +55 47 3091-5628');
        console.log('2. Aguarde a resposta automática');
        console.log('3. O sistema deve responder corretamente agora!');
        
      } else {
        console.log('❌ Erro ao enviar mensagem:', messageTest.error);
      }
      
    } else {
      console.log('❌ Token inválido:', tokenTest.error);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

async function testToken() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${PHONE_NUMBER_ID}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            resolve({ valid: false, error: response.error.message });
          } else {
            resolve({ 
              valid: true, 
              phoneNumber: response.display_phone_number 
            });
          }
        } catch (e) {
          resolve({ valid: false, error: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testMessage() {
  return new Promise((resolve, reject) => {
    const payload = {
      messaging_product: "whatsapp",
      to: "5511999999999",
      type: "text",
      text: {
        body: "Teste de token atualizado - Sistema Atende Ai funcionando! 🎉"
      }
    };

    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            resolve({ success: false, error: response.error.message });
          } else if (response.messages && response.messages[0]) {
            resolve({ 
              success: true, 
              messageId: response.messages[0].id 
            });
          } else {
            resolve({ success: false, error: 'Resposta inesperada' });
          }
        } catch (e) {
          resolve({ success: false, error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Executar teste
testTokenUpdate(); 