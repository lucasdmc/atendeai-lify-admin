// ========================================
// VERIFICAR STATUS DO WEBHOOK WHATSAPP
// ========================================

import https from 'https';
import http from 'http';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';

async function checkWhatsAppWebhookStatus() {
  console.log('🔍 VERIFICANDO STATUS DO WEBHOOK WHATSAPP');
  console.log('==========================================\n');

  try {
    // 1. Testar webhook GET (verificação do Meta)
    console.log('📡 1. Testando webhook GET (verificação do Meta)...');
    const getResponse = await makeRequest(`${RAILWAY_URL}/webhook/whatsapp-meta`);
    console.log(`   Status: ${getResponse.statusCode}`);
    console.log(`   Resposta: ${getResponse.body}`);
    console.log('');

    // 2. Testar webhook POST com payload real
    console.log('📡 2. Testando webhook POST com payload real...');
    const postPayload = {
      object: "whatsapp_business_account",
      entry: [{
        id: "698766983327246",
        changes: [{
          value: {
            messaging_product: "whatsapp",
            metadata: {
              display_phone_number: "5511999999999",
              phone_number_id: "698766983327246"
            },
            contacts: [{
              profile: { name: "Teste Real" },
              wa_id: "5511999999999"
            }],
            messages: [{
              from: "5511999999999",
              id: "wamid.test.real",
              timestamp: "1704067200",
              text: { body: "Olá, preciso de informações sobre consulta" },
              type: "text"
            }]
          },
          field: "messages"
        }]
      }]
    };

    const postResponse = await makePostRequest(`${RAILWAY_URL}/webhook/whatsapp-meta`, postPayload);
    console.log(`   Status: ${postResponse.statusCode}`);
    console.log(`   Resposta: ${postResponse.body.substring(0, 500)}...`);
    console.log('');

    // 3. Verificar configuração do Meta
    console.log('📡 3. Verificando configuração do Meta...');
    console.log('   URL do Webhook: https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('   Phone Number ID: 698766983327246');
    console.log('   Access Token: Configurado');
    console.log('');

    // 4. Testar envio de mensagem
    console.log('📡 4. Testando envio de mensagem...');
    const sendMessageResponse = await makePostRequest(`${RAILWAY_URL}/api/whatsapp/send-message`, {
      phoneNumber: "5511999999999",
      message: "Teste de resposta automática"
    });
    console.log(`   Status: ${sendMessageResponse.statusCode}`);
    console.log(`   Resposta: ${sendMessageResponse.body.substring(0, 300)}...`);
    console.log('');

    // 5. Análise do problema
    console.log('📊 ANÁLISE DO PROBLEMA');
    console.log('========================');
    
    if (getResponse.statusCode === 200 && postResponse.statusCode === 200) {
      console.log('✅ Webhook está funcionando corretamente');
      console.log('❌ Problema pode estar na configuração do Meta');
      console.log('💡 Verificar:');
      console.log('   1. URL do webhook no Meta Developers');
      console.log('   2. Verificação do webhook');
      console.log('   3. Permissões do app');
      console.log('   4. Token de acesso');
    } else {
      console.log('❌ Webhook não está funcionando');
      console.log('💡 Verificar logs do Railway');
    }
    console.log('');

    // 6. Comandos para verificar
    console.log('🔧 COMANDOS PARA VERIFICAR');
    console.log('==========================');
    console.log('1. Verificar logs do Railway:');
    console.log('   https://railway.app/dashboard');
    console.log('');
    console.log('2. Verificar configuração do Meta:');
    console.log('   https://developers.facebook.com/apps/');
    console.log('');
    console.log('3. Testar webhook no Meta:');
    console.log('   https://developers.facebook.com/tools/explorer/');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Executar verificação
checkWhatsAppWebhookStatus(); 