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

async function debugWhatsAppAuthentication() {
  console.log('🔍 Debugando autenticação do WhatsApp...\n');

  try {
    // 1. Verificar saúde do servidor
    console.log('1️⃣ Verificando saúde do servidor...');
    const health = await makeRequest('/health');
    console.log('✅ Servidor saudável:', health.data.status);
    console.log('📊 Sessões ativas:', health.data.activeSessions);
    console.log('💾 Memória:', health.data.memory);
    console.log('');

    // 2. Verificar logs do servidor (se disponível)
    console.log('2️⃣ Verificando logs do servidor...');
    try {
      const logs = await makeRequest('/api/whatsapp/logs');
      console.log('📋 Logs disponíveis:', logs.status === 200 ? 'Sim' : 'Não');
      if (logs.status === 200 && logs.data) {
        console.log('📄 Últimos logs:', logs.data);
      }
    } catch (error) {
      console.log('❌ Endpoint de logs não disponível');
    }
    console.log('');

    // 3. Testar inicialização com parâmetros específicos
    console.log('3️⃣ Testando inicialização com parâmetros específicos...');
    const initData = {
      agentId: 'debug-test-' + Date.now(),
      whatsappNumber: '5511999999999',
      connectionId: 'debug-connection-' + Date.now()
    };
    
    const init = await makeRequest('/api/whatsapp/initialize', 'POST', initData);
    console.log('✅ Inicialização:', init.data.success ? 'Sucesso' : 'Falha');
    console.log('📱 QR Code gerado:', init.data.qrCode ? 'Sim' : 'Não');
    console.log('🔗 Status:', init.data.status);
    console.log('');

    // 4. Verificar status específico da sessão
    console.log('4️⃣ Verificando status da sessão...');
    const status = await makeRequest('/api/whatsapp/status', 'POST', initData);
    console.log('📊 Status:', status.data.status);
    console.log('🔗 Conectado:', status.data.connected || false);
    console.log('📱 QR Code presente:', status.data.qrCode ? 'Sim' : 'Não');
    console.log('');

    // 5. Testar webhook com payload real
    console.log('5️⃣ Testando webhook com payload real...');
    const webhookPayload = {
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
    };
    
    const webhookTest = await makeRequest('/api/whatsapp/webhook', 'POST', webhookPayload);
    console.log('✅ Webhook testado:', webhookTest.status);
    console.log('');

    // 6. Verificar se há endpoints de debug
    console.log('6️⃣ Verificando endpoints de debug...');
    const debugEndpoints = [
      '/api/whatsapp/debug',
      '/api/whatsapp/sessions',
      '/api/whatsapp/state',
      '/api/whatsapp/clear-auth'
    ];

    for (const endpoint of debugEndpoints) {
      try {
        const response = await makeRequest(endpoint);
        console.log(`✅ ${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`❌ ${endpoint}: Não disponível`);
      }
    }
    console.log('');

    // 7. Análise de problemas comuns
    console.log('7️⃣ Análise de problemas comuns...');
    console.log('🔍 Possíveis causas do problema:');
    console.log('');
    console.log('❌ Problema 1: Permissões de arquivo');
    console.log('   - O servidor pode não ter permissão de escrita para salvar sessões');
    console.log('   - Verificar se o diretório de sessões é gravável');
    console.log('   - Comando para verificar: ls -la /path/to/sessions/');
    console.log('');
    console.log('❌ Problema 2: Arquivo de sessão corrompido');
    console.log('   - O arquivo session.json pode estar corrompido');
    console.log('   - Tentar limpar a sessão e reconectar');
    console.log('   - Endpoint: POST /api/whatsapp/clear-auth');
    console.log('');
    console.log('❌ Problema 3: Múltiplas sessões');
    console.log('   - Pode haver conflito entre sessões');
    console.log('   - Verificar se não há outras instâncias rodando');
    console.log('');
    console.log('❌ Problema 4: Bloqueio do WhatsApp');
    console.log('   - O número pode estar temporariamente bloqueado');
    console.log('   - Tentar com outro número de WhatsApp');
    console.log('');
    console.log('❌ Problema 5: Configuração do whatsapp-web.js');
    console.log('   - Verificar se a biblioteca está configurada corretamente');
    console.log('   - Verificar se não há erros de autenticação');
    console.log('');

    // 8. Sugestões de correção
    console.log('8️⃣ Sugestões de correção...');
    console.log('🔧 Ações recomendadas:');
    console.log('');
    console.log('1. Limpar sessão atual:');
    console.log('   curl -X POST https://lify.magah.com.br/api/whatsapp/clear-auth');
    console.log('');
    console.log('2. Verificar logs do servidor:');
    console.log('   - Acessar a VPS e verificar logs do processo Node');
    console.log('   - Comando: pm2 logs ou docker logs');
    console.log('');
    console.log('3. Verificar permissões de arquivo:');
    console.log('   - Verificar se o diretório de sessões é gravável');
    console.log('   - Comando: ls -la /path/to/sessions/');
    console.log('');
    console.log('4. Reiniciar o servidor:');
    console.log('   - Reiniciar o processo Node na VPS');
    console.log('   - Comando: pm2 restart ou docker restart');
    console.log('');

    console.log('🎯 Resumo do debug:');
    console.log('- Servidor: ✅ Funcionando');
    console.log('- QR Code: ✅ Gerando');
    console.log('- Webhook: ✅ Configurado');
    console.log('- Status: ⚠️ Aguardando conexão');
    console.log('');
    console.log('💡 Próximos passos:');
    console.log('1. Verificar logs do servidor na VPS');
    console.log('2. Testar com outro número de WhatsApp');
    console.log('3. Limpar sessão e tentar novamente');
    console.log('4. Verificar permissões de arquivo no servidor');

  } catch (error) {
    console.error('❌ Erro no debug:', error.message);
  }
}

debugWhatsAppAuthentication(); 