#!/usr/bin/env node

/**
 * Script para fazer deploy automático no Lify com configurações HTTP
 * Resolve o problema de acesso ao dashboard
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando deploy automático no Lify...\n');

// Verificar se estamos no diretório correto
const currentDir = process.cwd();
const lifyJsonPath = path.join(currentDir, 'lify.json');
const lovableJsonPath = path.join(currentDir, 'lovable.json');

if (!fs.existsSync(lifyJsonPath)) {
  console.error('❌ Arquivo lify.json não encontrado!');
  console.log('   Certifique-se de estar no diretório atendeai-lify-admin');
  process.exit(1);
}

// Verificar se as configurações estão corretas
function checkConfigurations() {
  console.log('🔍 Verificando configurações...');
  
  try {
    const lifyConfig = JSON.parse(fs.readFileSync(lifyJsonPath, 'utf8'));
    const lovableConfig = JSON.parse(fs.readFileSync(lovableJsonPath, 'utf8'));
    
    const lifyUrl = lifyConfig.environment.VITE_WHATSAPP_SERVER_URL;
    const lovableUrl = lovableConfig.environment.VITE_WHATSAPP_SERVER_URL;
    
    console.log(`📋 Lify config: ${lifyUrl}`);
    console.log(`📋 Lovable config: ${lovableUrl}`);
    
    if (lifyUrl === 'http://31.97.241.19:3001' && lovableUrl === 'http://31.97.241.19:3001') {
      console.log('✅ Configurações HTTP corretas!');
      return true;
    } else {
      console.log('❌ Configurações ainda usam HTTPS!');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar configurações:', error.message);
    return false;
  }
}

// Função para fazer build
function buildProject() {
  console.log('\n🔨 Fazendo build do projeto...');
  
  try {
    // Verificar se o package.json tem o script de build
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.scripts && packageJson.scripts['build:prod']) {
      console.log('📦 Executando build:prod...');
      execSync('npm run build:prod', { stdio: 'inherit' });
    } else if (packageJson.scripts && packageJson.scripts.build) {
      console.log('📦 Executando build...');
      execSync('npm run build', { stdio: 'inherit' });
    } else {
      console.log('⚠️ Script de build não encontrado, tentando build padrão...');
      execSync('npm run build', { stdio: 'inherit' });
    }
    
    console.log('✅ Build concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no build:', error.message);
    return false;
  }
}

// Função para fazer deploy
function deployToLify() {
  console.log('\n🚀 Fazendo deploy para o Lify...');
  
  try {
    // Verificar se o Lify CLI está instalado
    try {
      execSync('lify --version', { stdio: 'pipe' });
    } catch {
      console.log('📦 Instalando Lify CLI...');
      execSync('npm install -g @lify/cli', { stdio: 'inherit' });
    }
    
    // Fazer deploy
    console.log('🌐 Deployando para o Lify...');
    execSync('lify deploy', { stdio: 'inherit' });
    
    console.log('✅ Deploy concluído com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no deploy:', error.message);
    console.log('\n💡 Alternativa: Faça o deploy manualmente:');
    console.log('   1. Acesse: https://lify.com.br');
    console.log('   2. Faça login na sua conta');
    console.log('   3. Selecione o projeto atendeai-lify-admin');
    console.log('   4. Clique em "Deploy" ou "Force Deploy"');
    return false;
  }
}

// Função para testar conectividade após deploy
function testConnectivity() {
  console.log('\n🔍 Testando conectividade após deploy...');
  
  const testUrls = [
    'http://31.97.241.19:3001/health',
    'https://atendeai.lify.com.br'
  ];
  
  testUrls.forEach(url => {
    try {
      const response = fetch(url, { timeout: 5000 });
      console.log(`✅ ${url} - Acessível`);
    } catch (error) {
      console.log(`❌ ${url} - Erro: ${error.message}`);
    }
  });
}

// Função principal
async function main() {
  console.log('🎯 Resolvendo problema de configuração HTTP...\n');
  
  // 1. Verificar configurações
  if (!checkConfigurations()) {
    console.log('\n❌ Configurações incorretas. Corrigindo...');
    
    // Corrigir lify.json
    let lifyContent = fs.readFileSync(lifyJsonPath, 'utf8');
    lifyContent = lifyContent.replace(
      /"VITE_WHATSAPP_SERVER_URL":\s*"https:\/\/31\.97\.241\.19:3001"/,
      '"VITE_WHATSAPP_SERVER_URL": "http://31.97.241.19:3001"'
    );
    fs.writeFileSync(lifyJsonPath, lifyContent);
    
    // Corrigir lovable.json
    let lovableContent = fs.readFileSync(lovableJsonPath, 'utf8');
    lovableContent = lovableContent.replace(
      /"VITE_WHATSAPP_SERVER_URL":\s*"https:\/\/31\.97\.241\.19:3001"/,
      '"VITE_WHATSAPP_SERVER_URL": "http://31.97.241.19:3001"'
    );
    fs.writeFileSync(lovableJsonPath, lovableContent);
    
    console.log('✅ Configurações corrigidas!');
  }
  
  // 2. Fazer build
  if (!buildProject()) {
    console.log('\n❌ Falha no build. Verifique os erros acima.');
    process.exit(1);
  }
  
  // 3. Fazer deploy
  if (!deployToLify()) {
    console.log('\n⚠️ Deploy automático falhou, mas as configurações estão corretas.');
    console.log('   Você pode fazer o deploy manualmente no dashboard do Lify.');
  }
  
  // 4. Testar conectividade
  setTimeout(testConnectivity, 10000); // Aguardar 10 segundos
  
  console.log('\n🎉 Processo concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Aguarde alguns minutos para o deploy ser processado');
  console.log('   2. Acesse: https://atendeai.lify.com.br');
  console.log('   3. Teste a geração de QR Code');
  console.log('   4. Verifique se não há erros de CORS no console');
  
  console.log('\n🔧 Se ainda houver problemas:');
  console.log('   - Limpe o cache do navegador (Ctrl+Shift+R)');
  console.log('   - Verifique se o servidor HTTP está rodando na VPS');
  console.log('   - Execute: node scripts/test-http-connectivity.js');
}

// Executar
main().catch(console.error); 