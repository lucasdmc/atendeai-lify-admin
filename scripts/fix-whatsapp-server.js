#!/usr/bin/env node

/**
 * Script para diagnosticar e corrigir problemas do servidor WhatsApp
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Diagnosticando servidor WhatsApp...\n');

// Função para executar comando SSH
function sshCommand(command) {
  try {
    return execSync(`ssh -o StrictHostKeyChecking=no root@31.97.241.19 "${command}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
  } catch (error) {
    return error.stdout || error.message;
  }
}

// Função para verificar status do servidor
function checkServerStatus() {
  console.log('📊 Verificando status do servidor...');
  
  try {
    const response = execSync('curl -s http://31.97.241.19:3001/health', { encoding: 'utf8' });
    console.log('✅ Servidor HTTP respondendo:', response);
    return true;
  } catch (error) {
    console.log('❌ Servidor HTTP não responde:', error.message);
    return false;
  }
}

// Função para verificar processos
function checkProcesses() {
  console.log('\n🔍 Verificando processos...');
  
  const processes = sshCommand('ps aux | grep server-baileys');
  console.log('Processos encontrados:');
  console.log(processes);
  
  const pm2Status = sshCommand('pm2 status');
  console.log('\nStatus PM2:');
  console.log(pm2Status);
}

// Função para reiniciar servidor
function restartServer() {
  console.log('\n🔄 Reiniciando servidor...');
  
  // Parar processo atual
  sshCommand('pkill -f server-baileys');
  
  // Aguardar
  execSync('sleep 3');
  
  // Verificar se parou
  const stillRunning = sshCommand('ps aux | grep server-baileys | grep -v grep');
  if (stillRunning.trim()) {
    console.log('⚠️ Processo ainda rodando, forçando parada...');
    sshCommand('pkill -9 -f server-baileys');
    execSync('sleep 2');
  }
  
  // Iniciar novo servidor
  console.log('🚀 Iniciando novo servidor...');
  sshCommand('cd /root && nohup node server-baileys-http.js > server.log 2>&1 &');
  
  // Aguardar inicialização
  execSync('sleep 5');
  
  // Verificar se iniciou
  const newProcess = sshCommand('ps aux | grep server-baileys | grep -v grep');
  console.log('Novo processo:', newProcess);
}

// Função para testar geração de QR Code
function testQRGeneration() {
  console.log('\n🧪 Testando geração de QR Code...');
  
  try {
    const response = execSync('curl -s -X POST "http://31.97.241.19:3001/api/whatsapp/generate-qr" -H "Content-Type: application/json" -d \'{"agentId": "test-agent"}\' --max-time 30', { 
      encoding: 'utf8' 
    });
    console.log('Resposta do servidor:', response);
    
    const data = JSON.parse(response);
    if (data.success && data.qrCode) {
      console.log('✅ QR Code gerado com sucesso!');
      return true;
    } else {
      console.log('❌ Erro na geração:', data.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no teste:', error.message);
    return false;
  }
}

// Função para verificar logs
function checkLogs() {
  console.log('\n📋 Verificando logs...');
  
  const logs = sshCommand('tail -n 50 /root/server.log');
  console.log('Últimos logs:');
  console.log(logs);
}

// Função para verificar dependências
function checkDependencies() {
  console.log('\n📦 Verificando dependências...');
  
  const packageJson = sshCommand('cat /root/package.json');
  console.log('Package.json encontrado:', packageJson ? '✅' : '❌');
  
  const nodeModules = sshCommand('ls -la /root/node_modules/@whiskeysockets/baileys');
  console.log('Baileys instalado:', nodeModules ? '✅' : '❌');
}

// Função para corrigir problemas
function fixIssues() {
  console.log('\n🔧 Aplicando correções...');
  
  // Verificar se o arquivo existe
  const serverFile = sshCommand('ls -la /root/server-baileys-http.js');
  if (!serverFile.includes('server-baileys-http.js')) {
    console.log('❌ Arquivo do servidor não encontrado!');
    return false;
  }
  
  // Verificar se há erros de sintaxe
  const syntaxCheck = sshCommand('node -c /root/server-baileys-http.js');
  if (syntaxCheck.includes('SyntaxError')) {
    console.log('❌ Erro de sintaxe no servidor:', syntaxCheck);
    return false;
  }
  
  console.log('✅ Arquivo do servidor OK');
  
  // Reiniciar servidor
  restartServer();
  
  // Testar novamente
  return testQRGeneration();
}

// Função principal
async function main() {
  console.log('🎯 Diagnóstico completo do servidor WhatsApp\n');
  
  // 1. Verificar status atual
  const serverOk = checkServerStatus();
  
  // 2. Verificar processos
  checkProcesses();
  
  // 3. Verificar dependências
  checkDependencies();
  
  // 4. Testar geração de QR Code
  const qrOk = testQRGeneration();
  
  // 5. Se houver problemas, aplicar correções
  if (!serverOk || !qrOk) {
    console.log('\n⚠️ Problemas detectados, aplicando correções...');
    const fixed = fixIssues();
    
    if (fixed) {
      console.log('\n✅ Problemas corrigidos!');
    } else {
      console.log('\n❌ Não foi possível corrigir os problemas.');
      console.log('\n📋 Próximos passos:');
      console.log('   1. Conecte na VPS: ssh root@31.97.241.19');
      console.log('   2. Verifique os logs: tail -f /root/server.log');
      console.log('   3. Reinicie manualmente: pkill -f server-baileys && node server-baileys-http.js');
    }
  } else {
    console.log('\n✅ Servidor funcionando corretamente!');
  }
  
  // 6. Verificar logs finais
  checkLogs();
  
  console.log('\n🎉 Diagnóstico concluído!');
}

// Executar
main().catch(console.error); 