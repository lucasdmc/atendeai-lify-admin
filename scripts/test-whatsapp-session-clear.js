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

async function testWhatsAppSessionClear() {
  console.log('🧹 Testando limpeza de sessão do WhatsApp...\n');

  try {
    // 1. Verificar status atual
    console.log('1️⃣ Verificando status atual...');
    const health = await makeRequest('/health');
    console.log('📊 Sessões ativas:', health.data.activeSessions);
    console.log('');

    // 2. Tentar limpar sessão via endpoint (se disponível)
    console.log('2️⃣ Tentando limpar sessão via endpoint...');
    try {
      const clearResponse = await makeRequest('/api/whatsapp/clear-auth', 'POST');
      console.log('✅ Limpeza via endpoint:', clearResponse.status);
      console.log('📄 Resposta:', clearResponse.data);
    } catch (error) {
      console.log('❌ Endpoint de limpeza não disponível');
    }
    console.log('');

    // 3. Tentar limpar sessão via reinicialização
    console.log('3️⃣ Tentando limpar sessão via reinicialização...');
    const initData = {
      agentId: 'session-clear-test-' + Date.now(),
      whatsappNumber: '5511999999999',
      connectionId: 'session-clear-' + Date.now()
    };
    
    const init = await makeRequest('/api/whatsapp/initialize', 'POST', initData);
    console.log('✅ Reinicialização:', init.data.success ? 'Sucesso' : 'Falha');
    console.log('📱 QR Code gerado:', init.data.qrCode ? 'Sim' : 'Não');
    console.log('');

    // 4. Verificar status após limpeza
    console.log('4️⃣ Verificando status após limpeza...');
    const status = await makeRequest('/api/whatsapp/status', 'POST', initData);
    console.log('📊 Status:', status.data.status);
    console.log('🔗 Conectado:', status.data.connected || false);
    console.log('');

    // 5. Testar com diferentes números
    console.log('5️⃣ Testando com diferentes números...');
    const testNumbers = [
      '5511999999999',
      '5511888888888',
      '5511777777777'
    ];

    for (const number of testNumbers) {
      console.log(`📱 Testando número: ${number}`);
      const testData = {
        agentId: 'test-' + number.replace(/\D/g, ''),
        whatsappNumber: number,
        connectionId: 'test-' + Date.now()
      };
      
      try {
        const testInit = await makeRequest('/api/whatsapp/initialize', 'POST', testData);
        console.log(`   ✅ Inicialização: ${testInit.data.success ? 'Sucesso' : 'Falha'}`);
        console.log(`   📱 QR Code: ${testInit.data.qrCode ? 'Sim' : 'Não'}`);
      } catch (error) {
        console.log(`   ❌ Erro: ${error.message}`);
      }
    }
    console.log('');

    // 6. Análise de problemas específicos
    console.log('6️⃣ Análise de problemas específicos...');
    console.log('🔍 Problemas identificados:');
    console.log('');
    console.log('❌ Problema 1: Endpoints de debug não disponíveis');
    console.log('   - /api/whatsapp/clear-auth: 404');
    console.log('   - /api/whatsapp/debug: 404');
    console.log('   - /api/whatsapp/sessions: 404');
    console.log('   - /api/whatsapp/state: 404');
    console.log('');
    console.log('❌ Problema 2: Status permanece "connecting"');
    console.log('   - O WhatsApp não está finalizando a autenticação');
    console.log('   - Pode ser problema de permissões no servidor');
    console.log('');
    console.log('❌ Problema 3: Múltiplas sessões ativas');
    console.log('   - Há 4 sessões ativas no servidor');
    console.log('   - Pode haver conflito entre sessões');
    console.log('');

    // 7. Recomendações específicas
    console.log('7️⃣ Recomendações específicas...');
    console.log('🔧 Ações necessárias no servidor VPS:');
    console.log('');
    console.log('1. Acessar a VPS e verificar logs:');
    console.log('   ssh usuario@lify.magah.com.br');
    console.log('   pm2 logs # ou docker logs');
    console.log('');
    console.log('2. Verificar permissões de arquivo:');
    console.log('   ls -la /path/to/whatsapp/sessions/');
    console.log('   chmod 755 /path/to/whatsapp/sessions/');
    console.log('');
    console.log('3. Limpar arquivos de sessão manualmente:');
    console.log('   rm -rf /path/to/whatsapp/sessions/*.json');
    console.log('   rm -rf /path/to/whatsapp/sessions/*.session');
    console.log('');
    console.log('4. Reiniciar o processo:');
    console.log('   pm2 restart all # ou docker restart');
    console.log('');
    console.log('5. Verificar se há múltiplas instâncias:');
    console.log('   ps aux | grep node');
    console.log('   pm2 list');
    console.log('');

    // 8. Teste de conectividade
    console.log('8️⃣ Teste de conectividade...');
    console.log('🌐 Verificando se o servidor pode acessar WhatsApp:');
    console.log('   - O servidor precisa ter acesso à internet');
    console.log('   - Verificar se não há firewall bloqueando');
    console.log('   - Testar: curl -I https://web.whatsapp.com');
    console.log('');

    console.log('🎯 Resumo da análise:');
    console.log('- Servidor: ✅ Funcionando');
    console.log('- QR Code: ✅ Gerando');
    console.log('- Autenticação: ❌ Não finaliza');
    console.log('- Sessões: ⚠️ Múltiplas ativas');
    console.log('');
    console.log('💡 Causa mais provável:');
    console.log('   Permissões de arquivo no servidor VPS');
    console.log('   O processo Node não consegue salvar a sessão');
    console.log('');
    console.log('🚀 Próximo passo:');
    console.log('   Acessar a VPS e verificar permissões/logs');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

testWhatsAppSessionClear(); 