#!/usr/bin/env node

// Script para testar se o problema de produção foi resolvido
import fetch from 'node-fetch';

console.log('🧪 TESTANDO CORREÇÃO DO PROBLEMA DE PRODUÇÃO');
console.log('============================================');

// 1. Testar servidor local
async function testLocalServer() {
  console.log('\n🖥️ Testando servidor local...');
  try {
    const response = await fetch('https://localhost:3001/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Servidor local funcionando:', data.status);
      return true;
    } else {
      console.log('❌ Servidor local não respondeu:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com servidor local:', error.message);
    return false;
  }
}

// 2. Testar geração de QR Code
async function testQRCodeGeneration() {
  console.log('\n📱 Testando geração de QR Code...');
  try {
    const response = await fetch('https://localhost:3001/api/whatsapp/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test-agent' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ QR Code gerado com sucesso');
      console.log('   - Status:', data.status);
      console.log('   - QR Code presente:', !!data.qrCode);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao gerar QR Code:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao gerar QR Code:', error.message);
    return false;
  }
}

// 3. Testar conectividade externa
async function testExternalConnectivity() {
  console.log('\n🌐 Testando conectividade externa...');
  try {
    const response = await fetch('http://31.97.241.19:3001/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ VPS acessível externamente:', data.status);
      return true;
    } else {
      console.log('❌ VPS não acessível:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com VPS:', error.message);
    return false;
  }
}

// 4. Verificar configurações
function checkConfigurations() {
  console.log('\n📋 Verificando configurações...');
  
  const configs = [
    { name: '.env', path: '.env' },
    { name: '.env.production', path: '.env.production' },
    { name: 'lovable.json', path: 'lovable.json' },
    { name: 'lify.json', path: 'lify.json' }
  ];
  
  let allCorrect = true;
  
  configs.forEach(config => {
    try {
      const fs = require('fs');
      if (fs.existsSync(config.path)) {
        const content = fs.readFileSync(config.path, 'utf8');
        if (content.includes('seu-servidor-vps.com')) {
          console.log(`❌ ${config.name} ainda tem URL incorreta`);
          allCorrect = false;
        } else if (content.includes('31.97.241.19')) {
          console.log(`✅ ${config.name} está correto`);
        } else {
          console.log(`⚠️ ${config.name} não tem URL do servidor`);
        }
      } else {
        console.log(`⚠️ ${config.name} não encontrado`);
      }
    } catch (error) {
      console.log(`❌ Erro ao verificar ${config.name}:`, error.message);
      allCorrect = false;
    }
  });
  
  return allCorrect;
}

// 5. Simular teste de produção
async function simulateProductionTest() {
  console.log('\n🎭 Simulando teste de produção...');
  
  // Simular a chamada que está falhando em produção
  try {
    const response = await fetch('https://localhost:3001/api/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test-agent' })
    });
    
    if (response.ok) {
      console.log('✅ Endpoint /disconnect funcionando');
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Endpoint /disconnect falhou:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no endpoint /disconnect:', error.message);
    return false;
  }
}

// Função principal
async function runTests() {
  console.log('🚀 Iniciando testes...\n');
  
  const results = {
    localServer: await testLocalServer(),
    qrCode: await testQRCodeGeneration(),
    external: await testExternalConnectivity(),
    configs: checkConfigurations(),
    production: await simulateProductionTest()
  };
  
  console.log('\n📊 RESULTADOS DOS TESTES:');
  console.log('==========================');
  console.log(`🖥️ Servidor Local: ${results.localServer ? '✅' : '❌'}`);
  console.log(`📱 QR Code: ${results.qrCode ? '✅' : '❌'}`);
  console.log(`🌐 Conectividade Externa: ${results.external ? '✅' : '❌'}`);
  console.log(`📋 Configurações: ${results.configs ? '✅' : '❌'}`);
  console.log(`🎭 Teste Produção: ${results.production ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  console.log('\n🎯 DIAGNÓSTICO FINAL:');
  console.log('======================');
  
  if (allPassed) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    console.log('✅ O sistema está funcionando corretamente');
    console.log('✅ O problema pode estar apenas no cache do navegador');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('1. Limpe o cache do navegador (Ctrl+F5)');
    console.log('2. Teste em produção: https://atendeai.lify.com.br');
    console.log('3. Se ainda houver problemas, verifique as variáveis de ambiente no Lovable');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM');
    console.log('🔧 Verifique os problemas acima');
    console.log('📞 Execute: ./scripts/force-production-fix.sh');
  }
}

// Executar testes
runTests().catch(console.error); 