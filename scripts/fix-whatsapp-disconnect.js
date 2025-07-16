import https from 'https';

const WHATSAPP_SERVER_URL = 'https://atendeai.lify.com.br';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'atendeai.lify.com.br',
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

async function diagnoseDisconnectIssues() {
  console.log('🔧 Diagnosticando problemas de desconexão...\n');

  try {
    // 1. Verificar sessões ativas
    console.log('1️⃣ Verificando sessões ativas...');
    const healthResponse = await makeRequest('/health');
    console.log('Status:', healthResponse.status);
    
    if (healthResponse.data && healthResponse.data.sessions) {
      console.log(`Sessões encontradas: ${healthResponse.data.sessions.length}`);
      
      for (const session of healthResponse.data.sessions) {
        console.log(`- Agente: ${session.agentId}`);
        console.log(`  Status: ${session.status}`);
        console.log(`  Conectado: ${session.connected}`);
        console.log(`  WhatsApp: ${session.whatsappNumber}`);
        console.log('');
      }
    }

    // 2. Testar diferentes formatos de desconexão
    console.log('2️⃣ Testando diferentes formatos de desconexão...');
    
    if (healthResponse.data && healthResponse.data.sessions.length > 0) {
      const testAgent = healthResponse.data.sessions[0];
      console.log(`Testando desconexão do agente: ${testAgent.agentId}`);
      
      // Teste 1: Formato atual (que falha)
      console.log('\nTeste 1: Formato atual (POST /api/whatsapp/disconnect)');
      try {
        const disconnect1 = await makeRequest('/api/whatsapp/disconnect', 'POST', {
          agentId: testAgent.agentId
        });
        console.log(`Status: ${disconnect1.status}`);
        console.log(`Resposta: ${JSON.stringify(disconnect1.data, null, 2)}`);
      } catch (error) {
        console.log(`Erro: ${error.message}`);
      }
      
      // Teste 2: Formato alternativo (GET)
      console.log('\nTeste 2: Formato alternativo (GET /api/whatsapp/disconnect)');
      try {
        const disconnect2 = await makeRequest(`/api/whatsapp/disconnect?agentId=${testAgent.agentId}`, 'GET');
        console.log(`Status: ${disconnect2.status}`);
        console.log(`Resposta: ${JSON.stringify(disconnect2.data, null, 2)}`);
      } catch (error) {
        console.log(`Erro: ${error.message}`);
      }
      
      // Teste 3: Formato com path parameter
      console.log('\nTeste 3: Formato com path parameter (POST /api/whatsapp/disconnect/{agentId})');
      try {
        const disconnect3 = await makeRequest(`/api/whatsapp/disconnect/${testAgent.agentId}`, 'POST');
        console.log(`Status: ${disconnect3.status}`);
        console.log(`Resposta: ${JSON.stringify(disconnect3.data, null, 2)}`);
      } catch (error) {
        console.log(`Erro: ${error.message}`);
      }
    }

    // 3. Análise do problema
    console.log('\n3️⃣ Análise do problema:');
    console.log(`
    Problemas identificados:
    
    1. Status 400 (Bad Request) indica que:
       - Parâmetros estão faltando
       - Formato dos dados está incorreto
       - Validação falhou no servidor
    
    2. Possíveis causas:
       - O servidor espera parâmetros diferentes
       - O formato do JSON está incorreto
       - Falta autenticação/autorização
       - O endpoint não está implementado corretamente
    
    3. Soluções propostas:
       - Verificar documentação da API
       - Implementar endpoint correto no servidor
       - Adicionar logs detalhados no servidor
       - Testar com diferentes formatos de dados
    `);

    // 4. Proposta de correção
    console.log('\n4️⃣ Proposta de correção no servidor:');
    console.log(`
    // Implementação correta do endpoint de desconexão:
    
    app.post('/api/whatsapp/disconnect', async (req, res) => {
      try {
        const { agentId, whatsappNumber, connectionId } = req.body;
        
        // Validação
        if (!agentId) {
          return res.status(400).json({
            success: false,
            error: 'agentId é obrigatório'
          });
        }
        
        // Verificar se a sessão existe
        const client = whatsappClients[agentId];
        if (!client) {
          return res.status(404).json({
            success: false,
            error: 'Sessão não encontrada'
          });
        }
        
        // Desconectar cliente
        try {
          await client.destroy();
          delete whatsappClients[agentId];
          
          res.json({
            success: true,
            message: 'Sessão desconectada com sucesso',
            agentId: agentId
          });
        } catch (error) {
          console.error('Erro ao desconectar:', error);
          res.status(500).json({
            success: false,
            error: 'Erro interno ao desconectar'
          });
        }
      } catch (error) {
        console.error('Erro no endpoint disconnect:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    `);

    console.log('\n✅ Diagnóstico de desconexão concluído!');
    console.log('💡 Implemente a correção acima no servidor WhatsApp.');

  } catch (error) {
    console.error('❌ Erro durante o diagnóstico:', error.message);
  }
}

diagnoseDisconnectIssues(); 