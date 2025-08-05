#!/usr/bin/env node

/**
 * Script para forçar limpeza de cache e novo deploy
 * Resolve o problema de configurações não aplicadas
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧹 Forçando limpeza de cache e novo deploy...\n');

// Verificar se estamos no diretório correto
const currentDir = process.cwd();
const distPath = path.join(currentDir, 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ Pasta dist não encontrada!');
  console.log('   Execute primeiro: npm run build:prod');
  process.exit(1);
}

console.log('✅ Pasta dist encontrada');

// Função para limpar cache e fazer novo build
function cleanAndRebuild() {
  console.log('\n🧹 Limpando cache e fazendo novo build...');
  
  try {
    // Limpar cache do npm
    console.log('📦 Limpando cache do npm...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    
    // Remover node_modules e reinstalar
    console.log('🗑️ Removendo node_modules...');
    execSync('rm -rf node_modules package-lock.json', { stdio: 'inherit' });
    
    // Reinstalar dependências
    console.log('📦 Reinstalando dependências...');
    execSync('npm install', { stdio: 'inherit' });
    
    // Novo build
    console.log('🔨 Fazendo novo build...');
    execSync('npm run build:prod', { stdio: 'inherit' });
    
    console.log('✅ Build limpo concluído!');
    return true;
  } catch (error) {
    console.error('❌ Erro no build limpo:', error.message);
    return false;
  }
}

// Função para forçar deploy com timestamp
function forceDeployWithTimestamp() {
  console.log('\n🚀 Forçando deploy com timestamp...');
  
  try {
    // Criar arquivo de timestamp para forçar cache busting
    const timestamp = Date.now();
    const timestampFile = `deploy-timestamp-${timestamp}.txt`;
    fs.writeFileSync(timestampFile, `Deploy timestamp: ${new Date().toISOString()}`);
    
    // Adicionar ao git
    execSync('git add .', { stdio: 'inherit' });
    execSync(`git commit -m "Force deploy with timestamp ${timestamp}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Deploy forçado com timestamp!');
    return true;
  } catch (error) {
    console.log('❌ Erro no deploy forçado:', error.message);
    return false;
  }
}

// Função para criar arquivo de configuração de cache busting
function createCacheBustingConfig() {
  console.log('\n⚡ Criando configuração de cache busting...');
  
  try {
    const timestamp = Date.now();
    
    // Criar arquivo de configuração com timestamp
    const cacheBustingConfig = {
      timestamp: timestamp,
      deployTime: new Date().toISOString(),
      environment: {
        VITE_SUPABASE_URL: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
        VITE_GOOGLE_CLIENT_ID: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
        VITE_WHATSAPP_SERVER_URL: 'https://atendeai-backend-production.up.railway.app',
        VITE_BACKEND_URL: 'https://atendeai-backend-production.up.railway.app',
        NODE_ENV: 'production',
        VITE_DEPLOY_TIMESTAMP: timestamp.toString()
      },
      cacheBusting: {
        enabled: true,
        timestamp: timestamp,
        forceReload: true
      }
    };
    
    fs.writeFileSync('cache-busting-config.json', JSON.stringify(cacheBustingConfig, null, 2));
    
    // Atualizar lify.json com timestamp
    const lifyConfig = JSON.parse(fs.readFileSync('lify.json', 'utf8'));
    lifyConfig.environment.VITE_DEPLOY_TIMESTAMP = timestamp.toString();
    fs.writeFileSync('lify.json', JSON.stringify(lifyConfig, null, 2));
    
    console.log('✅ Configuração de cache busting criada!');
    return true;
  } catch (error) {
    console.log('❌ Erro ao criar configuração:', error.message);
    return false;
  }
}

// Função para testar se o deploy funcionou
function testDeployWithCacheBusting() {
  console.log('\n🔍 Testando deploy com cache busting...');
  
  setTimeout(async () => {
    try {
      const response = await fetch('https://atendeai.lify.com.br');
      if (response.ok) {
        console.log('✅ Frontend acessível após deploy com cache busting');
        
        // Testar se está usando HTTP
        console.log('📋 Verificando se está usando HTTP...');
        console.log('   Acesse: https://atendeai.lify.com.br');
        console.log('   Abra DevTools (F12)');
        console.log('   Vá para a aba Network');
        console.log('   Procure por requisições para https://atendeai-backend-production.up.railway.app');
      } else {
        console.log('❌ Frontend não acessível após deploy');
      }
    } catch (error) {
      console.log('❌ Erro ao testar deploy:', error.message);
    }
  }, 60000); // Aguardar 1 minuto
}

// Função principal
async function main() {
  console.log('🎯 Forçando limpeza de cache e novo deploy...\n');
  
  // 1. Limpar cache e fazer novo build
  if (!cleanAndRebuild()) {
    console.log('\n❌ Falha no build limpo.');
    process.exit(1);
  }
  
  // 2. Criar configuração de cache busting
  if (!createCacheBustingConfig()) {
    console.log('\n❌ Falha na configuração de cache busting.');
    process.exit(1);
  }
  
  // 3. Forçar deploy com timestamp
  if (!forceDeployWithTimestamp()) {
    console.log('\n❌ Falha no deploy forçado.');
    console.log('\n💡 Solução manual:');
    console.log('   1. Acesse: https://lify.com.br');
    console.log('   2. Faça login na sua conta');
    console.log('   3. Selecione o projeto atendeai-lify-admin');
    console.log('   4. Configure as variáveis de ambiente:');
    console.log('      VITE_WHATSAPP_SERVER_URL=https://atendeai-backend-production.up.railway.app');
    console.log('      VITE_BACKEND_URL=https://atendeai-backend-production.up.railway.app');
    console.log('   5. Faça upload da pasta dist/');
    console.log('   6. Clique em "Force Deploy"');
    process.exit(1);
  }
  
  console.log('\n🎉 Deploy com cache busting concluído!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Aguarde 2-3 minutos para o processamento');
  console.log('   2. Acesse: https://atendeai.lify.com.br');
  console.log('   3. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
  console.log('   4. Teste a geração de QR Code');
  console.log('   5. Verifique se não há erros de CORS');
  
  console.log('\n🔧 Se ainda houver problemas:');
  console.log('   - Limpe o cache do navegador completamente');
  console.log('   - Use modo incógnito para testar');
  console.log('   - Verifique se o servidor HTTP está rodando');
  
  // Testar deploy após um tempo
  testDeployWithCacheBusting();
}

// Executar
main().catch(console.error); 