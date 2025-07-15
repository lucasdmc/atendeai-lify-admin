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

async function analyzeStatusPersistence() {
  console.log('🔧 Analisando persistência de status...\n');

  try {
    // 1. Verificar status atual
    console.log('1️⃣ Verificando status atual das sessões...');
    const healthResponse = await makeRequest('/health');
    console.log('Status do servidor:', healthResponse.status);
    
    if (healthResponse.data && healthResponse.data.sessions) {
      console.log(`\nSessões encontradas: ${healthResponse.data.sessions.length}`);
      
      for (const session of healthResponse.data.sessions) {
        console.log(`\n📱 Sessão: ${session.agentId}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Conectado: ${session.connected}`);
        console.log(`   WhatsApp: ${session.whatsappNumber}`);
        console.log(`   Conectado em: ${session.connectedAt || 'Nunca'}`);
      }
    }

    // 2. Análise do problema de persistência
    console.log('\n2️⃣ Análise do problema de persistência:');
    console.log(`
    Problemas identificados:
    
    1. Status "qr" persistente indica:
       - Sessão não foi limpa corretamente
       - Cliente WhatsApp não foi destruído
       - Estado não foi resetado no servidor
       - Arquivos de sessão não foram removidos
    
    2. Possíveis causas:
       - Cliente WhatsApp não implementa destroy() corretamente
       - Estado mantido em memória não foi limpo
       - Arquivos de sessão não foram deletados
       - Processo não foi reiniciado após limpeza
    
    3. Impactos:
       - Múltiplas sessões ocupam recursos
       - QR Codes podem conflitar
       - Performance degradada
       - Confusão para usuários
    `);

    // 3. Testar diferentes abordagens de limpeza
    console.log('\n3️⃣ Testando diferentes abordagens de limpeza...');
    
    if (healthResponse.data && healthResponse.data.sessions.length > 0) {
      const testAgent = healthResponse.data.sessions[0];
      console.log(`Testando com agente: ${testAgent.agentId}`);
      
      // Teste 1: Tentar logout
      console.log('\nTeste 1: Tentando logout...');
      try {
        const logoutResponse = await makeRequest('/api/whatsapp/logout', 'POST', {
          agentId: testAgent.agentId
        });
        console.log(`Status: ${logoutResponse.status}`);
        console.log(`Resposta: ${JSON.stringify(logoutResponse.data, null, 2)}`);
      } catch (error) {
        console.log(`Erro: ${error.message}`);
      }
      
      // Teste 2: Tentar reset
      console.log('\nTeste 2: Tentando reset...');
      try {
        const resetResponse = await makeRequest('/api/whatsapp/reset', 'POST', {
          agentId: testAgent.agentId
        });
        console.log(`Status: ${resetResponse.status}`);
        console.log(`Resposta: ${JSON.stringify(resetResponse.data, null, 2)}`);
      } catch (error) {
        console.log(`Erro: ${error.message}`);
      }
      
      // Teste 3: Tentar force disconnect
      console.log('\nTeste 3: Tentando force disconnect...');
      try {
        const forceResponse = await makeRequest('/api/whatsapp/force-disconnect', 'POST', {
          agentId: testAgent.agentId
        });
        console.log(`Status: ${forceResponse.status}`);
        console.log(`Resposta: ${JSON.stringify(forceResponse.data, null, 2)}`);
      } catch (error) {
        console.log(`Erro: ${error.message}`);
      }
    }

    // 4. Soluções propostas
    console.log('\n4️⃣ Soluções propostas:');
    console.log(`
    A. Implementação no servidor WhatsApp:
    
    // Função para limpar sessão completamente
    async function clearSession(agentId) {
      try {
        const client = whatsappClients[agentId];
        if (client) {
          // 1. Desconectar cliente
          await client.destroy();
          
          // 2. Remover da memória
          delete whatsappClients[agentId];
          
          // 3. Limpar arquivos de sessão
          const sessionPath = `./sessions/${agentId}`;
          if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          }
          
          // 4. Resetar estado
          sessionStates[agentId] = {
            status: 'disconnected',
            connected: false,
            connectedAt: null
          };
          
          return true;
        }
        return false;
      } catch (error) {
        console.error('Erro ao limpar sessão:', error);
        return false;
      }
    }
    
    // Endpoint para limpeza completa
    app.post('/api/whatsapp/clear-session/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const cleared = await clearSession(agentId);
        
        if (cleared) {
          res.json({
            success: true,
            message: 'Sessão limpa completamente',
            agentId: agentId
          });
        } else {
          res.status(404).json({
            success: false,
            error: 'Sessão não encontrada'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    B. Limpeza manual via SSH:
    
    1. Conectar na VPS:
       ssh user@lify.magah.com.br
    
    2. Parar o servidor WhatsApp:
       pm2 stop whatsapp-server
       # ou
       systemctl stop whatsapp-server
    
    3. Limpar arquivos de sessão:
       rm -rf /path/to/whatsapp/sessions/*
       rm -rf /path/to/whatsapp/.wwebjs_auth/*
       rm -rf /path/to/whatsapp/.wwebjs_cache/*
    
    4. Reiniciar o servidor:
       pm2 start whatsapp-server
       # ou
       systemctl start whatsapp-server
    
    C. Script de limpeza automática:
    
    // Adicionar ao cron para limpeza periódica
    0 2 * * * /usr/bin/node /path/to/cleanup-sessions.js
    `);

    // 5. Verificar status após testes
    console.log('\n5️⃣ Verificando status após testes...');
    const finalStatus = await makeRequest('/health');
    console.log('Status final:', finalStatus.status);
    
    if (finalStatus.data && finalStatus.data.sessions) {
      console.log(`Sessões restantes: ${finalStatus.data.sessions.length}`);
      for (const session of finalStatus.data.sessions) {
        console.log(`- ${session.agentId}: ${session.status}`);
      }
    }

    console.log('\n✅ Análise de persistência concluída!');
    console.log('💡 Implemente as soluções acima para resolver o problema.');

  } catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
  }
}

analyzeStatusPersistence(); 