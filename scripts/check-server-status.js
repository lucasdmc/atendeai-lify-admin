#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🔍 Verificando status do servidor...\n');

function checkServerStatus() {
  try {
    console.log('1. Testando conectividade básica...');
    const pingResult = execSync('ping -c 3 31.97.241.19', { encoding: 'utf8' });
    console.log('✅ Servidor responde ao ping');
    console.log(pingResult);
  } catch (error) {
    console.log('❌ Servidor não responde ao ping');
    console.log('   Erro:', error.message);
  }

  try {
    console.log('\n2. Testando porta 3001...');
    const curlResult = execSync('curl -s --connect-timeout 10 http://31.97.241.19:3001/health', { encoding: 'utf8' });
    console.log('✅ Servidor responde na porta 3001');
    console.log('   Resposta:', curlResult);
  } catch (error) {
    console.log('❌ Servidor não responde na porta 3001');
    console.log('   Erro:', error.message);
  }

  try {
    console.log('\n3. Testando SSH...');
    const sshResult = execSync('ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no root@31.97.241.19 "echo OK"', { encoding: 'utf8' });
    console.log('✅ SSH funcionando');
    console.log('   Resposta:', sshResult);
  } catch (error) {
    console.log('❌ SSH não está funcionando');
    console.log('   Erro:', error.message);
  }

  console.log('\n📋 Diagnóstico:');
  console.log('   - Se ping falhar: Servidor offline ou problema de rede');
  console.log('   - Se porta 3001 falhar: Servidor offline ou processo travado');
  console.log('   - Se SSH falhar: Problema de conectividade ou credenciais');
  
  console.log('\n🛠️ Soluções possíveis:');
  console.log('   1. Verificar se a VPS está online no painel de controle');
  console.log('   2. Reiniciar a VPS se necessário');
  console.log('   3. Verificar firewall e configurações de rede');
  console.log('   4. Aguardar alguns minutos e tentar novamente');
}

checkServerStatus(); 