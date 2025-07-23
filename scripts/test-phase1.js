#!/usr/bin/env node

/**
 * Script para testar a Fase 1 da integração frontend-backend
 * Testa: apiClient, authService, environment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testando Fase 1 da Integração Frontend-Backend');
console.log('📋 Testando: apiClient, authService, environment');
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

// Lista de arquivos da Fase 1
const phase1Files = [
  'src/services/apiClient.ts',
  'src/services/authService.ts',
  'src/config/environment.ts'
];

// Verificar se os arquivos existem
console.log('🔍 Verificando arquivos da Fase 1...');
console.log('');

let allFilesExist = true;
phase1Files.forEach(file => {
  const filePath = path.join(currentDir, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅ EXISTE' : '❌ NÃO EXISTE';
  console.log(`${file}: ${status}`);
  
  if (!exists) {
    allFilesExist = false;
  }
});

console.log('');

if (!allFilesExist) {
  console.error('❌ Alguns arquivos da Fase 1 não existem!');
  console.error('💡 Execute primeiro: node scripts/start-integration-phase1.js');
  process.exit(1);
}

console.log('✅ Todos os arquivos da Fase 1 existem!');
console.log('');

// Verificar conteúdo dos arquivos
console.log('📝 Verificando conteúdo dos arquivos...');
console.log('');

// Verificar apiClient.ts
const apiClientPath = path.join(currentDir, 'src/services/apiClient.ts');
const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');

const apiClientChecks = [
  { name: 'Import axios', check: apiClientContent.includes('import axios') },
  { name: 'Class ApiClient', check: apiClientContent.includes('class ApiClient') },
  { name: 'Interceptors', check: apiClientContent.includes('interceptors') },
  { name: 'Retry logic', check: apiClientContent.includes('retry') },
  { name: 'Error handling', check: apiClientContent.includes('formatError') },
  { name: 'Auth token', check: apiClientContent.includes('getAuthToken') },
  { name: 'HTTP methods', check: apiClientContent.includes('get(') && apiClientContent.includes('post(') },
  { name: 'Health check', check: apiClientContent.includes('healthCheck') },
];

console.log('📋 apiClient.ts:');
apiClientChecks.forEach(check => {
  const status = check.check ? '✅' : '❌';
  console.log(`   ${status} ${check.name}`);
});

// Verificar authService.ts
const authServicePath = path.join(currentDir, 'src/services/authService.ts');
const authServiceContent = fs.readFileSync(authServicePath, 'utf8');

const authServiceChecks = [
  { name: 'Import apiClient', check: authServiceContent.includes('import apiClient') },
  { name: 'Class AuthService', check: authServiceContent.includes('class AuthService') },
  { name: 'Login method', check: authServiceContent.includes('login(') },
  { name: 'Register method', check: authServiceContent.includes('register(') },
  { name: 'Logout method', check: authServiceContent.includes('logout(') },
  { name: 'Refresh token', check: authServiceContent.includes('refreshToken(') },
  { name: 'Reset password', check: authServiceContent.includes('resetPassword(') },
  { name: 'Change password', check: authServiceContent.includes('changePassword(') },
  { name: 'Verify email', check: authServiceContent.includes('verifyEmail(') },
  { name: 'Get current user', check: authServiceContent.includes('getCurrentUser(') },
  { name: 'Is authenticated', check: authServiceContent.includes('isAuthenticated(') },
  { name: 'Health check', check: authServiceContent.includes('checkBackendHealth(') },
];

console.log('');
console.log('📋 authService.ts:');
authServiceChecks.forEach(check => {
  const status = check.check ? '✅' : '❌';
  console.log(`   ${status} ${check.name}`);
});

// Verificar environment.ts
const environmentPath = path.join(currentDir, 'src/config/environment.ts');
const environmentContent = fs.readFileSync(environmentPath, 'utf8');

const environmentChecks = [
  { name: 'Backend config', check: environmentContent.includes('backend:') },
  { name: 'Backend URL', check: environmentContent.includes('VITE_BACKEND_URL') },
  { name: 'Auth endpoints', check: environmentContent.includes('auth:') },
  { name: 'WhatsApp endpoints', check: environmentContent.includes('whatsapp:') },
  { name: 'Calendar endpoints', check: environmentContent.includes('calendar:') },
  { name: 'AI endpoints', check: environmentContent.includes('ai:') },
  { name: 'RAG endpoints', check: environmentContent.includes('rag:') },
  { name: 'Setup endpoints', check: environmentContent.includes('setup:') },
];

console.log('');
console.log('📋 environment.ts:');
environmentChecks.forEach(check => {
  const status = check.check ? '✅' : '❌';
  console.log(`   ${status} ${check.name}`);
});

// Calcular score geral
const allChecks = [...apiClientChecks, ...authServiceChecks, ...environmentChecks];
const passedChecks = allChecks.filter(check => check.check).length;
const totalChecks = allChecks.length;
const score = Math.round((passedChecks / totalChecks) * 100);

console.log('');
console.log('📊 Score da Fase 1:');
console.log(`   ✅ Passou: ${passedChecks}/${totalChecks} (${score}%)`);

if (score >= 90) {
  console.log('🎉 Fase 1 está pronta para uso!');
  console.log('🚀 Próximo passo: Iniciar Fase 2 (Funcionalidades Críticas)');
} else if (score >= 70) {
  console.log('⚠️  Fase 1 tem alguns problemas menores');
  console.log('🔧 Verifique os itens marcados com ❌');
} else {
  console.log('❌ Fase 1 tem problemas significativos');
  console.log('🔧 Corrija os itens marcados com ❌ antes de continuar');
}

console.log('');
console.log('💡 Para testar a integração real:');
console.log('   1. Iniciar o backend: cd ../atendeai-lify-backend && npm start');
console.log('   2. Iniciar o frontend: npm run dev');
console.log('   3. Verificar no console se as APIs estão funcionando'); 