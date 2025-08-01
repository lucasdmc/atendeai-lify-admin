// ========================================
// VERIFICAR STATUS ATUAL DA VPS
// ========================================

import https from 'https';
import http from 'http';

// Configurações da VPS
const VPS_IP = '31.97.241.19';
const VPS_URL = 'https://atendeai.com.br';

async function checkVPSStatus() {
  console.log('🔍 VERIFICANDO STATUS ATUAL DA VPS');
  console.log('====================================\n');

  try {
    // 1. Verificar IP direto (porta 3001)
    console.log('📡 1. Verificando IP direto (porta 3001)...');
    
    const ipResponse = await makeBasicRequest(`http://${VPS_IP}:3001`);
    console.log(`   Status: ${ipResponse.statusCode}`);
    if (ipResponse.statusCode === 200) {
      console.log('   ✅ Servidor Node.js rodando na porta 3001');
      console.log(`   📝 Resposta: ${ipResponse.body.substring(0, 200)}...`);
    } else {
      console.log('   ❌ Servidor Node.js não está rodando na porta 3001');
    }
    console.log('');

    // 2. Verificar domínio (WordPress)
    console.log('🌐 2. Verificando domínio (WordPress)...');
    
    const domainResponse = await makeBasicRequest(VPS_URL);
    console.log(`   Status: ${domainResponse.statusCode}`);
    console.log(`   Servidor: ${domainResponse.headers['x-powered-by'] || 'N/A'}`);
    if (domainResponse.statusCode === 200) {
      console.log('   ✅ WordPress funcionando');
    }
    console.log('');

    // 3. Verificar se há proxy configurado
    console.log('🔄 3. Verificando proxy reverso...');
    
    const proxyEndpoints = [
      '/webhook/whatsapp-meta',
      '/api/whatsapp/generate-qr',
      '/health'
    ];

    for (const endpoint of proxyEndpoints) {
      console.log(`   Testando: ${endpoint}`);
      const response = await makeBasicRequest(`${VPS_URL}${endpoint}`);
      console.log(`     Status: ${response.statusCode}`);
      if (response.statusCode === 200) {
        console.log(`     ✅ Funcionando`);
      } else if (response.statusCode === 404) {
        console.log(`     ❌ Não encontrado (WordPress)`);
      } else {
        console.log(`     ⚠️ Status: ${response.statusCode}`);
      }
    }
    console.log('');

    // 4. Testar IP direto com endpoints
    console.log('🔧 4. Testando IP direto com endpoints...');
    
    for (const endpoint of proxyEndpoints) {
      console.log(`   Testando: http://${VPS_IP}:3001${endpoint}`);
      const response = await makeBasicRequest(`http://${VPS_IP}:3001${endpoint}`);
      console.log(`     Status: ${response.statusCode}`);
      if (response.statusCode === 200) {
        console.log(`     ✅ Funcionando`);
      } else {
        console.log(`     ❌ Não funcionando`);
      }
    }
    console.log('');

    // 5. Análise do problema
    console.log('📊 ANÁLISE DO PROBLEMA');
    console.log('========================');
    
    if (ipResponse.statusCode === 200) {
      console.log('✅ Servidor Node.js está rodando na porta 3001');
      console.log('❌ Mas não há proxy reverso configurado no Nginx');
      console.log('💡 SOLUÇÃO: Configurar proxy reverso no Nginx');
    } else {
      console.log('❌ Servidor Node.js não está rodando na porta 3001');
      console.log('💡 SOLUÇÃO: Iniciar o servidor Node.js na VPS');
    }
    console.log('');

    // 6. Comandos para corrigir
    console.log('🔧 COMANDOS PARA CORRIGIR');
    console.log('==========================');
    console.log('1. Conectar na VPS:');
    console.log(`   ssh root@${VPS_IP}`);
    console.log('');
    console.log('2. Verificar se o servidor está rodando:');
    console.log('   pm2 status');
    console.log('   ps aux | grep node');
    console.log('   netstat -tlnp | grep :3001');
    console.log('');
    console.log('3. Se não estiver rodando, iniciar:');
    console.log('   cd /path/to/atendeai-lify-admin');
    console.log('   pm2 start server.js --name "atendeai-backend"');
    console.log('');
    console.log('4. Configurar Nginx (se necessário):');
    console.log('   nano /etc/nginx/sites-available/atendeai.com.br');
    console.log('   systemctl restart nginx');

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

/**
 * Faz uma requisição básica para verificar conectividade
 */
function makeBasicRequest(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 0,
        headers: {},
        body: '',
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        statusCode: 0,
        headers: {},
        body: '',
        error: 'Timeout'
      });
    });
  });
}

// Executar verificação
checkVPSStatus(); 