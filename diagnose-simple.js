/**
 * DIAGNÓSTICO SIMPLES DO SISTEMA DE AGENDAMENTO
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Carregar variáveis de ambiente ANTES de qualquer verificação
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 INICIANDO DIAGNÓSTICO SIMPLES');
console.log('=' .repeat(50));

// Verificar Node.js
console.log(`✅ Node.js versão: ${process.version}`);

// Verificar diretório atual
console.log(`✅ Diretório atual: ${process.cwd()}`);

// Verificar arquivos essenciais
const essentialFiles = [
  'services/core/appointmentFlowManager.js',
  'services/core/llmOrchestratorService.js',
  'services/core/googleCalendarService.js',
  'services/core/clinicContextManager.js',
  'services/core/index.js',
  'routes/webhook-final.js',
  'package.json'
];

console.log('\n📁 VERIFICAÇÃO DE ARQUIVOS ESSENCIAIS:');
console.log('-'.repeat(40));

for (const file of essentialFiles) {
  try {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - Presente`);
    } else {
      console.log(`❌ ${file} - AUSENTE`);
    }
  } catch (error) {
    console.log(`❌ ${file} - Erro ao verificar`);
  }
}

// Verificar package.json
console.log('\n📦 VERIFICAÇÃO DE PACKAGE.JSON:');
console.log('-'.repeat(40));

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log(`✅ Versão: ${packageJson.version || 'N/A'}`);
  console.log(`✅ Nome: ${packageJson.name || 'N/A'}`);
  
  // Verificar dependências essenciais
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const essentialDeps = ['@supabase/supabase-js', 'openai', 'express'];
  
  console.log('\n📦 DEPENDÊNCIAS ESSENCIAIS:');
  for (const dep of essentialDeps) {
    if (deps[dep]) {
      console.log(`✅ ${dep} - ${deps[dep]}`);
    } else {
      console.log(`❌ ${dep} - AUSENTE`);
    }
  }
  
} catch (error) {
  console.log(`❌ Erro ao ler package.json: ${error.message}`);
}

// Verificar node_modules
console.log('\n📁 VERIFICAÇÃO DE NODE_MODULES:');
console.log('-'.repeat(40));

try {
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules/ - Presente');
    
    // Verificar algumas dependências específicas
    const supabasePath = 'node_modules/@supabase/supabase-js';
    if (fs.existsSync(supabasePath)) {
      console.log('✅ @supabase/supabase-js - Instalado');
    } else {
      console.log('❌ @supabase/supabase-js - Não instalado');
    }
    
    const openaiPath = 'node_modules/openai';
    if (fs.existsSync(openaiPath)) {
      console.log('✅ openai - Instalado');
    } else {
      console.log('❌ openai - Não instalado');
    }
    
  } else {
    console.log('❌ node_modules/ - AUSENTE');
  }
} catch (error) {
  console.log(`❌ Erro ao verificar node_modules: ${error.message}`);
}

// Verificar variáveis de ambiente
console.log('\n⚙️ VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE:');
console.log('-'.repeat(40));

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'WHATSAPP_META_ACCESS_TOKEN',
  'WHATSAPP_META_PHONE_NUMBER_ID'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} - Configurada`);
  } else {
    console.log(`❌ ${envVar} - AUSENTE`);
  }
}

// Verificar arquivo .env
console.log('\n📄 VERIFICAÇÃO DE ARQUIVO .ENV:');
console.log('-'.repeat(40));

try {
  if (fs.existsSync('.env')) {
    console.log('✅ .env - Presente');
  } else {
    console.log('⚠️ .env - Ausente (use env.example como base)');
  }
} catch (error) {
  console.log(`❌ Erro ao verificar .env: ${error.message}`);
}

// Verificar estrutura de diretórios
console.log('\n📁 VERIFICAÇÃO DE DIRETÓRIOS:');
console.log('-'.repeat(40));

const essentialDirs = ['services/core', 'routes', 'config'];
for (const dir of essentialDirs) {
  try {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      console.log(`✅ ${dir}/ - Diretório presente`);
    } else {
      console.log(`❌ ${dir}/ - Não é um diretório válido`);
    }
  } catch (error) {
    console.log(`❌ ${dir}/ - Erro ao verificar`);
  }
}

// Relatório final
console.log('\n' + '='.repeat(50));
console.log('📊 RELATÓRIO FINAL DO DIAGNÓSTICO SIMPLES');
console.log('='.repeat(50));

console.log('\n💡 RECOMENDAÇÕES:');
console.log('• Se houver problemas, execute: npm install');
console.log('• Configure todas as variáveis de ambiente');
console.log('• Verifique se está no diretório correto');
console.log('• Execute o diagnóstico completo após correções');

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('• Corrija problemas identificados');
console.log('• Execute o diagnóstico completo');
console.log('• Execute os testes end-to-end');
console.log('• Valide o sistema antes de usar em produção');

console.log('\n✅ DIAGNÓSTICO SIMPLES CONCLUÍDO!');
