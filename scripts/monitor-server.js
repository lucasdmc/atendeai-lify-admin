#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔍 Monitorando servidor VPS...\n');
console.log('⏰ Aguardando servidor voltar online...\n');

let attempts = 0;
const maxAttempts = 60; // 5 minutos

function checkServer() {
  attempts++;
  
  try {
    console.log(`📡 Tentativa ${attempts}/${maxAttempts} - Testando conectividade...`);
    
    // Teste de ping
    const pingResult = execSync('ping -c 1 atendeai-backend-production.up.railway.app', { encoding: 'utf8' });
    console.log('✅ Ping OK - Servidor respondendo!');
    
    // Teste de porta
    try {
      const curlResult = execSync('curl -s --connect-timeout 5 https://atendeai-backend-production.up.railway.app/health', { encoding: 'utf8' });
      console.log('✅ Porta 3001 OK - Servidor WhatsApp funcionando!');
      console.log('   Resposta:', curlResult);
    } catch (curlError) {
      console.log('⚠️ Porta 3001 não responde ainda - Servidor pode estar inicializando...');
    }
    
    // Teste SSH
    try {
      const sshResult = execSync('ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@atendeai-backend-production.up.railway.app "echo OK"', { encoding: 'utf8' });
      console.log('✅ SSH OK - Conectividade completa!');
    } catch (sshError) {
      console.log('⚠️ SSH não responde ainda - Pode estar inicializando...');
    }
    
    console.log('\n🎉 SERVIDOR ONLINE!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Aguarde mais 1-2 minutos para inicialização completa');
    console.log('   2. Teste: ssh root@atendeai-backend-production.up.railway.app "pm2 list"');
    console.log('   3. Se necessário, reinicie o servidor WhatsApp');
    
    return true;
    
  } catch (error) {
    console.log(`❌ Tentativa ${attempts} falhou - Servidor ainda offline`);
    
    if (attempts >= maxAttempts) {
      console.log('\n⏰ Timeout - Servidor não voltou online em 5 minutos');
      console.log('📋 Verifique:');
      console.log('   1. Se a VPS realmente reiniciou no painel');
      console.log('   2. Se há problemas de hardware');
      console.log('   3. Se há problemas de rede');
      return false;
    }
    
    // Aguardar 5 segundos antes da próxima tentativa
    setTimeout(checkServer, 5000);
    return false;
  }
}

// Iniciar monitoramento
checkServer(); 