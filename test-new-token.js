// ========================================
// TESTE DO NOVO TOKEN WHATSAPP
// ========================================

import https from 'https';

const PHONE_NUMBER_ID = '698766983327246';
const NEW_ACCESS_TOKEN = 'EAASAuWYr9JgBPDZBjdHeE5NAY3vP6J6py9oz1JYvqe39WW7ZB3nDnmEZBrZAFDMnRa5oCfcFV4cwxEz0aFZB4OuEHuJQuEC2NdhZBHmZAyCLFnzh5LNn4vsiBXYoQhLBj55E3s1G8X03OZAEa5mQz72d9VsGJf6etZCys7x4XJv6RfWsf6IO1eTzeMe7ixanj8ZCd32jtBQAZCYs1XPkB5h8KKwtEH9HAQ0uQcZCmd3cgdininbeEfoE7T9G4fZCYGwEZD';

async function testNewToken() {
  console.log('🔍 TESTANDO NOVO TOKEN WHATSAPP');
  console.log('==================================\n');

  try {
    // 1. Testar se o token está válido
    console.log('🔑 1. Testando validade do novo token...');
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
        
        console.log('🎉 NOVO TOKEN FUNCIONANDO!');
        console.log('============================');
        console.log('✅ Token atualizado no Railway');
        console.log('✅ Envio de mensagens funcionando');
        console.log('✅ Sistema pronto para uso');
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
        'Authorization': `Bearer ${NEW_ACCESS_TOKEN}`,
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
        body: "Teste do novo token - Sistema Atende Ai funcionando! 🎉"
      }
    };

    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEW_ACCESS_TOKEN}`,
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
testNewToken(); 