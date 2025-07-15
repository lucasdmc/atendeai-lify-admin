import https from 'https';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;

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

async function createCleanupEndpoints() {
  console.log('🔧 Criando endpoints de limpeza automática...\n');

  try {
    // 1. Verificar endpoints existentes
    console.log('1️⃣ Verificando endpoints existentes...');
    const healthResponse = await makeRequest('/health');
    console.log('Status do servidor:', healthResponse.status);
    
    // 2. Testar endpoints de limpeza
    console.log('\n2️⃣ Testando endpoints de limpeza...');
    
    const testEndpoints = [
      '/api/whatsapp/clear-sessions',
      '/api/whatsapp/clear',
      '/api/whatsapp/reset',
      '/api/whatsapp/logout-all',
      '/api/whatsapp/disconnect-all',
      '/api/whatsapp/cleanup',
      '/api/whatsapp/restart'
    ];

    for (const endpoint of testEndpoints) {
      try {
        console.log(`Testando: ${endpoint}`);
        const response = await makeRequest(endpoint, 'POST');
        console.log(`Status: ${response.status}`);
        if (response.status === 404) {
          console.log(`❌ Endpoint não existe: ${endpoint}`);
        } else {
          console.log(`✅ Endpoint existe: ${endpoint}`);
        }
      } catch (error) {
        console.log(`❌ Erro: ${endpoint} - ${error.message}`);
      }
    }

    // 3. Proposta de implementação
    console.log('\n3️⃣ Proposta de implementação de endpoints:');
    console.log(`
    Endpoints necessários no servidor WhatsApp:
    
    POST /api/whatsapp/clear-sessions
    - Limpa todas as sessões ativas
    - Retorna: { "success": true, "clearedSessions": number }
    
    POST /api/whatsapp/disconnect/{agentId}
    - Desconecta uma sessão específica
    - Parâmetros: { "agentId": "string" }
    - Retorna: { "success": true, "disconnected": "agentId" }
    
    POST /api/whatsapp/restart
    - Reinicia o servidor WhatsApp
    - Retorna: { "success": true, "restarted": true }
    
    GET /api/whatsapp/sessions
    - Lista todas as sessões ativas
    - Retorna: { "sessions": [...] }
    `);

    // 4. Script de implementação manual
    console.log('\n4️⃣ Script para implementação manual na VPS:');
    console.log(`
    // Adicionar ao servidor WhatsApp (server.js):
    
    // Endpoint para limpar todas as sessões
    app.post('/api/whatsapp/clear-sessions', async (req, res) => {
      try {
        const sessions = Object.keys(whatsappClients);
        let clearedCount = 0;
        
        for (const agentId of sessions) {
          try {
            const client = whatsappClients[agentId];
            if (client) {
              await client.destroy();
              delete whatsappClients[agentId];
              clearedCount++;
            }
          } catch (error) {
            console.error('Erro ao limpar sessão:', agentId, error);
          }
        }
        
        res.json({ 
          success: true, 
          clearedSessions: clearedCount,
          message: `${clearedCount} sessões limpas`
        });
      } catch (error) {
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });
    
    // Endpoint para desconectar sessão específica
    app.post('/api/whatsapp/disconnect/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const client = whatsappClients[agentId];
        
        if (client) {
          await client.destroy();
          delete whatsappClients[agentId];
          res.json({ 
            success: true, 
            disconnected: agentId 
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
    `);

    console.log('\n✅ Análise de endpoints concluída!');
    console.log('💡 Para implementar, adicione os endpoints acima ao servidor WhatsApp.');

  } catch (error) {
    console.error('❌ Erro durante a análise:', error.message);
  }
}

createCleanupEndpoints(); 