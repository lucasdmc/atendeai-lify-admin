#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 Corrigindo ambiente do PM2...');

try {
  // 1. Parar o processo atual (se existir)
  console.log('📋 Parando processo atual...');
  try {
    execSync('pm2 stop atendeai-backend', { stdio: 'inherit' });
    execSync('pm2 delete atendeai-backend', { stdio: 'inherit' });
  } catch (e) {
    console.log('ℹ️ Processo não existia ou já foi removido');
  }
  
  // 2. Verificar se o .env existe e tem a variável
  console.log('📄 Verificando arquivo .env...');
  const envContent = execSync('cat .env', { encoding: 'utf8' });
  
  if (!envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
    console.log('📝 Conteúdo atual do .env:');
    console.log(envContent);
    process.exit(1);
  }
  
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY encontrada no .env');
  
  // 3. Exportar variáveis do .env
  console.log('📤 Exportando variáveis do .env...');
  const envLines = envContent.split('\n');
  const envVars = {};
  
  envLines.forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    }
  });
  
  // 4. Criar comando com variáveis exportadas
  const envString = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  console.log('🚀 Iniciando backend com variáveis exportadas...');
  const startCommand = `${envString} pm2 start server.js --name atendeai-backend --interpreter node`;
  
  console.log('📋 Comando:', startCommand);
  execSync(startCommand, { stdio: 'inherit' });
  
  // 5. Verificar se iniciou corretamente
  console.log('⏳ Aguardando 3 segundos...');
  execSync('sleep 3', { stdio: 'inherit' });
  
  console.log('📊 Status do PM2:');
  execSync('pm2 status', { stdio: 'inherit' });
  
  console.log('🔍 Verificando variáveis do processo:');
  execSync('pm2 env 0 | grep SUPABASE', { stdio: 'inherit' });
  
  console.log('✅ Backend reiniciado com sucesso!');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
} 