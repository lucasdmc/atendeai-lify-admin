// ========================================
// TESTE DE ENVIO DE MENSAGEM VIA WHATSAPP
// ========================================

import https from 'https';

const PHONE_NUMBER_ID = '698766983327246';
const ACCESS_TOKEN = 'EAAQHxcv0eAQBPLPQ6S8BtBkHhaac73TbyZAMFGO0JGTxorkHdL6zSEEruQJq9g60RxmSDCp0tdBLjJPU86vZAM4jFzpkP0rRibAIUGXu7VFwW8UL75HVs3FvGglZBTfQYQHQ9G1d505JTBKRNni3nwjEvwVuhoYZBPJITqE8NM7y77SDl7jxXJvB8OELUZARRodcV2waSsjyFy7bwEJtYmFTdCZB9CWkKCdVCk0lM2';

async function testWhatsAppMessage() {
  console.log('📤 TESTANDO ENVIO DE MENSAGEM VIA WHATSAPP');
  console.log('============================================\n');

  try {
    // Payload para enviar mensagem
    const payload = {
      messaging_product: "whatsapp",
      to: "5511999999999", // Número de teste
      type: "text",
      text: {
        body: "Olá! Este é um teste do sistema Atende Ai. Se você recebeu esta mensagem, o sistema está funcionando corretamente. 🎉"
      }
    };

    console.log('📋 Payload da mensagem:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('');

    // Enviar mensagem
    console.log('📡 Enviando mensagem...');
    const response = await sendWhatsAppMessage(payload);
    
    console.log('✅ Resposta da API:');
    console.log(JSON.stringify(response, null, 2));
    console.log('');

    if (response.messages && response.messages[0] && response.messages[0].id) {
      console.log('🎉 MENSAGEM ENVIADA COM SUCESSO!');
      console.log('ID da mensagem:', response.messages[0].id);
      console.log('');
      console.log('📱 Para testar o sistema completo:');
      console.log('1. Envie uma mensagem para: +55 47 3091-5628');
      console.log('2. Aguarde a resposta automática');
      console.log('3. Se não responder, verifique os logs do servidor');
    } else {
      console.log('❌ Erro ao enviar mensagem');
      console.log('Verifique se o token está válido');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function sendWhatsAppMessage(payload) {
  return new Promise((resolve, reject) => {
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
          resolve(response);
        } catch (e) {
          resolve({ error: data });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Executar teste
testWhatsAppMessage(); 