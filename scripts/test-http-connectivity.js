#!/usr/bin/env node

/**
 * Script para testar conectividade HTTP com servidor Baileys
 * Testa se o frontend consegue se conectar ao servidor HTTP
 */

import https from 'https';
import http from 'http';

const VPS_URL = 'https://atendeai-backend-production.up.railway.app';
const LOCAL_URL = 'http://localhost:3001';

console.log('🔍 Testando conectividade HTTP com servidor Baileys...\n');

// Função para testar conectividade HTTP
async function testHttpConnectivity(url, description) {
  console.log(`📡 Testando ${description}: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description} - Status: ${response.status}`);
      console.log(`   Resposta:`, data);
      return true;
    } else {
      console.log(`❌ ${description} - Status: ${response.status}`);
      console.log(`   Erro: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Erro de conectividade:`);
    console.log(`   ${error.message}`);
    return false;
  }
}

// Função para testar endpoint específico
async function testEndpoint(url, endpoint, description) {
  const fullUrl = `${url}${endpoint}`;
  console.log(`\n🔗 Testando endpoint: ${fullUrl}`);
  
  try {
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${description} - Status: ${response.status}`);
      console.log(`   Resposta:`, data);
      return true;
    } else {
      console.log(`❌ ${description} - Status: ${response.status}`);
      console.log(`   Erro: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${description} - Erro de conectividade:`);
    console.log(`   ${error.message}`);
    return false;
  }
}

// Função para testar CORS
async function testCORS(url, description) {
  console.log(`\n🌐 Testando CORS para ${description}: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://atendeai.lify.com.br',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 5000
    });

    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
    };

    console.log(`✅ CORS ${description} - Status: ${response.status}`);
    console.log(`   Headers:`, corsHeaders);
    return true;
  } catch (error) {
    console.log(`❌ CORS ${description} - Erro:`);
    console.log(`   ${error.message}`);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes de conectividade HTTP...\n');

  // Teste 1: Conectividade básica
  const localConnectivity = await testHttpConnectivity(LOCAL_URL, 'Servidor Local');
  const vpsConnectivity = await testHttpConnectivity(VPS_URL, 'Servidor VPS');

  // Teste 2: Endpoints específicos
  if (localConnectivity) {
    await testEndpoint(LOCAL_URL, '/health', 'Health Check Local');
    await testEndpoint(LOCAL_URL, '/api/whatsapp/status/test-agent', 'Status WhatsApp Local');
  }

  if (vpsConnectivity) {
    await testEndpoint(VPS_URL, '/health', 'Health Check VPS');
    await testEndpoint(VPS_URL, '/api/whatsapp/status/test-agent', 'Status WhatsApp VPS');
  }

  // Teste 3: CORS
  await testCORS(LOCAL_URL, 'Local');
  await testCORS(VPS_URL, 'VPS');

  // Teste 4: Simular chamada do frontend
  console.log('\n🎯 Simulando chamada do frontend...');
  
  try {
    const response = await fetch(`${VPS_URL}/api/whatsapp/generate-qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://atendeai.lify.com.br'
      },
      body: JSON.stringify({ agentId: 'test-agent' }),
      timeout: 10000
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Frontend consegue conectar ao servidor VPS');
      console.log('   Resposta:', data);
    } else {
      console.log('❌ Frontend não consegue conectar ao servidor VPS');
      console.log(`   Status: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Erro na simulação do frontend:');
    console.log(`   ${error.message}`);
  }

  console.log('\n📊 Resumo dos testes:');
  console.log(`   Local: ${localConnectivity ? '✅ Conectado' : '❌ Desconectado'}`);
  console.log(`   VPS: ${vpsConnectivity ? '✅ Conectado' : '❌ Desconectado'}`);
  
  if (vpsConnectivity) {
    console.log('\n🎉 Servidor HTTP está funcionando corretamente!');
    console.log('   O frontend deve conseguir se conectar sem problemas de CORS ou SSL.');
  } else {
    console.log('\n⚠️ Servidor VPS não está respondendo.');
    console.log('   Verifique se o servidor está rodando na VPS.');
  }
}

// Executar testes
runTests().catch(console.error); 