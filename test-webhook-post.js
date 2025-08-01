// ========================================
// TESTE DO WEBHOOK COM POST
// ========================================

import https from 'https';
import http from 'http';

// Configurações da VPS
const VPS_IP = '31.97.241.19';
const VPS_URL = 'https://atendeai.com.br';

async function testWebhookPOST() {
  console.log('📨 TESTANDO WEBHOOK COM POST');
  console.log('==============================\n');

  try {
    // 1. Testar webhook via IP direto (POST)
    console.log('📡 1. Testando webhook via IP direto (POST)...');
    
    const webhookData = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999999999',
              text: { body: 'Olá, como posso agendar uma consulta?' },
              timestamp: Date.now()
            }]
          }
        }]
      }]
    };

    const postResponse = await makeRequest(`http://${VPS_IP}:3001/webhook/whatsapp-meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Webhook-Test'
      },
      body: JSON.stringify(webhookData)
    });

    console.log(`   Status: ${postResponse.statusCode}`);
    console.log(`   Success: ${postResponse.success}`);
    if (postResponse.data) {
      console.log(`   Response: ${JSON.stringify(postResponse.data, null, 2)}`);
    } else if (postResponse.error) {
      console.log(`   Error: ${postResponse.error}`);
    }
    console.log('');

    // 2. Testar webhook via domínio (POST)
    console.log('🌐 2. Testando webhook via domínio (POST)...');
    
    const domainPostResponse = await makeRequest(`${VPS_URL}/webhook/whatsapp-meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Webhook-Test'
      },
      body: JSON.stringify(webhookData)
    });

    console.log(`   Status: ${domainPostResponse.statusCode}`);
    console.log(`   Success: ${domainPostResponse.success}`);
    if (domainPostResponse.data) {
      console.log(`   Response: ${JSON.stringify(domainPostResponse.data, null, 2)}`);
    } else if (domainPostResponse.error) {
      console.log(`   Error: ${domainPostResponse.error}`);
    }
    console.log('');

    // 3. Testar desafio de verificação (GET)
    console.log('🔐 3. Testando desafio de verificação (GET)...');
    
    const challengeResponse = await makeRequest(`http://${VPS_IP}:3001/webhook/whatsapp-meta?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=test`, {
      method: 'GET'
    });

    console.log(`   Status: ${challengeResponse.statusCode}`);
    console.log(`   Success: ${challengeResponse.success}`);
    if (challengeResponse.data) {
      console.log(`   Response: ${challengeResponse.data}`);
    }
    console.log('');

    // 4. Testar endpoint de teste (GET)
    console.log('🧪 4. Testando endpoint de teste (GET)...');
    
    const testResponse = await makeRequest(`http://${VPS_IP}:3001/webhook/whatsapp/test`, {
      method: 'GET'
    });

    console.log(`   Status: ${testResponse.statusCode}`);
    console.log(`   Success: ${testResponse.success}`);
    if (testResponse.data) {
      console.log(`   Response: ${JSON.stringify(testResponse.data, null, 2)}`);
    }
    console.log('');

    // 5. Análise final
    console.log('📊 ANÁLISE FINAL');
    console.log('==================');
    
    if (postResponse.success) {
      console.log('✅ Webhook funcionando via IP direto');
    } else {
      console.log('❌ Webhook não funcionando via IP direto');
    }
    
    if (domainPostResponse.success) {
      console.log('✅ Webhook funcionando via domínio');
    } else {
      console.log('❌ Webhook não funcionando via domínio (problema de proxy)');
    }
    
    if (testResponse.success) {
      console.log('✅ Endpoint de teste funcionando');
    } else {
      console.log('❌ Endpoint de teste não funcionando');
    }
    console.log('');

    // 6. Próximos passos
    console.log('🎯 PRÓXIMOS PASSOS');
    console.log('===================');
    
    if (postResponse.success && !domainPostResponse.success) {
      console.log('💡 PROBLEMA: Servidor funciona, mas proxy não está configurado');
      console.log('   SOLUÇÃO: Configurar proxy reverso no Nginx');
    } else if (!postResponse.success) {
      console.log('💡 PROBLEMA: Servidor não está processando webhooks');
      console.log('   SOLUÇÃO: Verificar logs do servidor e reiniciar');
    } else {
      console.log('✅ TUDO FUNCIONANDO!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

/**
 * Faz uma requisição HTTP
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            data: jsonData,
            statusCode: res.statusCode
          });
        } catch (error) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            data: data,
            statusCode: res.statusCode,
            error: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Executar teste
testWebhookPOST(); 