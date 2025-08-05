#!/usr/bin/env node

// Script para remover todas as referências da VPS do sistema
// Autor: Claude
// Data: 2025-01-16

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const VPS_REFERENCES = [
  'atendeai-backend-production.up.railway.app',
  'atendeai.com.br',
  'atendeai.server.com.br'
];

const RAILWAY_URL = 'https://atendeai-backend-production.up.railway.app';

console.log('🧹 REMOVENDO REFERÊNCIAS DA VPS');
console.log('================================\n');

// Função para substituir referências em um arquivo
function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    for (const reference of VPS_REFERENCES) {
      if (content.includes(reference)) {
        console.log(`   🔄 Substituindo ${reference} em ${filePath}`);
        
        // Substituir IP da VPS por Railway
        if (reference === 'atendeai-backend-production.up.railway.app') {
          content = content.replace(
            new RegExp(`http://${reference}:3001`, 'g'),
            RAILWAY_URL
          );
          content = content.replace(
            new RegExp(`https://${reference}:3001`, 'g'),
            RAILWAY_URL
          );
          content = content.replace(
            new RegExp(reference, 'g'),
            'atendeai-backend-production.up.railway.app'
          );
        }
        
        // Substituir domínio da VPS por Railway
        if (reference === 'atendeai.com.br') {
          content = content.replace(
            new RegExp(`https://${reference}`, 'g'),
            RAILWAY_URL
          );
          content = content.replace(
            new RegExp(`http://${reference}`, 'g'),
            RAILWAY_URL
          );
        }
        
        modified = true;
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`   ✅ ${filePath} atualizado`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.log(`   ❌ Erro ao processar ${filePath}: ${error.message}`);
    return false;
  }
}

// Função para processar diretório recursivamente
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  let processedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Pular diretórios que não devem ser processados
      if (['node_modules', '.git', 'dist', '.vite'].includes(file)) {
        continue;
      }
      processedCount += processDirectory(filePath);
    } else {
      // Processar apenas arquivos de texto
      const ext = path.extname(file);
      if (['.js', '.ts', '.tsx', '.json', '.md', '.sh', '.yml', '.yaml', '.txt'].includes(ext)) {
        if (replaceInFile(filePath)) {
          processedCount++;
        }
      }
    }
  }
  
  return processedCount;
}

// Executar limpeza
console.log('🔍 Procurando arquivos com referências da VPS...\n');

const processedFiles = processDirectory('.');

console.log(`\n✅ LIMPEZA CONCLUÍDA!`);
console.log(`📊 Arquivos processados: ${processedFiles}`);
console.log(`🌐 Nova URL: ${RAILWAY_URL}`);
console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('   1. Verificar se o Railway está funcionando');
console.log('   2. Testar os endpoints atualizados');
console.log('   3. Atualizar webhook do WhatsApp');
console.log('   4. Fazer deploy do frontend'); 