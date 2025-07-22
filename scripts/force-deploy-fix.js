#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Forçando Deploy com Correção SSL...\n');

async function forceDeployFix() {
  try {
    // 1. Verificar se estamos no diretório correto
    if (!fs.existsSync('package.json')) {
      console.log('❌ Erro: Execute este script no diretório raiz do projeto');
      process.exit(1);
    }

    console.log('✅ Diretório correto detectado');

    // 2. Limpar cache e build
    console.log('\n🧹 Limpando cache e build...');
    try {
      execSync('rm -rf node_modules/.vite', { stdio: 'inherit' });
      execSync('rm -rf dist', { stdio: 'inherit' });
      execSync('rm -rf .vite', { stdio: 'inherit' });
      console.log('✅ Cache limpo');
    } catch (error) {
      console.log('⚠️ Erro ao limpar cache:', error.message);
    }

    // 3. Verificar configurações
    console.log('\n🔧 Verificando configurações...');
    
    // Verificar lify.json
    if (fs.existsSync('lify.json')) {
      const lifyConfig = JSON.parse(fs.readFileSync('lify.json', 'utf8'));
      const whatsappUrl = lifyConfig.environment?.VITE_WHATSAPP_SERVER_URL;
      if (whatsappUrl && whatsappUrl.includes('https://')) {
        console.log('❌ lify.json ainda tem HTTPS');
        lifyConfig.environment.VITE_WHATSAPP_SERVER_URL = 'http://31.97.241.19:3001';
        lifyConfig.environment.VITE_BACKEND_URL = 'http://31.97.241.19:3001';
        fs.writeFileSync('lify.json', JSON.stringify(lifyConfig, null, 2));
        console.log('✅ lify.json corrigido');
      } else {
        console.log('✅ lify.json já está correto');
      }
    }

    // Verificar lovable.json
    if (fs.existsSync('lovable.json')) {
      const lovableConfig = JSON.parse(fs.readFileSync('lovable.json', 'utf8'));
      const whatsappUrl = lovableConfig.environment?.VITE_WHATSAPP_SERVER_URL;
      if (whatsappUrl && whatsappUrl.includes('https://')) {
        console.log('❌ lovable.json ainda tem HTTPS');
        lovableConfig.environment.VITE_WHATSAPP_SERVER_URL = 'http://31.97.241.19:3001';
        lovableConfig.environment.VITE_BACKEND_URL = 'http://31.97.241.19:3001';
        fs.writeFileSync('lovable.json', JSON.stringify(lovableConfig, null, 2));
        console.log('✅ lovable.json corrigido');
      } else {
        console.log('✅ lovable.json já está correto');
      }
    }

    // 4. Verificar environment.ts
    console.log('\n🔧 Verificando environment.ts...');
    const envPath = 'src/config/environment.ts';
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('https://31.97.241.19')) {
        console.log('❌ environment.ts ainda tem HTTPS');
        envContent = envContent.replace(/https:\/\/31\.97\.241\.19/g, 'http://31.97.241.19');
        fs.writeFileSync(envPath, envContent);
        console.log('✅ environment.ts corrigido');
      } else {
        console.log('✅ environment.ts já está correto');
      }
    }

    // 5. Criar timestamp único para cache busting
    console.log('\n⏰ Criando cache busting...');
    const timestamp = Date.now();
    const cacheBustingConfig = {
      timestamp,
      buildId: `build-${timestamp}`,
      version: `1.0.${timestamp}`
    };
    
    fs.writeFileSync('cache-busting.json', JSON.stringify(cacheBustingConfig, null, 2));
    console.log('✅ Cache busting criado');

    // 6. Instalar dependências
    console.log('\n📦 Instalando dependências...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependências instaladas');
    } catch (error) {
      console.log('❌ Erro ao instalar dependências:', error.message);
    }

    // 7. Build do projeto
    console.log('\n🔨 Fazendo build do projeto...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build concluído');
    } catch (error) {
      console.log('❌ Erro no build:', error.message);
      process.exit(1);
    }

    // 8. Verificar se o dist foi criado
    if (!fs.existsSync('dist')) {
      console.log('❌ Erro: Pasta dist não foi criada');
      process.exit(1);
    }

    console.log('✅ Pasta dist criada com sucesso');

    // 9. Testar conectividade
    console.log('\n🌐 Testando conectividade...');
    try {
      const healthCheck = execSync('curl -s http://31.97.241.19:3001/health', { encoding: 'utf8' });
      const health = JSON.parse(healthCheck);
      console.log('✅ Servidor HTTP acessível');
      console.log(`   Status: ${health.status}`);
      console.log(`   Uptime: ${Math.round(health.uptime / 60)} minutos`);
    } catch (error) {
      console.log('❌ Servidor HTTP não acessível:', error.message);
    }

    // 10. Criar arquivo de deploy
    console.log('\n📝 Criando arquivo de deploy...');
    const deployInfo = {
      timestamp: new Date().toISOString(),
      buildId: cacheBustingConfig.buildId,
      version: cacheBustingConfig.version,
      environment: {
        VITE_WHATSAPP_SERVER_URL: 'http://31.97.241.19:3001',
        VITE_BACKEND_URL: 'http://31.97.241.19:3001',
        NODE_ENV: 'production'
      },
      instructions: [
        '1. Acesse: https://lify.com.br',
        '2. Faça login na sua conta',
        '3. Selecione o projeto: atendeai-lify-admin',
        '4. Vá para Configurações → Variáveis de Ambiente',
        '5. DELETE as seguintes variáveis se existirem:',
        '   - VITE_WHATSAPP_SERVER_URL (se estiver como HTTPS)',
        '   - VITE_BACKEND_URL (se estiver como HTTPS)',
        '6. ADICIONE as seguintes variáveis:',
        '   VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001',
        '   VITE_BACKEND_URL=http://31.97.241.19:3001',
        '7. Salve as configurações',
        '8. Force um novo deploy'
      ]
    };

    fs.writeFileSync('deploy-info.json', JSON.stringify(deployInfo, null, 2));
    console.log('✅ Arquivo de deploy criado');

    console.log('\n🎉 PROCESSO CONCLUÍDO!');
    console.log('\n📋 PRÓXIMOS PASSOS:');
    console.log('   1. Acesse: https://lify.com.br');
    console.log('   2. Faça login na sua conta');
    console.log('   3. Selecione o projeto: atendeai-lify-admin');
    console.log('   4. Vá para Configurações → Variáveis de Ambiente');
    console.log('   5. DELETE as seguintes variáveis se existirem:');
    console.log('      - VITE_WHATSAPP_SERVER_URL (se estiver como HTTPS)');
    console.log('      - VITE_BACKEND_URL (se estiver como HTTPS)');
    console.log('   6. ADICIONE as seguintes variáveis:');
    console.log('      VITE_WHATSAPP_SERVER_URL=http://31.97.241.19:3001');
    console.log('      VITE_BACKEND_URL=http://31.97.241.19:3001');
    console.log('   7. Salve as configurações');
    console.log('   8. Force um novo deploy');
    console.log('\n🔧 Para testar localmente:');
    console.log('   npm run dev');
    console.log('\n🌐 Para acessar o frontend:');
    console.log('   https://atendeai.lify.com.br');

  } catch (error) {
    console.error('❌ Erro durante o processo:', error);
    process.exit(1);
  }
}

forceDeployFix(); 