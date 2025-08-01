// ========================================
// COMPILADOR DOS SERVIÇOS AI TYPESCRIPT
// ========================================

import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 COMPILANDO SERVIÇOS AI TYPESCRIPT');
console.log('=====================================');

// Configuração do TypeScript
const tsConfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'node',
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    allowJs: true,
    strict: false,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    isolatedModules: true,
    noEmit: false,
    outDir: './dist',
    rootDir: './src'
  },
  include: ['src/**/*'],
  exclude: ['node_modules', 'dist']
};

// Criar diretório dist se não existir
const distDir = join(__dirname, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Compilar arquivos TypeScript
try {
  console.log('📋 1. Compilando arquivos TypeScript...');
  
  // Compilar usando tsc com configuração específica
  execSync('npx tsc --project tsconfig.build.json', { 
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('✅ Compilação concluída!');
  
  // Verificar se os arquivos foram criados
  console.log('');
  console.log('📋 2. Verificando arquivos compilados...');
  
  const aiServicesDir = join(distDir, 'services', 'ai');
  if (existsSync(aiServicesDir)) {
    const files = readdirSync(aiServicesDir);
    console.log('✅ Arquivos compilados encontrados:');
    files.forEach(file => {
      console.log(`   📄 ${file}`);
    });
  } else {
    console.log('❌ Diretório de serviços AI não encontrado');
  }
  
  console.log('');
  console.log('📋 3. Testando importação dos serviços compilados...');
  
  // Testar importação
  try {
    const { LLMOrchestratorService } = await import('./dist/services/ai/llmOrchestratorService.js');
    console.log('✅ LLMOrchestratorService importado com sucesso');
    
    const { AIOrchestrator } = await import('./dist/services/ai/ai-orchestrator.js');
    console.log('✅ AIOrchestrator importado com sucesso');
    
    console.log('✅ Todos os serviços compilados e funcionando!');
    
  } catch (error) {
    console.error('❌ Erro ao importar serviços compilados:', error.message);
  }
  
} catch (error) {
  console.error('❌ Erro na compilação:', error.message);
}

console.log('');
console.log('🎉 Compilação concluída!'); 