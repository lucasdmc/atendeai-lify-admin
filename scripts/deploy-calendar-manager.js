#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Deployando Edge Function calendar-manager...');

try {
  // Verificar se o arquivo da edge function existe
  const functionPath = path.join(__dirname, '..', 'supabase', 'functions', 'calendar-manager', 'index.ts');
  
  if (!fs.existsSync(functionPath)) {
    console.error('❌ Arquivo da edge function não encontrado:', functionPath);
    process.exit(1);
  }

  console.log('✅ Arquivo da edge function encontrado');

  // Deploy da edge function
  console.log('📦 Fazendo deploy da edge function...');
  execSync('npx supabase functions deploy calendar-manager', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });

  console.log('✅ Edge function calendar-manager deployada com sucesso!');
  console.log('🔗 URL da função: https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/calendar-manager');

} catch (error) {
  console.error('❌ Erro ao fazer deploy da edge function:', error.message);
  process.exit(1);
} 