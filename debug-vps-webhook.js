// ========================================
// DEBUG DO WEBHOOK NA VPS
// ========================================

import https from 'https';
import http from 'http';

// Configurações da VPS
const VPS_URL = 'https://atendeai.com.br';

async function debugVPSWebhook() {
  console.log('🔍 DEBUGANDO WEBHOOK NA VPS');
  console.log('==============================\n');

  try {
    // 1. Verificar se a VPS responde
    console.log('📡 1. Testando conectividade básica...');
    
    const basicResponse = await makeBasicRequest(VPS_URL);
    console.log(`   Status: ${basicResponse.statusCode}`);
    console.log(`   Headers: ${JSON.stringify(basicResponse.headers, null, 2)}`);
    console.log('');

    // 2. Verificar diferentes endpoints
    console.log('🧪 2. Testando diferentes endpoints...');
    
    const endpoints = [
      '/',
      '/webhook',
      '/webhook/whatsapp-meta',
      '/webhook/test',
      '/api',
      '/api/ai',
      '/health'
    ];

    for (const endpoint of endpoints) {
      console.log(`   Testando: ${endpoint}`);
      const response = await makeBasicRequest(`${VPS_URL}${endpoint}`);
      console.log(`     Status: ${response.statusCode}`);
      console.log(`     Content-Type: ${response.headers['content-type'] || 'N/A'}`);
      if (response.body) {
        console.log(`     Body: ${response.body.substring(0, 200)}...`);
      }
      console.log('');
    }

    // 3. Verificar se há redirecionamento
    console.log('🔄 3. Verificando redirecionamentos...');
    
    const redirectResponse = await makeRequestWithRedirects(VPS_URL);
    console.log(`   URL final: ${redirectResponse.url}`);
    console.log(`   Status: ${redirectResponse.statusCode}`);
    console.log('');

    // 4. Testar POST no webhook
    console.log('📨 4. Testando POST no webhook...');
    
    const webhookData = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: '5511999999999',
              text: { body: 'Teste' },
              timestamp: Date.now()
            }]
          }
        }]
      }]
    };

    const postResponse = await makeRequest(`${VPS_URL}/webhook/whatsapp-meta`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Webhook-Test'
      },
      body: JSON.stringify(webhookData)
    });

    console.log(`   POST Status: ${postResponse.statusCode}`);
    console.log(`   POST Success: ${postResponse.success}`);
    if (postResponse.data) {
      console.log(`   POST Response: ${JSON.stringify(postResponse.data, null, 2)}`);
    }
    console.log('');

    // 5. Verificar logs da VPS
    console.log('📋 5. Verificando logs da VPS...');
    console.log('   (Isso requer acesso SSH à VPS)');
    console.log('   Comandos para verificar:');
    console.log('   - ssh root@atendeai.com.br');
    console.log('   - pm2 status');
    console.log('   - pm2 logs');
    console.log('   - systemctl status nginx');
    console.log('   - tail -f /var/log/nginx/access.log');
    console.log('');

    // 6. Resumo dos problemas
    console.log('❌ PROBLEMAS IDENTIFICADOS');
    console.log('==========================');
    console.log('1. Endpoints não estão respondendo corretamente');
    console.log('2. Possível problema de configuração do servidor');
    console.log('3. Possível problema de roteamento');
    console.log('4. Possível problema de SSL/HTTPS');
    console.log('');
    console.log('💡 SOLUÇÕES SUGERIDAS');
    console.log('=======================');
    console.log('1. Verificar se o servidor Node.js está rodando na VPS');
    console.log('2. Verificar configuração do Nginx');
    console.log('3. Verificar logs do servidor');
    console.log('4. Verificar se as rotas estão corretas');
    console.log('5. Verificar se o SSL está funcionando');

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

/**
 * Faz uma requisição com verificação de redirecionamentos
 */
function makeRequestWithRedirects(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url: url,
        statusCode: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({
        url: url,
        statusCode: 0,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url: url,
        statusCode: 0,
        error: 'Timeout'
      });
    });
  });
}

/**
 * Faz uma requisição HTTP
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = protocol.request(url, requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            data: jsonData,
            statusCode: res.statusCode
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Invalid JSON response',
            statusCode: res.statusCode,
            rawData: data
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        error: error.message
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout'
      });
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Executar debug
debugVPSWebhook(); 