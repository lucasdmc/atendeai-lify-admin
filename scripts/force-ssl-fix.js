#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Forçando correção do problema SSL...\n');

// Função para executar comandos
function execCommand(command, description) {
  try {
    console.log(`📋 ${description}...`);
    const result = execSync(command, { encoding: 'utf8' });
    console.log(`✅ ${description} - OK`);
    return true;
  } catch (error) {
    console.log(`❌ ${description} - ERRO: ${error.message}`);
    return false;
  }
}

// Função para verificar se arquivo existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Função para ler arquivo
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Função para escrever arquivo
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.log(`❌ Erro ao escrever ${filePath}: ${error.message}`);
    return false;
  }
}

// Função para corrigir lify.json
function fixLifyConfig() {
  console.log('\n🔧 Corrigindo configuração do Lify...');
  
  const lifyPath = path.join(process.cwd(), 'lify.json');
  const lovablePath = path.join(process.cwd(), 'lovable.json');
  
  const lifyConfig = {
    name: "atendeai-lify-admin",
    version: "1.0.0",
    environment: {
      VITE_GOOGLE_CLIENT_ID: "367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com",
      VITE_SUPABASE_URL: "https://niakqdolcdwxtrkbqmdi.supabase.co",
      VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw",
      VITE_WHATSAPP_SERVER_URL: "https://atendeai-backend-production.up.railway.app",
      VITE_BACKEND_URL: "https://atendeai-backend-production.up.railway.app",
      NODE_ENV: "production"
    },
    build: {
      command: "npm run build",
      output: "dist"
    },
    deploy: {
      platform: "lify"
    }
  };

  const lovableConfig = {
    name: "atendeai-lify-admin",
    version: "1.0.0",
    environment: {
      VITE_GOOGLE_CLIENT_ID: "367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com",
      VITE_SUPABASE_URL: "https://niakqdolcdwxtrkbqmdi.supabase.co",
      VITE_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw",
      VITE_WHATSAPP_SERVER_URL: "https://atendeai-backend-production.up.railway.app",
      VITE_BACKEND_URL: "https://atendeai-backend-production.up.railway.app",
      NODE_ENV: "production"
    },
    build: {
      command: "npm run build",
      output: "dist"
    },
    deploy: {
      platform: "lovable"
    }
  };

  // Corrigir lify.json
  if (writeFile(lifyPath, JSON.stringify(lifyConfig, null, 2))) {
    console.log('✅ lify.json corrigido');
  }

  // Corrigir lovable.json
  if (writeFile(lovablePath, JSON.stringify(lovableConfig, null, 2))) {
    console.log('✅ lovable.json corrigido');
  }
}

// Função para limpar cache e rebuild
function cleanAndRebuild() {
  console.log('\n🧹 Limpando cache e rebuildando...');
  
  const commands = [
    'npm cache clean --force',
    'rm -rf node_modules',
    'rm -rf dist',
    'npm install',
    'npm run build'
  ];

  for (const command of commands) {
    if (!execCommand(command, `Executando: ${command}`)) {
      return false;
    }
  }
  
  return true;
}

// Função para forçar deploy
function forceDeploy() {
  console.log('\n🚀 Forçando deploy...');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const commitMessage = `fix: force SSL fix and cache busting - ${timestamp}`;
  
  const deployCommands = [
    'git add .',
    `git commit -m "${commitMessage}"`,
    'git push origin main'
  ];

  for (const command of deployCommands) {
    if (!execCommand(command, `Git: ${command}`)) {
      return false;
    }
  }
  
  return true;
}

// Função para criar arquivo de cache busting
function createCacheBustingConfig() {
  console.log('\n🔄 Criando configuração de cache busting...');
  
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  const timestamp = Date.now();
  
  const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: \`[name].\${timestamp}.js\`,
        chunkFileNames: \`[name].\${timestamp}.js\`,
        assetFileNames: \`[name].\${timestamp}.[ext]\`
      }
    }
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __VERSION__: JSON.stringify('1.0.0-ssl-fix')
  }
})`;

  if (writeFile(viteConfigPath, viteConfig)) {
    console.log('✅ vite.config.ts atualizado com cache busting');
    return true;
  }
  
  return false;
}

// Função para testar deploy
function testDeploy() {
  console.log('\n🧪 Testando deploy...');
  
  setTimeout(() => {
    console.log('\n📋 Teste de deploy:');
    console.log('   1. Aguarde 2-3 minutos para o processamento');
    console.log('   2. Acesse: https://atendeai.lify.com.br');
    console.log('   3. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
    console.log('   4. Abra o DevTools (F12)');
    console.log('   5. Vá para a aba Network');
    console.log('   6. Teste a geração de QR Code');
    console.log('   7. Verifique se não há erros SSL');
    console.log('   8. Procure por requisições para https://atendeai-backend-production.up.railway.app');
  }, 1000);
}

// Função principal
async function main() {
  console.log('🎯 Iniciando correção forçada do problema SSL...\n');
  
  // Verificar se estamos no diretório correto
  if (!fileExists('package.json')) {
    console.log('❌ Erro: Execute este script no diretório raiz do projeto');
    process.exit(1);
  }
  
  // Corrigir configurações
  fixLifyConfig();
  
  // Limpar e rebuildar
  if (!cleanAndRebuild()) {
    console.log('\n❌ Erro durante limpeza e rebuild');
    console.log('\n📋 Solução manual:');
    console.log('   1. Acesse: https://lify.com.br');
    console.log('   2. Faça login na sua conta');
    console.log('   3. Selecione o projeto: atendeai-lify-admin');
    console.log('   4. Vá para Configurações → Variáveis de Ambiente');
    console.log('   5. DELETE as seguintes variáveis se existirem:');
    console.log('      - VITE_WHATSAPP_SERVER_URL (se estiver como HTTPS)');
    console.log('      - VITE_BACKEND_URL (se estiver como HTTPS)');
    console.log('   6. ADICIONE as seguintes variáveis:');
    console.log('      VITE_WHATSAPP_SERVER_URL=https://atendeai-backend-production.up.railway.app');
    console.log('      VITE_BACKEND_URL=https://atendeai-backend-production.up.railway.app');
    console.log('   7. Salve as configurações');
    console.log('   8. Force um novo deploy');
    process.exit(1);
  }
  
  // Criar configuração de cache busting
  if (!createCacheBustingConfig()) {
    console.log('\n⚠️ Aviso: Não foi possível criar configuração de cache busting');
  }
  
  // Forçar deploy
  if (!forceDeploy()) {
    console.log('\n❌ Erro durante deploy');
    console.log('\n📋 Deploy manual necessário:');
    console.log('   1. Acesse: https://lify.com.br');
    console.log('   2. Force um novo deploy do projeto');
    console.log('   3. Aguarde o processamento');
    process.exit(1);
  }
  
  console.log('\n🎉 Correção SSL concluída!');
  console.log('\n📋 Próximos passos:');
  console.log('   1. Aguarde 2-3 minutos para o processamento');
  console.log('   2. Acesse: https://atendeai.lify.com.br');
  console.log('   3. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac)');
  console.log('   4. Teste a geração de QR Code');
  console.log('   5. Verifique se não há erros SSL');
  
  testDeploy();
}

main().catch(console.error); 