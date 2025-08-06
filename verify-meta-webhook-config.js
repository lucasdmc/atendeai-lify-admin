// ========================================
// VERIFICAR CONFIGURAÇÃO DO WEBHOOK NO META
// ========================================

import https from 'https';

const PHONE_NUMBER_ID = '698766983327246';
const NEW_TOKEN = 'EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD';

async function verifyMetaWebhookConfig() {
  console.log('🔍 VERIFICANDO CONFIGURAÇÃO DO WEBHOOK NO META');
  console.log('================================================\n');

  try {
    // 1. Verificar informações do número de telefone
    console.log('📱 1. Verificando informações do número de telefone...');
    const phoneInfo = await makeMetaRequest(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}`);
    console.log('   Status:', phoneInfo.statusCode);
    if (phoneInfo.statusCode === 200) {
      const data = JSON.parse(phoneInfo.body);
      console.log('   ✅ Número verificado:', data.verified_name);
      console.log('   ✅ Status:', data.code_verification_status);
      console.log('   ✅ Número:', data.display_phone_number);
      console.log('   ✅ Qualidade:', data.quality_rating);
      
      if (data.webhook_configuration) {
        console.log('   ✅ Webhook configurado:', data.webhook_configuration.application);
      } else {
        console.log('   ❌ Webhook NÃO configurado!');
      }
    } else {
      console.log('   ❌ Erro ao verificar número:', phoneInfo.body);
    }
    console.log('');

    // 2. Verificar webhooks configurados
    console.log('🌐 2. Verificando webhooks configurados...');
    const webhooks = await makeMetaRequest(`https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/webhooks`);
    console.log('   Status:', webhooks.statusCode);
    if (webhooks.statusCode === 200) {
      const webhookData = JSON.parse(webhooks.body);
      console.log('   ✅ Webhooks encontrados:', webhookData.data?.length || 0);
      if (webhookData.data && webhookData.data.length > 0) {
        webhookData.data.forEach((webhook, index) => {
          console.log(`   Webhook ${index + 1}:`, webhook.url);
        });
      }
    } else {
      console.log('   ❌ Erro ao verificar webhooks:', webhooks.body);
    }
    console.log('');

    // 3. Testar envio de mensagem
    console.log('📤 3. Testando envio de mensagem...');
    const messageData = {
      messaging_product: "whatsapp",
      to: "5511999999999",
      type: "text",
      text: { body: "Teste de envio via API" }
    };

    const sendMessage = await makeMetaPostRequest(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      messageData
    );
    console.log('   Status:', sendMessage.statusCode);
    if (sendMessage.statusCode === 200) {
      console.log('   ✅ Envio de mensagem funciona');
    } else {
      console.log('   ❌ Erro no envio:', sendMessage.body);
    }
    console.log('');

    // 4. Análise do problema
    console.log('📊 4. ANÁLISE DO PROBLEMA');
    console.log('========================');
    
    if (phoneInfo.statusCode === 200) {
      const phoneData = JSON.parse(phoneInfo.body);
      if (phoneData.webhook_configuration) {
        console.log('✅ Webhook está configurado no Meta');
        console.log('✅ URL:', phoneData.webhook_configuration.application);
      } else {
        console.log('❌ Webhook NÃO está configurado no Meta');
        console.log('💡 Configure o webhook no WhatsApp Business API');
      }
    } else {
      console.log('❌ Problema com número de telefone');
    }

    if (sendMessage.statusCode === 200) {
      console.log('✅ Envio de mensagem funciona');
    } else {
      console.log('❌ Problema com envio de mensagem');
    }
    console.log('');

    // 5. Configuração necessária
    console.log('🔧 5. CONFIGURAÇÃO NECESSÁRIA');
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

    // 6. Teste manual
    console.log('🧪 6. TESTE MANUAL');
    console.log('==================');
    console.log('1. Envie uma mensagem para: +55 47 3091-5628');
    console.log('2. Verifique se recebe resposta automática');
    console.log('3. Se não receber, o webhook não está configurado');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

function makeMetaRequest(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'Authorization': `Bearer ${NEW_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.get(url, options, (res) => {
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

function makeMetaPostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NEW_TOKEN}`,
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

// Executar verificação
verifyMetaWebhookConfig(); 