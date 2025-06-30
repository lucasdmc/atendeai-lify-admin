import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

console.log('🚀 Deploying Google User Auth Edge Function...');

try {
  // Verificar se o Supabase CLI está instalado
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI encontrado');
  } catch (error) {
    console.error('❌ Supabase CLI não encontrado. Instale com:');
    console.error('   brew install supabase/tap/supabase');
    process.exit(1);
  }

  // Fazer login no Supabase (se necessário)
  console.log('🔐 Verificando login no Supabase...');
  try {
    execSync('supabase status', { stdio: 'pipe' });
    console.log('✅ Já logado no Supabase');
  } catch (error) {
    console.log('⚠️ Não logado no Supabase. Execute:');
    console.log('   supabase login');
    console.log('   E depois rode este script novamente');
    process.exit(1);
  }

  // Deploy da Edge Function
  console.log('📦 Fazendo deploy da Edge Function google-user-auth...');
  execSync('supabase functions deploy google-user-auth', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Deploy concluído com sucesso!');
  console.log('');
  console.log('🔗 URL da função: https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth');
  console.log('');
  console.log('📝 Para testar, você pode usar:');
  console.log('   curl -X POST "https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth" \\');
  console.log('     -H "Content-Type: application/json" \\');
  console.log('     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw" \\');
  console.log('     -d \'{"code": "test", "redirectUri": "http://localhost:8080/agendamentos"}\'');

} catch (error) {
  console.error('❌ Erro durante o deploy:', error.message);
  process.exit(1);
} 