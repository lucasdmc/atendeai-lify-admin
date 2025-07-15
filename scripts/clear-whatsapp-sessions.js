const https = require('https');

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

async function clearWhatsAppSessions() {
  console.log('🔍 Iniciando limpeza de sessões WhatsApp...\n');

  try {
    // 1. Verificar status atual
    console.log('1️⃣ Verificando status atual do servidor...');
    const statusResponse = await makeRequest('/health');
    console.log('Status:', statusResponse.status);
    console.log('Dados:', JSON.stringify(statusResponse.data, null, 2));
    console.log('');

    // 2. Tentar limpar todas as sessões
    console.log('2️⃣ Tentando limpar sessões via API...');
    
    // Tentar diferentes endpoints de limpeza
    const clearEndpoints = [
      '/api/whatsapp/clear-sessions',
      '/api/whatsapp/clear',
      '/api/whatsapp/reset',
      '/api/whatsapp/logout-all',
      '/api/whatsapp/disconnect-all'
    ];

    for (const endpoint of clearEndpoints) {
      try {
        console.log(`Tentando: ${endpoint}`);
        const response = await makeRequest(endpoint, 'POST');
        console.log(`✅ ${endpoint}: ${response.status}`);
        if (response.data) {
          console.log('Resposta:', JSON.stringify(response.data, null, 2));
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }

    // 3. Tentar desconectar sessões específicas
    console.log('\n3️⃣ Tentando desconectar sessões específicas...');
    
    // Se temos dados de sessões ativas, tentar desconectar cada uma
    if (statusResponse.data && statusResponse.data.sessions) {
      for (const session of statusResponse.data.sessions) {
        if (session.agentId) {
          try {
            console.log(`Desconectando agente: ${session.agentId}`);
            const disconnectResponse = await makeRequest('/api/whatsapp/disconnect', 'POST', {
              agentId: session.agentId
            });
            console.log(`Status: ${disconnectResponse.status}`);
          } catch (error) {
            console.log(`Erro ao desconectar ${session.agentId}: ${error.message}`);
          }
        }
      }
    }

    // 4. Verificar status final
    console.log('\n4️⃣ Verificando status final...');
    const finalStatus = await makeRequest('/health');
    console.log('Status final:', finalStatus.status);
    console.log('Dados finais:', JSON.stringify(finalStatus.data, null, 2));

    console.log('\n✅ Limpeza de sessões concluída!');
    console.log('💡 Agora você pode tentar conectar um novo agente.');

  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error.message);
  }
}

clearWhatsAppSessions(); 