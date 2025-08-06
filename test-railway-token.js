// ========================================
// TESTE DO TOKEN ATUAL DO RAILWAY
// ========================================

import https from 'https';

async function testRailwayToken() {
  console.log('🔍 TESTANDO TOKEN ATUAL DO RAILWAY');
  console.log('====================================\n');

  try {
    // Testar webhook com payload real para ver qual token está sendo usado
    console.log('📡 Testando webhook do Railway...');
    
    const payload = {
      object: "whatsapp_business_account",
      entry: [{
        id: "698766983327246",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "+55 47 3091-5628",
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "Teste Token" },
              wa_id: "5511999999999"
            }],
            messages: [{
              from: "5511999999999",
              id: "wamid.test.token",
              timestamp: "1704067200",
              text: { body: "Teste de token" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const response = await makePostRequest('https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta', payload);
    
    console.log('📋 Resposta do Railway:');
    console.log('Status:', response.statusCode);
    console.log('Resposta:', response.body.substring(0, 500));
    console.log('');

    if (response.body.includes('401') || response.body.includes('Unauthorized')) {
      console.log('❌ PROBLEMA: Token ainda antigo no Railway');
      console.log('💡 Solução: Aguardar deploy ou forçar novo deploy');
    } else if (response.body.includes('success')) {
      console.log('✅ SUCESSO: Token atualizado no Railway');
      console.log('🎉 Sistema funcionando corretamente!');
    } else {
      console.log('⚠️ Verificar logs para mais detalhes');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Executar teste
testRailwayToken(); 