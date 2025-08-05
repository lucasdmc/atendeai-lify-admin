// ========================================
// VERIFICAR CONFIGURAÇÃO DO WEBHOOK META
// ========================================

import https from 'https';

const META_ACCESS_TOKEN = 'EAASAuWYr9JgBPMviYNu4WXFafodM3Y5ia09Eks3aZAM9LDAnazZCcQiyJup6xNkRZANCunz0ZBTZAy3UbbcsTbZB9drn3LJwzS4iw3Aq5CKF8ZASgXYz4SShQlYsSt0IRD70sO8gZCvPGkASI8c81z5f1X8B9TGpkOUmZAp9zJ6dPDSdFC9X1Mf8t5d2ZCVDnVz4hvjPbVywsrVg3odTrSRcIaPh13BGZCNFc6Qr5rsDFBKS4K3lwSSbIrObiMWIAAZD';
const PHONE_NUMBER_ID = '698766983327246';

async function checkMetaWebhookConfig() {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO DO WEBHOOK META');
  console.log('============================================\n');

  try {
    // 1. Verificar informações do número de telefone
    console.log('📡 1. Verificando informações do número de telefone...');
    const phoneInfo = await makeMetaRequest(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}`);
    console.log(`   Status: ${phoneInfo.statusCode}`);
    console.log(`   Dados: ${JSON.stringify(phoneInfo.body, null, 2)}`);
    console.log('');

    // 2. Verificar webhooks configurados
    console.log('📡 2. Verificando webhooks configurados...');
    const webhooks = await makeMetaRequest(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/subscribed_apps`);
    console.log(`   Status: ${webhooks.statusCode}`);
    console.log(`   Dados: ${JSON.stringify(webhooks.body, null, 2)}`);
    console.log('');

    // 3. Testar envio de mensagem via API
    console.log('📡 3. Testando envio de mensagem via API...');
    const messageData = {
      messaging_product: "whatsapp",
      to: "5511999999999",
      type: "text",
      text: {
        body: "Teste de mensagem via API Meta"
      }
    };

    const sendMessage = await makeMetaPostRequest(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      messageData
    );
    console.log(`   Status: ${sendMessage.statusCode}`);
    console.log(`   Resposta: ${JSON.stringify(sendMessage.body, null, 2)}`);
    console.log('');

    // 4. Análise do problema
    console.log('📊 ANÁLISE DO PROBLEMA');
    console.log('========================');
    
    if (phoneInfo.statusCode === 200) {
      console.log('✅ Número de telefone está configurado');
    } else {
      console.log('❌ Problema com número de telefone');
    }

    if (webhooks.statusCode === 200) {
      console.log('✅ Webhooks estão configurados');
    } else {
      console.log('❌ Problema com webhooks');
    }

    if (sendMessage.statusCode === 200) {
      console.log('✅ Envio de mensagem funciona');
    } else {
      console.log('❌ Problema com envio de mensagem');
    }
    console.log('');

    // 5. Configuração necessária
    console.log('🔧 CONFIGURAÇÃO NECESSÁRIA');
    console.log('===========================');
    console.log('1. URL do Webhook:');
    console.log('   https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
    console.log('');
    console.log('2. Verificar webhook no Meta:');
    console.log('   https://developers.facebook.com/apps/');
    console.log('   → WhatsApp → Configuration → Webhook');
    console.log('');
    console.log('3. Verificar permissões:');
    console.log('   - messages_delivery');
    console.log('   - messages_read');
    console.log('   - messages');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function makeMetaRequest(url) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${url}?access_token=${META_ACCESS_TOKEN}`;
    
    https.get(fullUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function makeMetaPostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const fullUrl = `${url}?access_token=${META_ACCESS_TOKEN}`;
    
    const req = https.request(fullUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: data
          });
        }
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
checkMetaWebhookConfig(); 