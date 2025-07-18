#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function checkFrontendBuild() {
  console.log('🔧 VERIFICANDO BUILD DO FRONTEND');
  console.log('=' .repeat(40));

  // Verificar se estamos no diretório correto
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json não encontrado. Execute este script no diretório raiz do projeto.');
    return;
  }

  // Verificar dependências
  console.log('\n1️⃣ Verificando dependências...');
  try {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log('⚠️  node_modules não encontrado. Instalando dependências...');
      execSync('npm install', { stdio: 'inherit' });
    } else {
      console.log('✅ node_modules encontrado');
    }
  } catch (error) {
    console.log('❌ Erro ao instalar dependências:', error.message);
  }

  // Verificar TypeScript
  console.log('\n2️⃣ Verificando TypeScript...');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log('✅ TypeScript sem erros');
  } catch (error) {
    console.log('❌ Erros de TypeScript encontrados');
    console.log('💡 Execute: npm run type-check para ver detalhes');
  }

  // Verificar ESLint
  console.log('\n3️⃣ Verificando ESLint...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ ESLint sem erros');
  } catch (error) {
    console.log('❌ Erros de ESLint encontrados');
    console.log('💡 Execute: npm run lint:fix para corrigir automaticamente');
  }

  // Tentar build de desenvolvimento
  console.log('\n4️⃣ Testando build de desenvolvimento...');
  try {
    execSync('npm run build:dev', { stdio: 'inherit' });
    console.log('✅ Build de desenvolvimento bem-sucedido');
  } catch (error) {
    console.log('❌ Erro no build de desenvolvimento');
    console.log('💡 Verifique os erros acima');
  }

  // Verificar se o diretório dist foi criado
  console.log('\n5️⃣ Verificando arquivos de build...');
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log(`✅ Diretório dist criado com ${files.length} arquivos`);
    
    // Verificar arquivos principais
    const mainFiles = ['index.html', 'assets'];
    for (const file of mainFiles) {
      const filePath = path.join(distPath, file);
      if (fs.existsSync(filePath)) {
        console.log(`✅ ${file} encontrado`);
      } else {
        console.log(`❌ ${file} não encontrado`);
      }
    }
  } else {
    console.log('❌ Diretório dist não foi criado');
  }

  // Verificar configuração do Vite
  console.log('\n6️⃣ Verificando configuração do Vite...');
  const viteConfigPath = path.join(process.cwd(), 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    console.log('✅ vite.config.ts encontrado');
    
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    if (viteConfig.includes('defineConfig')) {
      console.log('✅ Configuração do Vite parece válida');
    } else {
      console.log('⚠️  Configuração do Vite pode ter problemas');
    }
  } else {
    console.log('❌ vite.config.ts não encontrado');
  }

  // Verificar variáveis de ambiente
  console.log('\n7️⃣ Verificando variáveis de ambiente...');
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env encontrado');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    
    for (const varName of requiredVars) {
      if (envContent.includes(varName)) {
        console.log(`✅ ${varName} configurado`);
      } else {
        console.log(`⚠️  ${varName} não encontrado`);
      }
    }
  } else {
    console.log('⚠️  Arquivo .env não encontrado');
    console.log('💡 Copie env.example para .env e configure as variáveis');
  }

  // Resumo final
  console.log('\n📋 RESUMO DO DIAGNÓSTICO');
  console.log('=' .repeat(30));
  
  const issues = [];
  
  if (!fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
    issues.push('Build não foi gerado corretamente');
  }
  
  if (!fs.existsSync(envPath)) {
    issues.push('Arquivo .env não encontrado');
  }
  
  if (issues.length === 0) {
    console.log('✅ Frontend pronto para build');
    console.log('💡 Execute: npm run build para gerar build de produção');
  } else {
    console.log('❌ Problemas encontrados:');
    issues.forEach(issue => console.log(`   - ${issue}`));
  }

  console.log('\n🎯 COMANDOS ÚTEIS:');
  console.log('npm run build          - Build de produção');
  console.log('npm run build:dev      - Build de desenvolvimento');
  console.log('npm run dev            - Servidor de desenvolvimento');
  console.log('npm run lint           - Verificar código');
  console.log('npm run lint:fix       - Corrigir problemas de código');
  console.log('npm run type-check     - Verificar tipos TypeScript');
}

checkFrontendBuild().catch(console.error); 