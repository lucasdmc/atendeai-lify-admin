#!/usr/bin/env node

const fetch = require('node-fetch').default;
const http = require('http');

console.log('🧪 Testando Integração Completa - AtendeAI\n');

// Configurações
const VPS_URL = 'http://31.97.241.19:3001';

// Detectar porta do frontend automaticamente
function detectFrontendPort() {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const req = http.get({ hostname: 'localhost', port, path: '/', timeout: 1000 }, (res) => {
        if (res.statusCode === 200) {
          resolve(`http://localhost:${port}`);
        } else {
          if (port === 8080) tryPort(8081);
          else resolve(null);
        }
        res.resume();
      });
      req.on('error', () => {
        if (port === 8080) tryPort(8081);
        else resolve(null);
      });
    };
    tryPort(8080);
  });
}

// Função para testar VPS
async function testVPS() {
  console.log('1️⃣ Testando VPS...');
  try {
    const healthResponse = await fetch(`${VPS_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ VPS está online');
      console.log(`   📊 Status: ${healthData.status}`);
      console.log(`   📊 Sessões ativas: ${healthData.activeSessions}`);
    } else {
      console.log(`❌ VPS retornou status ${healthResponse.status}`);
      return false;
    }
    const qrResponse = await fetch(`${VPS_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test-integration' })
    });
    if (qrResponse.ok) {
      const qrData = await qrResponse.json();
      console.log('✅ Geração de QR Code funcionando');
      console.log(`   📊 Resposta: ${JSON.stringify(qrData)}`);
    } else {
      console.log(`❌ Geração de QR Code falhou: ${qrResponse.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar VPS:', error.message);
    return false;
  }
}

// Função para testar Frontend
async function testFrontend(FRONTEND_URL) {
  console.log('\n2️⃣ Testando Frontend...');
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      console.log('✅ Frontend está online');
      console.log(`   📊 Status: ${response.status}`);
    } else {
      console.log(`❌ Frontend retornou status ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar Frontend:', error.message);
    return false;
  }
}

// Função para testar integração completa
async function testCompleteIntegration(FRONTEND_URL) {
  console.log('\n3️⃣ Testando Integração Completa...');
  try {
    const integrationResponse = await fetch(`${VPS_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL
      },
      body: JSON.stringify({
        agentId: 'frontend-test',
        source: 'frontend'
      })
    });
    if (integrationResponse.ok) {
      const data = await integrationResponse.json();
      console.log('✅ Integração funcionando');
      console.log(`   📊 Resposta: ${JSON.stringify(data)}`);
      return true;
    } else {
      console.log(`❌ Integração falhou: ${integrationResponse.status}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na integração:', error.message);
    return false;
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando testes de integração...\n');
  const FRONTEND_URL = await detectFrontendPort();
  if (!FRONTEND_URL) {
    console.log('❌ Não foi possível detectar o frontend rodando nas portas 8080 ou 8081.');
    return;
  }
  const vpsOk = await testVPS();
  const frontendOk = await testFrontend(FRONTEND_URL);
  const integrationOk = await testCompleteIntegration(FRONTEND_URL);
  // Resumo final
  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('='.repeat(50));
  console.log(`✅ VPS: ${vpsOk ? 'Funcionando' : 'Falhou'}`);
  console.log(`✅ Frontend: ${frontendOk ? 'Funcionando' : 'Falhou'}`);
  console.log(`✅ Integração: ${integrationOk ? 'Funcionando' : 'Falhou'}`);
  if (vpsOk && frontendOk && integrationOk) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM!');
    console.log('\n📝 Próximos passos:');
    console.log(`1. Acesse: ${FRONTEND_URL}`);
    console.log('2. Vá para a página de Agentes');
    console.log('3. Clique no botão QR Code');
    console.log('4. Teste a conexão WhatsApp');
  } else {
    console.log('\n⚠️  ALGUNS TESTES FALHARAM');
    console.log('Verifique as configurações e tente novamente');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testVPS,
  testFrontend,
  testCompleteIntegration
}; 