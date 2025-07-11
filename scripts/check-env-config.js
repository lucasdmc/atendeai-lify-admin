import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Verificando configuração de ambiente...\n');

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_WHATSAPP_SERVER_URL',
  'VITE_GOOGLE_CLIENT_ID',
  'VITE_GOOGLE_CLIENT_SECRET'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'your_' + varName.toLowerCase().replace('vite_', '') + '_here') {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Não configurado ou valor padrão`);
    allGood = false;
  }
});

console.log('\n📋 Configurações atuais:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Configurado' : 'Não configurado');
console.log('VITE_WHATSAPP_SERVER_URL:', process.env.VITE_WHATSAPP_SERVER_URL);
console.log('VITE_GOOGLE_CLIENT_ID:', process.env.VITE_GOOGLE_CLIENT_ID ? 'Configurado' : 'Não configurado');

if (allGood) {
  console.log('\n🎉 Todas as variáveis de ambiente estão configuradas!');
} else {
  console.log('\n⚠️ Algumas variáveis de ambiente precisam ser configuradas.');
  console.log('Copie o arquivo .env.example para .env e configure os valores.');
} 