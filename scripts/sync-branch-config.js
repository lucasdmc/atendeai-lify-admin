import { execSync } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
config({ path: join(__dirname, '..', '.env') });

console.log('🔄 Sincronizando configurações da branch...\n');

async function syncBranchConfig() {
  try {
    // 1. Verificar branch atual
    console.log('1️⃣ Verificando branch atual...');
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`   Branch atual: ${currentBranch}`);

    // 2. Verificar se há diferenças com main
    console.log('\n2️⃣ Verificando diferenças com main...');
    try {
      const diffOutput = execSync('git diff main --name-only', { encoding: 'utf8' });
      if (diffOutput.trim()) {
        console.log('   Arquivos diferentes da main:');
        console.log(diffOutput.split('\n').filter(f => f).map(f => `   - ${f}`).join('\n'));
      } else {
        console.log('   ✅ Branch está sincronizada com main');
      }
    } catch (error) {
      console.log('   ⚠️ Não foi possível comparar com main');
    }

    // 3. Verificar configurações do Supabase
    console.log('\n3️⃣ Verificando configurações do Supabase...');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      console.log('   ✅ Variáveis do Supabase configuradas');
    } else {
      console.log('   ❌ Variáveis do Supabase não configuradas');
    }

    // 4. Verificar se as migrations foram aplicadas
    console.log('\n4️⃣ Verificando migrations do Supabase...');
    try {
      const migrations = execSync('ls supabase/migrations/', { encoding: 'utf8' });
      console.log('   Migrations encontradas:');
      console.log(migrations.split('\n').filter(f => f).map(f => `   - ${f}`).join('\n'));
    } catch (error) {
      console.log('   ⚠️ Não foi possível listar migrations');
    }

    // 5. Recomendações
    console.log('\n5️⃣ Recomendações:');
    console.log('');
    console.log('   🔧 Para resolver problemas de autenticação:');
    console.log('   1. Limpe o cache do navegador');
    console.log('   2. Faça logout e login novamente');
    console.log('   3. Use uma aba anônima para testar');
    console.log('');
    console.log('   🔄 Para sincronizar com main:');
    console.log('   git fetch origin');
    console.log('   git merge origin/main');
    console.log('');
    console.log('   🗄️ Para aplicar migrations:');
    console.log('   npx supabase db push');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

// Executar sincronização
syncBranchConfig(); 