#!/usr/bin/env node

import fetch from 'node-fetch';
import https from 'https';

const VPS_URL = 'http://31.97.241.19:3001';
const LOCAL_URL = 'https://localhost:3001';

// Configuração para ignorar certificados SSL auto-assinados
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

async function testEndpoint(url, endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      agent: httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`🔍 Testando: ${method} ${url}${endpoint}`);
    
    const response = await fetch(`${url}${endpoint}`, options);
    const responseText = await response.text();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📄 Resposta: ${responseText.substring(0, 200)}...`);
    
    return {
      success: response.ok,
      status: response.status,
      data: responseText
    };
  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

async function diagnoseProductionIssues() {
  console.log('🔧 DIAGNÓSTICO DE CONECTIVIDADE EM PRODUÇÃO');
  console.log('=' .repeat(50));

  // Teste 1: Health check local
  console.log('\n1️⃣ Testando servidor local...');
  const localHealth = await testEndpoint(LOCAL_URL, '/health');
  
  if (localHealth.success) {
    console.log('✅ Servidor local funcionando');
  } else {
    console.log('❌ Servidor local com problemas');
  }

  // Teste 2: Health check VPS
  console.log('\n2️⃣ Testando servidor VPS...');
  const vpsHealth = await testEndpoint(VPS_URL, '/health');
  
  if (vpsHealth.success) {
    console.log('✅ Servidor VPS funcionando');
  } else {
    console.log('❌ Servidor VPS com problemas');
  }

  // Teste 3: Disconnect endpoint local
  console.log('\n3️⃣ Testando endpoint disconnect local...');
  const localDisconnect = await testEndpoint(LOCAL_URL, '/api/whatsapp/disconnect', 'POST', {
    agentId: 'test-agent'
  });

  // Teste 4: Disconnect endpoint VPS
  console.log('\n4️⃣ Testando endpoint disconnect VPS...');
  const vpsDisconnect = await testEndpoint(VPS_URL, '/api/whatsapp/disconnect', 'POST', {
    agentId: 'test-agent'
  });

  // Teste 5: Verificar se o servidor está rodando na VPS
  console.log('\n5️⃣ Verificando se o processo está rodando na VPS...');
  
  try {
    const processCheck = await fetch('http://31.97.241.19:3001', {
      agent: httpsAgent,
      timeout: 5000
    });
    console.log(`📊 Status do servidor: ${processCheck.status}`);
  } catch (error) {
    console.log(`❌ Servidor não responde: ${error.message}`);
  }

  // Análise dos resultados
  console.log('\n📋 ANÁLISE DOS RESULTADOS');
  console.log('=' .repeat(30));

  if (!vpsHealth.success) {
    console.log('🚨 PROBLEMA IDENTIFICADO: Servidor VPS não está respondendo');
    console.log('💡 SOLUÇÕES:');
    console.log('   1. Verificar se o servidor está rodando na VPS');
    console.log('   2. Verificar firewall e portas');
    console.log('   3. Verificar certificados SSL');
    console.log('   4. Reiniciar o servidor na VPS');
  }

  if (localHealth.success && !vpsHealth.success) {
    console.log('✅ Servidor local funciona, problema é na VPS');
  }

  if (localDisconnect.success && !vpsDisconnect.success) {
    console.log('🚨 Endpoint disconnect funciona localmente mas não na VPS');
  }
}

async function fixProductionServer() {
  console.log('\n🔧 TENTANDO CORRIGIR SERVIDOR DE PRODUÇÃO');
  console.log('=' .repeat(40));

  // Verificar se há processos rodando
  console.log('1️⃣ Verificando processos na VPS...');
  
  try {
    const response = await fetch('http://31.97.241.19:3001/health', {
      agent: httpsAgent,
      timeout: 3000
    });
    
    if (response.ok) {
      console.log('✅ Servidor está rodando na VPS');
      return;
    }
  } catch (error) {
    console.log('❌ Servidor não está respondendo na VPS');
  }

  console.log('💡 RECOMENDAÇÕES PARA CORRIGIR:');
  console.log('');
  console.log('1. Conectar via SSH na VPS:');
  console.log('   ssh root@31.97.241.19');
  console.log('');
  console.log('2. Verificar se o processo está rodando:');
  console.log('   ps aux | grep server-baileys');
  console.log('');
  console.log('3. Se não estiver rodando, iniciar:');
  console.log('   cd /root/atendeai-lify-admin');
  console.log('   node server-baileys-production.js');
  console.log('');
  console.log('4. Para rodar em background:');
  console.log('   nohup node server-baileys-production.js > server.log 2>&1 &');
  console.log('');
  console.log('5. Verificar logs:');
  console.log('   tail -f server.log');
}

async function main() {
  await diagnoseProductionIssues();
  await fixProductionServer();
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('1. Conectar na VPS e verificar se o servidor está rodando');
  console.log('2. Se não estiver, iniciar o servidor Baileys');
  console.log('3. Verificar se as variáveis de ambiente estão corretas');
  console.log('4. Testar conectividade novamente');
}

main().catch(console.error); 