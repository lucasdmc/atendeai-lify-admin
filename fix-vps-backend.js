#!/usr/bin/env node

// Script para corrigir o backend da VPS
// Substitui temp-${Date.now()} por UUIDs válidos

const fs = require('fs');
const path = require('path');

// Função para gerar UUID temporário
function generateTempUUID() {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Função para gerar UUID válido
function generateValidUUID() {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
}

// Comandos para executar no servidor
const commands = [
  // 1. Fazer backup do arquivo atual
  'cp server.js server.js.backup',
  
  // 2. Substituir temp-${Date.now()} por UUIDs válidos
  `sed -i 's/temp-\\$\\{Date.now()\\}/uuidv4()/g' server.js`,
  
  // 3. Substituir as comparações que usam temp-${Date.now()}
  `sed -i 's/connectionId !== \`temp-\\$\\{Date.now()\\}\`/connectionId !== null \&\& connectionId !== undefined/g' server.js`,
  
  // 4. Adicionar uuidv4() onde necessário
  `sed -i 's/connectionId || \`temp-\\$\\{Date.now()\\}\`/connectionId || uuidv4()/g' server.js`,
  
  // 5. Verificar se as alterações foram aplicadas
  'grep -n "uuidv4()" server.js',
  
  // 6. Reiniciar o servidor
  'pm2 restart all'
];

console.log('Comandos para executar no servidor:');
commands.forEach((cmd, index) => {
  console.log(`${index + 1}. ${cmd}`);
});

console.log('\nPara aplicar as correções, execute os comandos acima no servidor da VPS.'); 