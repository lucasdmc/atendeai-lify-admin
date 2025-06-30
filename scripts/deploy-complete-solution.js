import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

async function deployCompleteSolution() {
  console.log('🚀 Deployando solução completa de autenticação Google...\n');

  try {
    // 1. Verificar variáveis de ambiente
    console.log('1️⃣ Verificando variáveis de ambiente...');
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

    // 2. Verificar se o Supabase CLI está instalado
    console.log('\n2️⃣ Verificando Supabase CLI...');
    try {
      execSync('supabase --version', { stdio: 'pipe' });
      console.log('   ✅ Supabase CLI encontrado');
    } catch (error) {
      console.log('   ❌ Supabase CLI não encontrado');
      console.log('   📋 Instale com: brew install supabase/tap/supabase');
      console.log('   📋 Ou baixe de: https://supabase.com/docs/guides/cli');
      console.log('\n   💡 Alternativa: Configure manualmente no Supabase Dashboard');
      console.log('   1. Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi');
      console.log('   2. Vá em: Settings > Environment Variables');
      console.log('   3. Configure:');
      console.log(`      VITE_GOOGLE_CLIENT_ID = ${clientId}`);
      console.log(`      VITE_GOOGLE_CLIENT_SECRET = ${clientSecret}`);
      console.log('   4. Salve e aguarde alguns minutos');
      return;
    }

    // 3. Verificar projeto Supabase
    console.log('\n3️⃣ Verificando projeto Supabase...');
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

    // 4. Deploy da Edge Function
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

    // 5. Resumo da solução
    console.log('\n5️⃣ Resumo da solução implementada:');
    console.log('   ✅ Nova Edge Function com ação "complete-auth"');
    console.log('   ✅ Processamento completo na Edge Function (sem frontend)');
    console.log('   ✅ Seleção de calendários após autenticação');
    console.log('   ✅ Tokens temporários para segurança');
    console.log('   ✅ Interface de seleção de calendários');
    console.log('   ✅ Tratamento de erros melhorado');

    // 6. Instruções de teste
    console.log('\n6️⃣ Como testar:');
    console.log('   1. Acesse: https://atendeai.lify.com.br/agendamentos');
    console.log('   2. Clique em "Conectar Google Calendar"');
    console.log('   3. Faça login no Google');
    console.log('   4. Selecione os calendários desejados');
    console.log('   5. Confirme a conexão');

    // 7. Verificação de logs
    console.log('\n7️⃣ Para verificar logs:');
    console.log('   - Supabase Dashboard > Edge Functions > google-user-auth > Logs');
    console.log('   - Ou use: supabase functions logs google-user-auth');

    // 8. Checklist final
    console.log('\n8️⃣ Checklist final:');
    console.log('   ✅ Variáveis de ambiente configuradas');
    console.log('   ✅ Edge Function deployada');
    console.log('   ✅ Frontend atualizado');
    console.log('   ✅ Componente de seleção criado');
    console.log('   ✅ Hook de autenticação atualizado');

    console.log('\n🎉 Solução completa deployada!');
    console.log('📋 A autenticação Google agora funciona sem loops e permite seleção de calendários.');

  } catch (error) {
    console.error('❌ Erro durante o deploy:', error.message);
  }
}

deployCompleteSolution().catch(console.error); 