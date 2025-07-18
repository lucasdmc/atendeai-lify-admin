#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Forçando deploy com versão específica...\n');

// Função para criar arquivo de versão
function createVersionFile() {
  try {
    const version = `v1.0.${Date.now()}`;
    const versionData = {
      version,
      timestamp: new Date().toISOString(),
      build: 'force-deploy',
      cacheBust: true,
      description: 'Force deploy to fix 404 errors'
    };
    
    fs.writeFileSync('version.json', JSON.stringify(versionData, null, 2));
    console.log('✅ Arquivo de versão criado:', version);
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar arquivo de versão:', error.message);
    return false;
  }
}

// Função para limpar e rebuild
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

// Função para fazer deploy
function forceDeploy() {
  try {
    const timestamp = Date.now();
    const commitMessage = `fix: force deploy with version - ${timestamp}`;
    
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

// Função principal
async function main() {
  console.log('🎯 Iniciando deploy forçado com versão...\n');
  
  if (!createVersionFile()) {
    console.log('\n❌ Falha na criação do arquivo de versão');
    return;
  }
  
  if (!cleanAndRebuild()) {
    console.log('\n❌ Falha no clean e rebuild');
    return;
  }
  
  if (!forceDeploy()) {
    console.log('\n❌ Falha no deploy');
    return;
  }
  
  console.log('\n🎉 Deploy com versão concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Aguarde 3-5 minutos para o processamento');
  console.log('   2. Acesse: https://atendeai.lify.com.br');
  console.log('   3. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
  console.log('   4. Abra DevTools (F12) e vá para Network');
  console.log('   5. Marque "Disable cache"');
  console.log('   6. Teste a geração de QR Code');
  console.log('   7. Verifique se não há erros 404 no console');
  
  console.log('\n🔍 Para verificar se funcionou:');
  console.log('   - Console deve estar limpo (sem erros 404)');
  console.log('   - QR Code deve aparecer corretamente');
  console.log('   - Network tab deve mostrar chamadas bem-sucedidas');
}

main().catch(console.error); 