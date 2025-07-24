#!/usr/bin/env node

/**
 * Script para testar a integração end-to-end com ngrok
 * Testa a comunicação entre frontend e backend através do túnel ngrok
 */

const https = require('https');
const http = require('http');

// Configurações
const NGROK_URL = 'https://a89dcde95ccd.ngrok-free.app';
const FRONTEND_URL = 'http://localhost:8080';

// Função para fazer requisições HTTPS
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AtendeAí-Test/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Testes
async function runTests() {
  console.log('🧪 Iniciando testes de integração end-to-end...\n');

  // Teste 1: Verificar se o ngrok está acessível
  console.log('1️⃣ Testando acessibilidade do ngrok...');
  try {
    const healthResponse = await makeRequest(`${NGROK_URL}/health`);
    console.log(`✅ Ngrok acessível - Status: ${healthResponse.status}`);
    console.log(`📊 Health: ${JSON.stringify(healthResponse.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Erro ao acessar ngrok: ${error.message}\n`);
    return;
  }

  // Teste 2: Testar rota de status do WhatsApp
  console.log('2️⃣ Testando rota de status do WhatsApp...');
  try {
    const statusResponse = await makeRequest(`${NGROK_URL}/api/whatsapp-integration/status`);
    console.log(`✅ Status WhatsApp - Status: ${statusResponse.status}`);
    console.log(`📊 Resposta: ${JSON.stringify(statusResponse.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Erro ao verificar status WhatsApp: ${error.message}\n`);
  }

  // Teste 3: Testar geração de QR Code
  console.log('3️⃣ Testando geração de QR Code...');
  try {
    const qrResponse = await makeRequest(`${NGROK_URL}/api/whatsapp-integration/generate-qr`, {
      method: 'POST'
    });
    console.log(`✅ QR Code - Status: ${qrResponse.status}`);
    console.log(`📊 Resposta: ${JSON.stringify(qrResponse.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Erro ao gerar QR Code: ${error.message}\n`);
  }

  // Teste 4: Verificar se o frontend está acessível
  console.log('4️⃣ Testando acessibilidade do frontend...');
  try {
    const frontendResponse = await makeRequest(FRONTEND_URL);
    console.log(`✅ Frontend acessível - Status: ${frontendResponse.status}\n`);
  } catch (error) {
    console.log(`❌ Erro ao acessar frontend: ${error.message}\n`);
  }

  // Teste 5: Simular chamada do frontend para o backend
  console.log('5️⃣ Simulando chamada do frontend para o backend...');
  try {
    // Simular headers que o frontend enviaria
    const frontendResponse = await makeRequest(`${NGROK_URL}/api/whatsapp-integration/status`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Referer': `${FRONTEND_URL}/conectar-whatsapp`,
        'Accept': 'application/json',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    console.log(`✅ Chamada frontend→backend - Status: ${frontendResponse.status}`);
    console.log(`📊 Resposta: ${JSON.stringify(frontendResponse.data, null, 2)}\n`);
  } catch (error) {
    console.log(`❌ Erro na chamada frontend→backend: ${error.message}\n`);
  }

  console.log('🎉 Testes concluídos!');
  console.log('\n📋 Resumo:');
  console.log(`🔗 Ngrok URL: ${NGROK_URL}`);
  console.log(`🌐 Frontend URL: ${FRONTEND_URL}`);
  console.log(`📱 WhatsApp: ${FRONTEND_URL}/conectar-whatsapp`);
  console.log('\n💡 Para testar no navegador:');
  console.log(`1. Acesse: ${FRONTEND_URL}/conectar-whatsapp`);
  console.log(`2. Clique em "Conectar WhatsApp"`);
  console.log(`3. Verifique se a comunicação com o backend funciona`);
}

// Executar testes
runTests().catch(console.error); 