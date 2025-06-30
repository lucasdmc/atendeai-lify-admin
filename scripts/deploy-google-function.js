import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function deployGoogleFunction() {
  console.log('🚀 Fazendo deploy da Edge Function google-user-auth...\n');

  try {
    // 1. Verificar se o Supabase CLI está instalado
    console.log('1️⃣ Verificando Supabase CLI...');
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      console.log('   ✅ Supabase CLI encontrado');
    } catch (error) {
      console.log('   ❌ Supabase CLI não encontrado');
      console.log('   📋 Instale com: brew install supabase/tap/supabase');
      console.log('   📋 Ou baixe de: https://supabase.com/docs/guides/cli');
      return;
    }

    // 2. Verificar se estamos no projeto correto
    console.log('\n2️⃣ Verificando projeto Supabase...');
    try {
      const status = execSync('supabase status', { encoding: 'utf8' });
      console.log('   ✅ Projeto configurado');
      console.log('   📋 Status:', status.split('\n')[0]);
    } catch (error) {
      console.log('   ❌ Erro ao verificar status do projeto');
      console.log('   📋 Execute: supabase login');
      console.log('   📋 Depois: supabase link --project-ref niakqdolcdwxtrkbqmdi');
      return;
    }

    // 3. Verificar variáveis de ambiente
    console.log('\n3️⃣ Verificando variáveis de ambiente...');
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.log('   ❌ Variáveis do Google não encontradas no .env');
      console.log('   📋 Configure VITE_GOOGLE_CLIENT_ID e VITE_GOOGLE_CLIENT_SECRET');
      return;
    }

    console.log('   ✅ Variáveis encontradas');
    console.log(`   📋 Client ID: ${clientId}`);
    console.log(`   📋 Client Secret: ${clientSecret.substring(0, 10)}...`);

    // 4. Fazer deploy da função
    console.log('\n4️⃣ Fazendo deploy da Edge Function...');
    try {
      const deployOutput = execSync('supabase functions deploy google-user-auth', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log('   ✅ Deploy realizado com sucesso!');
      console.log('   📋 Output:', deployOutput.split('\n').slice(-3).join('\n'));
    } catch (error) {
      console.log('   ❌ Erro no deploy:', error.message);
      console.log('   📋 Verifique se você está logado no Supabase CLI');
      console.log('   📋 Execute: supabase login');
      return;
    }

    // 5. Verificar se a função está funcionando
    console.log('\n5️⃣ Verificando se a função está funcionando...');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/google-user-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          body: JSON.stringify({
            action: 'initiate-auth',
            state: 'test-deploy',
            userId: 'test-user'
          })
        });

        if (response.ok) {
          console.log('   ✅ Edge Function está funcionando corretamente');
        } else {
          console.log(`   ⚠️  Edge Function retornou status: ${response.status}`);
        }
      } catch (error) {
        console.log('   ⚠️  Não foi possível testar a função:', error.message);
      }
    }

    // 6. Resumo final
    console.log('\n6️⃣ Resumo do deploy:');
    console.log('   ✅ Edge Function google-user-auth foi deployada');
    console.log('   📋 Para verificar logs: supabase functions logs google-user-auth');
    console.log('   📋 Para testar: acesse https://atendeai.lify.com.br/agendamentos');
    console.log('   📋 Para verificar variáveis: Supabase Dashboard > Settings > Environment Variables');

  } catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
  }
}

deployGoogleFunction().catch(console.error); 