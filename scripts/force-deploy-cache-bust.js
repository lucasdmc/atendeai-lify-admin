#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Forçando deploy com cache busting no Lify...\n');

// Função para limpar cache e rebuild
function cleanAndRebuild() {
  try {
    console.log('🧹 Limpando cache...');
    execSync('rm -rf node_modules/.cache', { stdio: 'inherit' });
    execSync('rm -rf .next', { stdio: 'inherit' });
    execSync('rm -rf dist', { stdio: 'inherit' });
    
    console.log('📦 Reinstalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
    
    console.log('🔨 Fazendo build...');
    execSync('npm run build', { stdio: 'inherit' });
    
    return true;
  } catch (error) {
    console.error('❌ Erro no clean e rebuild:', error.message);
    return false;
  }
}

// Função para criar arquivo de cache busting
function createCacheBustingConfig() {
  try {
    const timestamp = Date.now();
    const cacheBustConfig = {
      timestamp,
      version: `1.0.${timestamp}`,
      buildId: `build-${timestamp}`,
      cacheBust: true
    };
    
    fs.writeFileSync('cache-bust.json', JSON.stringify(cacheBustConfig, null, 2));
    console.log('✅ Arquivo de cache busting criado');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar cache busting:', error.message);
    return false;
  }
}

// Função para fazer deploy com timestamp
function forceDeployWithTimestamp() {
  try {
    const timestamp = Date.now();
    const commitMessage = `fix: force deploy with cache busting - ${timestamp}`;
    
    console.log('📝 Adicionando arquivos...');
    execSync('git add .', { stdio: 'inherit' });
    
    console.log('💾 Fazendo commit...');
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    console.log('🚀 Fazendo push...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Deploy forçado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro no deploy:', error.message);
    return false;
  }
}

// Função para testar deploy
function testDeploy() {
  console.log('\n🧪 Testando deploy...');
  console.log('⏳ Aguarde 2-3 minutos para o processamento...');
  console.log('🌐 Acesse: https://atendeai.lify.com.br');
  console.log('🔄 Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para limpar cache');
  console.log('📱 Teste a geração de QR Code');
}

// Função principal
async function main() {
  console.log('🎯 Iniciando deploy forçado com cache busting...\n');
  
  if (!cleanAndRebuild()) {
    console.log('\n❌ Falha no clean e rebuild');
    return;
  }
  
  if (!createCacheBustingConfig()) {
    console.log('\n❌ Falha na criação do cache busting');
    return;
  }
  
  if (!forceDeployWithTimestamp()) {
    console.log('\n❌ Falha no deploy');
    return;
  }
  
  console.log('\n🎉 Deploy com cache busting concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Aguarde 2-3 minutos para o processamento');
  console.log('   2. Acesse: https://atendeai.lify.com.br');
  console.log('   3. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
  console.log('   4. Teste a geração de QR Code');
  console.log('   5. Verifique se não há erros de CORS');
  
  testDeploy();
}

main().catch(console.error); 