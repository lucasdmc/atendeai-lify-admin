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

async function generateServerCode() {
  console.log('🔧 Gerando código para implementar no servidor WhatsApp...\n');

  const serverCode = `
// ========================================
// IMPLEMENTAÇÃO DOS ENDPOINTS DE LIMPEZA
// Adicione este código ao servidor WhatsApp (server.js)
// ========================================

const fs = require('fs');
const path = require('path');

// Função para limpar sessão completamente
async function clearSession(agentId) {
  try {
    const client = whatsappClients[agentId];
    if (client) {
      console.log(\`Limpando sessão: \${agentId}\`);
      
      // 1. Desconectar cliente
      try {
        await client.destroy();
        console.log(\`Cliente desconectado: \${agentId}\`);
      } catch (error) {
        console.error(\`Erro ao desconectar cliente: \${error.message}\`);
      }
      
      // 2. Remover da memória
      delete whatsappClients[agentId];
      console.log(\`Removido da memória: \${agentId}\`);
      
      // 3. Limpar arquivos de sessão
      const sessionPath = path.join(__dirname, 'sessions', agentId);
      if (fs.existsSync(sessionPath)) {
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log(\`Arquivos de sessão removidos: \${agentId}\`);
        } catch (error) {
          console.error(\`Erro ao remover arquivos: \${error.message}\`);
        }
      }
      
      // 4. Resetar estado
      if (sessionStates && sessionStates[agentId]) {
        sessionStates[agentId] = {
          status: 'disconnected',
          connected: false,
          connectedAt: null
        };
        console.log(\`Estado resetado: \${agentId}\`);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error(\`Erro ao limpar sessão \${agentId}:\`, error);
    return false;
  }
}

// ========================================
// ENDPOINTS DE LIMPEZA
// ========================================

// 1. Limpar todas as sessões
app.post('/api/whatsapp/clear-sessions', async (req, res) => {
  try {
    console.log('Iniciando limpeza de todas as sessões...');
    
    const sessions = Object.keys(whatsappClients || {});
    let clearedCount = 0;
    const errors = [];
    
    for (const agentId of sessions) {
      try {
        const cleared = await clearSession(agentId);
        if (cleared) {
          clearedCount++;
        }
      } catch (error) {
        errors.push(\`Erro ao limpar \${agentId}: \${error.message}\`);
      }
    }
    
    res.json({ 
      success: true, 
      clearedSessions: clearedCount,
      totalSessions: sessions.length,
      errors: errors.length > 0 ? errors : undefined,
      message: \`\${clearedCount} de \${sessions.length} sessões limpas\`
    });
  } catch (error) {
    console.error('Erro no endpoint clear-sessions:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// 2. Desconectar sessão específica
app.post('/api/whatsapp/disconnect', async (req, res) => {
  try {
    const { agentId, whatsappNumber, connectionId } = req.body;
    
    console.log(\`Tentando desconectar: \${agentId}\`);
    
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
      
      console.log(\`Sessão desconectada: \${agentId}\`);
      
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

// 3. Limpeza completa de sessão específica
app.post('/api/whatsapp/clear-session/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    
    console.log(\`Limpeza completa da sessão: \${agentId}\`);
    
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
    console.error('Erro no endpoint clear-session:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 4. Listar sessões ativas
app.get('/api/whatsapp/sessions', async (req, res) => {
  try {
    const sessions = Object.keys(whatsappClients || {}).map(agentId => ({
      agentId,
      status: sessionStates?.[agentId]?.status || 'unknown',
      connected: sessionStates?.[agentId]?.connected || false,
      connectedAt: sessionStates?.[agentId]?.connectedAt || null
    }));
    
    res.json({
      success: true,
      sessions: sessions,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Erro no endpoint sessions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 5. Reiniciar servidor (opcional)
app.post('/api/whatsapp/restart', async (req, res) => {
  try {
    console.log('Reiniciando servidor WhatsApp...');
    
    // Limpar todas as sessões primeiro
    const sessions = Object.keys(whatsappClients || {});
    for (const agentId of sessions) {
      try {
        await clearSession(agentId);
      } catch (error) {
        console.error(\`Erro ao limpar \${agentId}:\`, error);
      }
    }
    
    res.json({
      success: true,
      message: 'Servidor reiniciado com sucesso',
      clearedSessions: sessions.length
    });
  } catch (error) {
    console.error('Erro no endpoint restart:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

console.log('✅ Endpoints de limpeza implementados!');
`;

  console.log('📝 Código para implementar no servidor WhatsApp:');
  console.log('=' .repeat(80));
  console.log(serverCode);
  console.log('=' .repeat(80));
  
  console.log('\n📋 INSTRUÇÕES DE IMPLEMENTAÇÃO:');
  console.log(`
  1. Acesse a VPS via SSH:
     ssh user@atendeai.lify.com.br
  
  2. Navegue até o diretório do servidor WhatsApp:
     cd /path/to/whatsapp-server
  
  3. Faça backup do arquivo atual:
     cp server.js server.js.backup
  
  4. Adicione o código acima ao final do arquivo server.js
  
  5. Reinicie o servidor:
     pm2 restart whatsapp-server
     # ou
     systemctl restart whatsapp-server
  
  6. Teste os endpoints:
     curl -X POST https://atendeai.lify.com.br/api/whatsapp/clear-sessions
curl -X GET https://atendeai.lify.com.br/api/whatsapp/sessions
  `);

  // Testar se os endpoints já existem
  console.log('\n🔍 Testando se os endpoints já existem...');
  
  const testEndpoints = [
    '/api/whatsapp/clear-sessions',
    '/api/whatsapp/disconnect',
    '/api/whatsapp/sessions',
    '/api/whatsapp/restart'
  ];

  for (const endpoint of testEndpoints) {
    try {
      const response = await makeRequest(endpoint, 'POST');
      console.log(`${endpoint}: ${response.status} ${response.status === 404 ? '❌ Não existe' : '✅ Existe'}`);
    } catch (error) {
      console.log(`${endpoint}: ❌ Erro - ${error.message}`);
    }
  }

  console.log('\n✅ Geração de código concluída!');
  console.log('💡 Implemente o código acima no servidor WhatsApp da VPS.');
}

generateServerCode(); 