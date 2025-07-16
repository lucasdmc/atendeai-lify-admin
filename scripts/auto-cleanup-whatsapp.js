import https from 'https';

const WHATSAPP_SERVER_URL = 'https://atendeai.lify.com.br';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function autoCleanup() {
  console.log('🧹 Iniciando limpeza automática de sessões WhatsApp...\n');

  try {
    // 1. Verificar status atual
    console.log('1️⃣ Verificando sessões ativas...');
    const healthResponse = await makeRequest('/health');
    
    if (healthResponse.status !== 200) {
      throw new Error('Servidor WhatsApp não está respondendo');
    }

    const sessions = healthResponse.data.sessions || [];
    console.log(`Sessões encontradas: ${sessions.length}`);

    if (sessions.length === 0) {
      console.log('✅ Nenhuma sessão para limpar.');
      return;
    }

    // 2. Analisar sessões problemáticas
    console.log('\n2️⃣ Analisando sessões...');
    const problematicSessions = [];
    const normalSessions = [];

    for (const session of sessions) {
      console.log(`- ${session.agentId}: ${session.status} (${session.connected ? 'Conectado' : 'Desconectado'})`);
      
      // Identificar sessões problemáticas
      if (session.status === 'qr' && !session.connected) {
        problematicSessions.push(session);
      } else if (session.status === 'connecting' && !session.connected) {
        problematicSessions.push(session);
      } else {
        normalSessions.push(session);
      }
    }

    console.log(`\nSessões normais: ${normalSessions.length}`);
    console.log(`Sessões problemáticas: ${problematicSessions.length}`);

    // 3. Limpar sessões problemáticas
    if (problematicSessions.length > 0) {
      console.log('\n3️⃣ Limpando sessões problemáticas...');
      
      let clearedCount = 0;
      const errors = [];

      for (const session of problematicSessions) {
        try {
          console.log(`Limpando: ${session.agentId}`);
          
          // Tentar desconectar
          const disconnectResponse = await makeRequest('/api/whatsapp/disconnect', 'POST', {
            agentId: session.agentId,
            whatsappNumber: session.whatsappNumber || 'temp',
            connectionId: session.connectionId || 'temp'
          });

          if (disconnectResponse.status === 200) {
            clearedCount++;
            console.log(`✅ Limpo: ${session.agentId}`);
          } else {
            errors.push(`Falha ao limpar ${session.agentId}: ${disconnectResponse.status}`);
            console.log(`❌ Falha: ${session.agentId} (${disconnectResponse.status})`);
          }
        } catch (error) {
          errors.push(`Erro ao limpar ${session.agentId}: ${error.message}`);
          console.log(`❌ Erro: ${session.agentId} - ${error.message}`);
        }
      }

      console.log(`\nLimpeza concluída: ${clearedCount}/${problematicSessions.length} sessões limpas`);
      
      if (errors.length > 0) {
        console.log('\nErros encontrados:');
        errors.forEach(error => console.log(`- ${error}`));
      }
    }

    // 4. Verificar resultado final
    console.log('\n4️⃣ Verificando resultado final...');
    const finalHealth = await makeRequest('/health');
    const finalSessions = finalHealth.data.sessions || [];
    
    console.log(`Sessões restantes: ${finalSessions.length}`);
    
    if (finalSessions.length > 0) {
      console.log('Sessões ativas:');
      finalSessions.forEach(session => {
        console.log(`- ${session.agentId}: ${session.status} (${session.connected ? 'Conectado' : 'Desconectado'})`);
      });
    }

    // 5. Gerar relatório
    const report = {
      timestamp: new Date().toISOString(),
      totalSessions: sessions.length,
      problematicSessions: problematicSessions.length,
      clearedSessions: problematicSessions.length - finalSessions.length,
      remainingSessions: finalSessions.length,
      errors: errors || []
    };

    console.log('\n📊 RELATÓRIO DE LIMPEZA:');
    console.log(`Data/Hora: ${report.timestamp}`);
    console.log(`Total de sessões: ${report.totalSessions}`);
    console.log(`Sessões problemáticas: ${report.problematicSessions}`);
    console.log(`Sessões limpas: ${report.clearedSessions}`);
    console.log(`Sessões restantes: ${report.remainingSessions}`);
    
    if (report.errors.length > 0) {
      console.log(`Erros: ${report.errors.length}`);
    }

    // 6. Salvar log (opcional)
    const logEntry = {
      ...report,
      action: 'auto-cleanup',
      success: report.clearedSessions > 0 || report.problematicSessions === 0
    };

    console.log('\n✅ Limpeza automática concluída!');
    
    return logEntry;

  } catch (error) {
    console.error('❌ Erro durante limpeza automática:', error.message);
    throw error;
  }
}

// Função para executar limpeza periódica
async function scheduleCleanup() {
  console.log('⏰ Configurando limpeza automática...\n');
  
  // Executar limpeza imediatamente
  try {
    await autoCleanup();
  } catch (error) {
    console.error('Erro na limpeza:', error.message);
  }

  // Configurar para executar a cada 6 horas
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  
  setInterval(async () => {
    console.log('\n🔄 Executando limpeza programada...');
    try {
      await autoCleanup();
    } catch (error) {
      console.error('Erro na limpeza programada:', error.message);
    }
  }, SIX_HOURS);

  console.log(`\n✅ Limpeza automática configurada para executar a cada 6 horas.`);
  console.log('💡 Para parar, pressione Ctrl+C');
}

// Executar baseado no argumento
const args = process.argv.slice(2);
const command = args[0];

if (command === 'schedule') {
  scheduleCleanup();
} else {
  // Execução única
  autoCleanup()
    .then(() => {
      console.log('\n✅ Limpeza concluída com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro na limpeza:', error.message);
      process.exit(1);
    });
} 