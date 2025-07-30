#!/usr/bin/env node

/**
 * Script para verificar e corrigir URLs para produção
 * Garante que todas as aplicações usem as URLs corretas
 */

const fs = require('fs');
const path = require('path');

// URLs corretas para produção
const PRODUCTION_URLS = {
  backend: 'http://31.97.241.19:3001',
  supabase: 'https://niakqdolcdwxtrkbqmdi.supabase.co',
  frontend: 'https://atendeai.lify.com.br',
  webhook: 'https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/agent-whatsapp-manager/webhook'
};

// URLs que devem ser substituídas
const LOCAL_URLS = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'localhost:3001',
  '127.0.0.1:3001',
  'your-project.supabase.co',
  'atendeai-lify-admin.supabase.co'
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];

    // Verificar URLs locais
    LOCAL_URLS.forEach(localUrl => {
      if (content.includes(localUrl)) {
        issues.push({
          type: 'local_url',
          url: localUrl,
          line: content.split('\n').findIndex(line => line.includes(localUrl)) + 1
        });
      }
    });

    // Verificar URLs hardcoded
    const hardcodedPatterns = [
      /http:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:[0-9]+/g,
      /https:\/\/[a-zA-Z0-9-]+\.supabase\.co/g
    ];

    hardcodedPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(match => {
          if (!Object.values(PRODUCTION_URLS).includes(match)) {
            issues.push({
              type: 'hardcoded_url',
              url: match,
              line: content.split('\n').findIndex(line => line.includes(match)) + 1
            });
          }
        });
      }
    });

    return issues;
  } catch (error) {
    return [{ type: 'error', message: error.message }];
  }
}

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let fixed = false;

    // Substituir URLs locais pelas corretas
    LOCAL_URLS.forEach(localUrl => {
      if (content.includes(localUrl)) {
        if (localUrl.includes('localhost') || localUrl.includes('127.0.0.1')) {
          content = content.replace(new RegExp(localUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), PRODUCTION_URLS.backend);
          fixed = true;
        }
      }
    });

    // Substituir URLs do Supabase incorretas
    if (content.includes('your-project.supabase.co') || content.includes('atendeai-lify-admin.supabase.co')) {
      content = content.replace(/your-project\.supabase\.co/g, 'niakqdolcdwxtrkbqmdi.supabase.co');
      content = content.replace(/atendeai-lify-admin\.supabase\.co/g, 'niakqdolcdwxtrkbqmdi.supabase.co');
      fixed = true;
    }

    if (fixed) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erro ao corrigir arquivo ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dir, extensions = ['.js', '.ts', '.tsx', '.json', '.env']) {
  const files = [];
  
  function scan(currentDir) {
    try {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            // Pular node_modules e outros diretórios desnecessários
            if (!['node_modules', '.git', 'dist', 'build', '.next', 'temp', 'tmp'].includes(item)) {
              scan(fullPath);
            }
          } else if (stat.isFile()) {
            const ext = path.extname(item);
            if (extensions.includes(ext)) {
              files.push(fullPath);
            }
          }
        } catch (error) {
          // Ignorar arquivos/diretórios que não podem ser acessados
          console.warn(`⚠️  Ignorando ${fullPath}: ${error.message}`);
        }
      }
    } catch (error) {
      // Ignorar diretórios que não podem ser lidos
      console.warn(`⚠️  Não foi possível ler diretório ${currentDir}: ${error.message}`);
    }
  }
  
  scan(dir);
  return files;
}

async function main() {
  console.log('🔍 VERIFICANDO URLs PARA PRODUÇÃO\n');

  const files = scanDirectory('.');
  console.log(`📁 Encontrados ${files.length} arquivos para verificar\n`);

  let totalIssues = 0;
  let fixedFiles = 0;

  for (const file of files) {
    const issues = checkFile(file);
    
    if (issues.length > 0) {
      console.log(`📄 ${file}`);
      
      issues.forEach(issue => {
        if (issue.type === 'error') {
          console.log(`   ❌ Erro: ${issue.message}`);
        } else {
          console.log(`   ⚠️  ${issue.type}: ${issue.url} (linha ${issue.line})`);
        }
      });

      totalIssues += issues.length;

      // Perguntar se quer corrigir
      const shouldFix = process.argv.includes('--fix');
      if (shouldFix) {
        const fixed = fixFile(file);
        if (fixed) {
          console.log(`   ✅ Arquivo corrigido`);
          fixedFiles++;
        }
      }
      
      console.log('');
    }
  }

  console.log('📊 RESUMO:');
  console.log(`   📁 Arquivos verificados: ${files.length}`);
  console.log(`   ⚠️  Problemas encontrados: ${totalIssues}`);
  console.log(`   ✅ Arquivos corrigidos: ${fixedFiles}`);

  if (totalIssues === 0) {
    console.log('\n🎉 Todas as URLs estão corretas para produção!');
  } else {
    console.log('\n💡 Para corrigir automaticamente, execute:');
    console.log('   node scripts/verify-production-urls.cjs --fix');
  }

  console.log('\n🔧 URLs CORRETAS PARA PRODUÇÃO:');
  Object.entries(PRODUCTION_URLS).forEach(([name, url]) => {
    console.log(`   ${name}: ${url}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkFile,
  fixFile,
  scanDirectory,
  PRODUCTION_URLS
}; 