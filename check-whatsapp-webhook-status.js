// ========================================
// VERIFICAR STATUS DO WEBHOOK WHATSAPP
// ========================================

import https from 'https';
import http from 'http';

const RAILWAY_URL = 'https://atendeai-lify-backend-production.up.railway.app';
const PHONE_NUMBER_ID = '698766983327246';

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
              display_phone_number: "+55 47 3091-5628",
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
    console.log('📋 3. CONFIGURAÇÃO NECESSÁRIA NO WHATSAPP BUSINESS API:');
    console.log('============================================================');
    console.log('🌐 URL do Webhook:', `${RAILWAY_URL}/webhook/whatsapp-meta`);
    console.log('🔑 Token de Verificação: atendeai-lify-backend');
    console.log('📱 Phone Number ID: 698766983327246');
    console.log('📧 Eventos necessários: messages, message_deliveries, message_reads');
    console.log('');

    // 4. Instruções de configuração
    console.log('⚙️ 4. PASSOS PARA CONFIGURAR NO WHATSAPP BUSINESS API:');
    console.log('============================================================');
    console.log('1. Acesse: https://developers.facebook.com/apps/');
    console.log('2. Selecione seu app do WhatsApp Business API');
    console.log('3. Vá em: WhatsApp > API Setup');
    console.log('4. Em "Webhooks", clique em "Configure"');
    console.log('5. Configure:');
    console.log(`   - URL: ${RAILWAY_URL}/webhook/whatsapp-meta`);
    console.log('   - Verify Token: atendeai-lify-backend');
    console.log('   - Selecione eventos: messages, message_deliveries, message_reads');
    console.log('6. Clique em "Verify and Save"');
    console.log('');

    // 5. Verificar se o webhook está ativo
    console.log('🔍 5. VERIFICANDO SE O WEBHOOK ESTÁ ATIVO...');
    console.log('Se o webhook não estiver configurado no WhatsApp Business API,');
    console.log('as mensagens não serão enviadas para o servidor.');
    console.log('');

    // 6. Teste de envio de mensagem
    console.log('📤 6. TESTE DE ENVIO DE MENSAGEM...');
    console.log('Para testar se o sistema responde, envie uma mensagem para:');
    console.log('+55 47 3091-5628 (número real do Atende Ai)');
    console.log('');

    // 7. Verificar logs
    console.log('📊 7. VERIFICAR LOGS:');
    console.log('=====================');
    console.log('Para verificar se as mensagens estão chegando:');
    console.log('1. Acesse: https://railway.app/dashboard');
    console.log('2. Selecione: atendeai-lify-backend');
    console.log('3. Vá em: Deployments → View Logs');
    console.log('4. Procure por: "🚨 [Webhook-Contextualizado] WEBHOOK CHAMADO!"');
    console.log('');

    // 8. Diagnóstico do problema
    console.log('🚨 8. DIAGNÓSTICO DO PROBLEMA:');
    console.log('===============================');
    console.log('Se o webhook está funcionando mas não há respostas:');
    console.log('❓ O webhook pode não estar configurado no WhatsApp Business API');
    console.log('❓ O token de verificação pode estar incorreto');
    console.log('❓ Os eventos podem não estar selecionados');
    console.log('❓ O número pode não estar verificado');
    console.log('');

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
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

function makePostRequest(url, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
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
checkWhatsAppWebhookStatus(); 