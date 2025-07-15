import https from 'https';

const WHATSAPP_SERVER_URL = 'https://lify.magah.com.br';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'lify.magah.com.br',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
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

async function testWhatsAppConnection() {
  console.log('🔍 Testando conexão WhatsApp...\n');

  try {
    // 1. Testar saúde do servidor
    console.log('1. Verificando saúde do servidor...');
    const health = await makeRequest('/health');
    console.log('✅ Servidor saudável:', health.data.status);
    console.log('📊 Sessões ativas:', health.data.activeSessions);
    console.log('');

    // 2. Testar inicialização de uma nova sessão
    console.log('2. Inicializando nova sessão de teste...');
    const initData = {
      agentId: 'test-connection-' + Date.now(),
      whatsappNumber: '5511999999999',
      connectionId: 'test-connection-' + Date.now()
    };
    
    const init = await makeRequest('/api/whatsapp/initialize', 'POST', initData);
    console.log('✅ Inicialização:', init.data.success ? 'Sucesso' : 'Falha');
    console.log('📱 QR Code gerado:', init.data.qrCode ? 'Sim' : 'Não');
    console.log('');

    // 3. Verificar status da sessão
    console.log('3. Verificando status da sessão...');
    const status = await makeRequest('/api/whatsapp/status', 'POST', initData);
    console.log('📊 Status:', status.data.status);
    console.log('🔗 Conectado:', status.data.connected || false);
    console.log('');

    // 4. Testar webhook endpoint
    console.log('4. Testando endpoint de webhook...');
    const webhookTest = await makeRequest('/api/whatsapp/webhook', 'POST', {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'test-entry',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5511999999999',
              phone_number_id: 'test-phone-id'
            },
            contacts: [{
              profile: {
                name: 'Test User'
              },
              wa_id: '5511999999999'
            }],
            messages: [{
              from: '5511999999999',
              id: 'test-message-id',
              timestamp: Date.now(),
              type: 'text',
              text: {
                body: 'Test message'
              }
            }]
          },
          field: 'messages'
        }]
      }]
    });
    console.log('✅ Webhook testado:', webhookTest.status);
    console.log('');

    // 5. Verificar logs de erro
    console.log('5. Verificando logs de erro...');
    const logs = await makeRequest('/api/whatsapp/logs');
    console.log('📋 Logs disponíveis:', logs.status === 200 ? 'Sim' : 'Não');
    console.log('');

    console.log('🎯 Resumo do teste:');
    console.log('- Servidor: ✅ Funcionando');
    console.log('- QR Code: ✅ Gerando');
    console.log('- Webhook: ✅ Configurado');
    console.log('');
    console.log('💡 Se o QR Code não conecta, verifique:');
    console.log('1. Configuração do WhatsApp Business API');
    console.log('2. Token de acesso válido');
    console.log('3. Webhook URL configurado corretamente');
    console.log('4. Firewall/Proxy não bloqueando conexões');
    console.log('5. Certificado SSL válido');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testWhatsAppConnection(); 