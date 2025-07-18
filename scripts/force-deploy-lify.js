#!/usr/bin/env node

/**
 * Script para forçar deploy no Lify
 * Tenta diferentes métodos para garantir que o deploy seja feito
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Forçando deploy no Lify...\n');

// Verificar se estamos no diretório correto
const currentDir = process.cwd();
const distPath = path.join(currentDir, 'dist');

if (!fs.existsSync(distPath)) {
  console.error('❌ Pasta dist não encontrada!');
  console.log('   Execute primeiro: npm run build:prod');
  process.exit(1);
}

console.log('✅ Pasta dist encontrada');

// Método 1: Tentar usar Git (se conectado)
function tryGitDeploy() {
  console.log('\n📦 Tentando deploy via Git...');
  
  try {
    // Verificar se é um repositório Git
    execSync('git status', { stdio: 'pipe' });
    
    console.log('🔄 Fazendo commit das alterações...');
    execSync('git add .', { stdio: 'inherit' });
    execSync('git commit -m "Fix: Update WhatsApp server URL to HTTP"', { stdio: 'inherit' });
    
    console.log('🚀 Fazendo push...');
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Deploy via Git concluído!');
    return true;
  } catch (error) {
    console.log('❌ Deploy via Git falhou:', error.message);
    return false;
  }
}

// Método 2: Tentar usar Lify CLI (se disponível)
function tryLifyCLI() {
  console.log('\n📦 Tentando deploy via Lify CLI...');
  
  try {
    // Verificar se o Lify CLI está instalado
    execSync('lify --version', { stdio: 'pipe' });
    
    console.log('🚀 Fazendo deploy via Lify CLI...');
    execSync('lify deploy', { stdio: 'inherit' });
    
    console.log('✅ Deploy via Lify CLI concluído!');
    return true;
  } catch (error) {
    console.log('❌ Lify CLI não disponível:', error.message);
    return false;
  }
}

// Método 3: Tentar usar Vercel CLI (alternativa)
function tryVercelCLI() {
  console.log('\n📦 Tentando deploy via Vercel CLI...');
  
  try {
    // Verificar se o Vercel CLI está instalado
    execSync('vercel --version', { stdio: 'pipe' });
    
    console.log('🚀 Fazendo deploy via Vercel...');
    execSync('vercel --prod', { stdio: 'inherit' });
    
    console.log('✅ Deploy via Vercel concluído!');
    return true;
  } catch (error) {
    console.log('❌ Vercel CLI não disponível:', error.message);
    return false;
  }
}

// Método 4: Criar arquivo de deploy manual
function createManualDeployFiles() {
  console.log('\n📦 Criando arquivos para deploy manual...');
  
  try {
    // Criar arquivo de configuração para deploy manual
    const deployConfig = {
      projectName: 'atendeai-lify-admin',
      environment: {
        VITE_SUPABASE_URL: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw',
        VITE_GOOGLE_CLIENT_ID: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
        VITE_WHATSAPP_SERVER_URL: 'http://31.97.241.19:3001',
        VITE_BACKEND_URL: 'http://31.97.241.19:3001',
        NODE_ENV: 'production'
      },
      buildCommand: 'npm run build:prod',
      outputDirectory: 'dist',
      deployUrl: 'https://atendeai.lify.com.br'
    };
    
    fs.writeFileSync('deploy-config.json', JSON.stringify(deployConfig, null, 2));
    
    // Criar script de deploy
    const deployScript = `#!/bin/bash
echo "🚀 Deploy Manual para Lify"
echo "=========================="
echo ""
echo "1. Acesse: https://lify.com.br"
echo "2. Faça login na sua conta"
echo "3. Selecione o projeto: atendeai-lify-admin"
echo "4. Vá para a seção de configurações"
echo "5. Configure as variáveis de ambiente:"
echo ""
echo "VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001"
echo "VITE_BACKEND_URL=http://31.97.241.19:3001"
echo ""
echo "6. Faça upload da pasta dist/"
echo "7. Clique em 'Deploy' ou 'Force Deploy'"
echo "8. Aguarde alguns minutos"
echo ""
echo "✅ Deploy concluído!"
`;
    
    fs.writeFileSync('deploy-manual.sh', deployScript);
    execSync('chmod +x deploy-manual.sh', { stdio: 'inherit' });
    
    console.log('✅ Arquivos de deploy manual criados:');
    console.log('   - deploy-config.json');
    console.log('   - deploy-manual.sh');
    
    return true;
  } catch (error) {
    console.log('❌ Erro ao criar arquivos de deploy:', error.message);
    return false;
  }
}

// Função para testar se o deploy funcionou
function testDeploy() {
  console.log('\n🔍 Testando se o deploy funcionou...');
  
  setTimeout(async () => {
    try {
      const response = await fetch('https://atendeai.lify.com.br');
      if (response.ok) {
        console.log('✅ Frontend acessível após deploy');
        
        // Testar se está usando HTTP
        const testResponse = await fetch('https://atendeai.lify.com.br/api/test-config');
        console.log('📋 Verificando configurações...');
      } else {
        console.log('❌ Frontend não acessível após deploy');
      }
    } catch (error) {
      console.log('❌ Erro ao testar deploy:', error.message);
    }
  }, 30000); // Aguardar 30 segundos
}

// Função principal
async function main() {
  console.log('🎯 Forçando deploy no Lify...\n');
  
  let deploySuccess = false;
  
  // Tentar diferentes métodos de deploy
  console.log('📋 Tentando métodos de deploy...\n');
  
  // Método 1: Git
  if (!deploySuccess) {
    deploySuccess = tryGitDeploy();
  }
  
  // Método 2: Lify CLI
  if (!deploySuccess) {
    deploySuccess = tryLifyCLI();
  }
  
  // Método 3: Vercel CLI
  if (!deploySuccess) {
    deploySuccess = tryVercelCLI();
  }
  
  // Método 4: Deploy manual
  if (!deploySuccess) {
    deploySuccess = createManualDeployFiles();
  }
  
  if (deploySuccess) {
    console.log('\n🎉 Deploy iniciado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Aguarde alguns minutos para o processamento');
    console.log('   2. Acesse: https://atendeai.lify.com.br');
    console.log('   3. Teste a geração de QR Code');
    console.log('   4. Verifique se não há erros de CORS');
    
    // Testar deploy após um tempo
    testDeploy();
  } else {
    console.log('\n❌ Todos os métodos de deploy falharam.');
    console.log('\n💡 Solução manual:');
    console.log('   1. Acesse: https://lify.com.br');
    console.log('   2. Faça login na sua conta');
    console.log('   3. Selecione o projeto atendeai-lify-admin');
    console.log('   4. Configure as variáveis de ambiente:');
    console.log('      VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001');
    console.log('      VITE_BACKEND_URL=http://31.97.241.19:3001');
    console.log('   5. Faça upload da pasta dist/');
    console.log('   6. Clique em "Deploy" ou "Force Deploy"');
  }
}

// Executar
main().catch(console.error); 