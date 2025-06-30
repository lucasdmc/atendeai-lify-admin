import dotenv from 'dotenv';

dotenv.config();

function fixGoogleAuth() {
  console.log('🔧 Resolvendo erro 401 invalid_client do Google OAuth2...\n');

  // 1. Mostrar as variáveis locais
  console.log('1️⃣ Variáveis locais (.env):');
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    console.log('   ❌ Variáveis não encontradas no arquivo .env');
    console.log('   📋 Configure o arquivo .env com as variáveis do Google OAuth2');
    return;
  }

  console.log(`   ✅ VITE_GOOGLE_CLIENT_ID: ${clientId}`);
  console.log(`   ✅ VITE_GOOGLE_CLIENT_SECRET: ${clientSecret.substring(0, 10)}...`);

  // 2. Instruções para configurar no Supabase
  console.log('\n2️⃣ Configuração no Supabase Dashboard:');
  console.log('   📋 Siga estes passos:');
  console.log('   1. Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi');
  console.log('   2. Vá em: Settings > Environment Variables');
  console.log('   3. Configure as seguintes variáveis:');
  console.log('');
  console.log('   🔑 VITE_GOOGLE_CLIENT_ID');
  console.log(`   Valor: ${clientId}`);
  console.log('');
  console.log('   🔑 VITE_GOOGLE_CLIENT_SECRET');
  console.log(`   Valor: ${clientSecret}`);
  console.log('');

  // 3. Verificar Google Cloud Console
  console.log('3️⃣ Verificação no Google Cloud Console:');
  console.log('   📋 Confirme que as seguintes URIs estão cadastradas:');
  console.log('   - https://atendeai.lify.com.br/agendamentos');
  console.log('   - http://localhost:8080/agendamentos');
  console.log('   - https://preview--atendeai-lify-admin.lovable.app/agendamentos');
  console.log('');

  // 4. Redeploy manual
  console.log('4️⃣ Redeploy da Edge Function:');
  console.log('   📋 Após configurar as variáveis no Supabase:');
  console.log('   1. Instale o Supabase CLI: brew install supabase/tap/supabase');
  console.log('   2. Faça login: supabase login');
  console.log('   3. Link o projeto: supabase link --project-ref niakqdolcdwxtrkbqmdi');
  console.log('   4. Deploy: supabase functions deploy google-user-auth');
  console.log('');

  // 5. Teste alternativo
  console.log('5️⃣ Teste alternativo (sem CLI):');
  console.log('   📋 Se não conseguir instalar o CLI:');
  console.log('   1. Configure as variáveis no Supabase Dashboard');
  console.log('   2. Aguarde alguns minutos para propagação');
  console.log('   3. Teste novamente no navegador');
  console.log('   4. Limpe o cache do navegador (Ctrl+Shift+R)');
  console.log('');

  // 6. Debug adicional
  console.log('6️⃣ Debug adicional:');
  console.log('   📋 Para verificar se as variáveis estão sendo lidas:');
  console.log('   1. Acesse: https://supabase.com/dashboard/project/niakqdolcdwxtrkbqmdi');
  console.log('   2. Vá em: Edge Functions > google-user-auth > Logs');
  console.log('   3. Procure pelos logs que adicionamos:');
  console.log('      - "DEBUG - GOOGLE_CLIENT_ID:"');
  console.log('      - "DEBUG - GOOGLE_CLIENT_SECRET: PRESENTE"');
  console.log('');

  // 7. Resumo da solução
  console.log('7️⃣ Resumo da solução:');
  console.log('   🎯 O erro 401 invalid_client significa que:');
  console.log('   - O Google não reconhece o client_id ou client_secret');
  console.log('   - As variáveis no Supabase estão diferentes das do Google Cloud Console');
  console.log('   - A redirect URI não está cadastrada no Google');
  console.log('');
  console.log('   ✅ Solução:');
  console.log('   1. Configure as variáveis corretas no Supabase Dashboard');
  console.log('   2. Confirme as redirect URIs no Google Cloud Console');
  console.log('   3. Redeploye a Edge Function');
  console.log('   4. Teste novamente');
  console.log('');

  // 8. Comandos úteis
  console.log('8️⃣ Comandos úteis:');
  console.log('   📋 Para verificar logs em tempo real:');
  console.log('   - Supabase Dashboard > Edge Functions > google-user-auth > Logs');
  console.log('');
  console.log('   📋 Para testar a função:');
  console.log('   - Acesse: https://atendeai.lify.com.br/agendamentos');
  console.log('   - Clique em "Conectar Google Calendar"');
  console.log('   - Observe os logs no DevTools (F12 > Console)');
}

fixGoogleAuth(); 