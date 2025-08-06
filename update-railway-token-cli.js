// ========================================
// ATUALIZAR TOKEN NO RAILWAY VIA CLI
// ========================================

import https from 'https';
import readline from 'readline';

const NEW_TOKEN = 'EAASAuWYr9JgBPMqHgblvK7w1gPofY3k8BoWnYaT8u2u085ZATp2wgHJSoHMDOyqFDNBAWx3Rt7ZB55Vsb4AAEyZAWYbDR98R11naVrPn3Uk83d9UeQOp3RFqmdgXxZCZAwyJPDjvsBFF74AcAthQhRdr12vq9vGaj6tZAiQtWLOFY9ZBv2Wuo5KcWGr6HyyPG0hIpO5ZCuqjuKkCZBsJZBF29SPjeP3dIAZAVZB9EwM0wWcToonn26DHPzaR2YqNsgZDZD';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function updateRailwayTokenCLI() {
  console.log('🔄 ATUALIZANDO TOKEN NO RAILWAY VIA CLI');
  console.log('==========================================\n');

  try {
    // 1. Solicitar token da API do Railway
    console.log('🔑 1. Para atualizar via CLI, você precisa do token da API do Railway');
    console.log('⚠️  Para obter o token:');
    console.log('   1. Acesse: https://railway.app/dashboard');
    console.log('   2. Vá em: Settings → Tokens');
    console.log('   3. Clique em "Create Token"');
    console.log('   4. Copie o token (começa com rw_...)');
    console.log('');

    const railwayToken = await new Promise((resolve) => {
      rl.question('🔑 Cole o token da API do Railway (rw_...): ', (answer) => {
        resolve(answer.trim());
      });
    });

    if (!railwayToken.startsWith('rw_')) {
      console.log('❌ Token inválido! Deve começar com "rw_"');
      rl.close();
      return;
    }

    // 2. Solicitar Project ID
    console.log('\n📁 2. Agora precisamos do Project ID');
    console.log('⚠️  Para obter o Project ID:');
    console.log('   1. Acesse: https://railway.app/dashboard');
    console.log('   2. Selecione o projeto: atendeai-lify-backend');
    console.log('   3. Copie o Project ID da URL ou das configurações');
    console.log('');

    const projectId = await new Promise((resolve) => {
      rl.question('📁 Cole o Project ID: ', (answer) => {
        resolve(answer.trim());
      });
    });

    // 3. Atualizar variável via API
    console.log('\n⚙️ 3. Atualizando token via API do Railway...');
    
    const updateResult = await updateRailwayVariable(railwayToken, projectId, 'WHATSAPP_META_ACCESS_TOKEN', NEW_TOKEN);
    
    if (updateResult.success) {
      console.log('✅ Token atualizado com sucesso!');
      console.log('⏳ Aguarde 1-2 minutos para o deploy automático...');
    } else {
      console.log('❌ Erro ao atualizar token:', updateResult.error);
    }

    // 4. Testar após atualização
    console.log('\n🧪 4. Testando após atualização...');
    console.log('Aguarde 2 minutos e depois execute:');
    console.log('node test-railway-token.js');
    console.log('');

    console.log('✅ ATUALIZAÇÃO CONCLUÍDA!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Erro na atualização:', error.message);
  } finally {
    rl.close();
  }
}

async function updateRailwayVariable(token, projectId, variableName, variableValue) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: variableName,
      value: variableValue
    });

    const options = {
      hostname: 'backboard.railway.app',
      port: 443,
      path: `/graphql/v2`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: responseData });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.write(data);
    req.end();
  });
}

// Executar atualização
updateRailwayTokenCLI(); 