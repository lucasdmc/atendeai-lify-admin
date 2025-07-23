#!/usr/bin/env node

/**
 * Script para iniciar a Fase 1 da integração frontend-backend
 * Fase 1: Infraestrutura
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando Fase 1 da Integração Frontend-Backend');
console.log('📋 Fase 1: Infraestrutura');
console.log('');

// Verificar se estamos no diretório correto
const currentDir = process.cwd();
const isFrontendDir = fs.existsSync(path.join(currentDir, 'src')) && 
                     fs.existsSync(path.join(currentDir, 'package.json'));

if (!isFrontendDir) {
  console.error('❌ Erro: Execute este script no diretório do frontend (atendeai-lify-admin)');
  process.exit(1);
}

console.log('✅ Diretório correto detectado');
console.log('');

// Lista de arquivos a serem criados/modificados na Fase 1
const phase1Files = [
  {
    name: 'src/services/apiClient.ts',
    description: 'Cliente HTTP centralizado',
    priority: 'ALTA'
  },
  {
    name: 'src/services/authService.ts', 
    description: 'Sistema de autenticação',
    priority: 'ALTA'
  },
  {
    name: 'src/config/environment.ts',
    description: 'Configuração atualizada',
    priority: 'ALTA'
  }
];

console.log('📋 Arquivos da Fase 1:');
phase1Files.forEach((file, index) => {
  console.log(`${index + 1}. ${file.name} (${file.priority})`);
  console.log(`   📝 ${file.description}`);
});
console.log('');

// Verificar status atual dos arquivos
console.log('🔍 Verificando status atual dos arquivos...');
console.log('');

phase1Files.forEach(file => {
  const filePath = path.join(currentDir, file.name);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅ EXISTE' : '❌ NÃO EXISTE';
  console.log(`${file.name}: ${status}`);
});

console.log('');
console.log('🎯 Próximos passos:');
console.log('1. Criar apiClient.ts - Cliente HTTP centralizado');
console.log('2. Criar authService.ts - Sistema de autenticação');
console.log('3. Atualizar environment.ts - Configuração');
console.log('');
console.log('💡 Para começar, execute:');
console.log('   npm run integration:phase1');
console.log('');
console.log('📊 Progresso atual: 0% (Fase 1)');
console.log('🎯 Meta: 25% (Fase 1 completa)');
console.log('');

// Verificar dependências necessárias
console.log('🔧 Verificando dependências...');
const packageJsonPath = path.join(currentDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  
  const requiredDeps = [
    'axios',
    'react-query',
    '@tanstack/react-query'
  ];
  
  console.log('📦 Dependências necessárias:');
  requiredDeps.forEach(dep => {
    const installed = dependencies[dep] || packageJson.devDependencies?.[dep];
    const status = installed ? '✅ INSTALADA' : '❌ NÃO INSTALADA';
    console.log(`   ${dep}: ${status}`);
  });
  
  const missingDeps = requiredDeps.filter(dep => 
    !dependencies[dep] && !packageJson.devDependencies?.[dep]
  );
  
  if (missingDeps.length > 0) {
    console.log('');
    console.log('⚠️  Dependências faltando:');
    console.log(`   npm install ${missingDeps.join(' ')}`);
  }
}

console.log('');
console.log('🎉 Fase 1 pronta para iniciar!');
console.log('🚀 Execute: npm run integration:phase1'); 