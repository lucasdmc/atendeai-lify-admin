#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Corrigindo ambiente do PM2...');

try {
  // 1. Parar o processo atual
  console.log('📋 Parando processo atual...');
  execSync('pm2 stop whatsapp-backend', { stdio: 'inherit' });
  
  // 2. Deletar o processo do PM2
  console.log('🗑️ Removendo processo do PM2...');
  execSync('pm2 delete whatsapp-backend', { stdio: 'inherit' });
  
  // 3. Verificar se o .env existe e tem a variável
  console.log('📄 Verificando arquivo .env...');
  const envContent = execSync('cat .env', { encoding: 'utf8' });
  
  if (!envContent.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada no .env');
    console.log('📝 Conteúdo atual do .env:');
    console.log(envContent);
    process.exit(1);
  }
  
  // 4. Iniciar o backend com dotenv
  console.log('🚀 Iniciando backend com dotenv...');
  execSync('pm2 start server.js --name whatsapp-backend --interpreter node --env-file .env', { stdio: 'inherit' });
  
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