#!/usr/bin/env node

import fetch from 'node-fetch';

console.log('🔍 Testando conectividade Frontend -> Backend');
console.log('============================================');

const BACKEND_URL = 'https://atendeai-backend-production.up.railway.app';
const TEST_AGENT_ID = '8aae1bc7-07b7-40ba-9ff3-e13fc32caa0b';

async function testBackendConnection() {
  try {
    console.log('\n1. Testando Health Check...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Health Check OK');
      console.log('   Status:', healthData.status);
      console.log('   Uptime:', Math.round(healthData.uptime / 60), 'minutos');
    } else {
      console.log('❌ Health Check falhou');
      console.log('   Status:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Erro no Health Check:', error.message);
  }

  try {
    console.log('\n2. Testando QR Code Generation...');
    const qrResponse = await fetch(`${BACKEND_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agentId: TEST_AGENT_ID
      })
    });
    
    const qrData = await qrResponse.json();
    
    if (qrResponse.ok) {
      console.log('✅ QR Code Generation OK');
      console.log('   Success:', qrData.success);
      console.log('   Message:', qrData.message);
    } else {
      console.log('❌ QR Code Generation falhou');
      console.log('   Status:', qrResponse.status);
      console.log('   Error:', qrData);
    }
  } catch (error) {
    console.log('❌ Erro no QR Code Generation:', error.message);
  }

  try {
    console.log('\n3. Testando CORS...');
    const corsResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://atendeai.lify.com.br',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✅ CORS Headers:', {
      'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
    });
  } catch (error) {
    console.log('❌ Erro no teste CORS:', error.message);
  }

  console.log('\n📋 Resumo:');
  console.log('   Backend URL:', BACKEND_URL);
  console.log('   Frontend URL:', 'https://atendeai.lify.com.br');
  console.log('   Test Agent ID:', TEST_AGENT_ID);
  
  console.log('\n🔧 Próximos passos se houver problemas:');
  console.log('   1. Verificar se o servidor está rodando');
  console.log('   2. Verificar configuração de CORS');
  console.log('   3. Verificar firewall/network');
  console.log('   4. Verificar variáveis de ambiente no frontend');
}

testBackendConnection(); 