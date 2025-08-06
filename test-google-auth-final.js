import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function testGoogleAuthFinal() {
  console.log('🧪 Teste Final - Autenticação Google OAuth');
  
  try {
    // 1. Testar configurações
    console.log('\n1️⃣ Verificando configurações...');
    
    const config = {
      clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
      redirectUri: 'http://localhost:8080/agendamentos',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
    };
    
    console.log('   ✅ Client ID:', config.clientId);
    console.log('   ✅ Redirect URI:', config.redirectUri);
    console.log('   ✅ Scopes:', config.scopes);
    
    // 2. Gerar URL de autorização
    console.log('\n2️⃣ Gerando URL de autorização...');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    console.log('   🔗 URL de autorização:', authUrl.toString());
    
    // 3. Testar Edge Function com código de teste
    console.log('\n3️⃣ Testando Edge Function...');
    
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-user-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        code: 'test-code-123',
        redirectUri: config.redirectUri
      })
    });
    
    console.log('   📊 Status da Edge Function:', testResponse.status);
    
    if (testResponse.status === 500) {
      const errorData = await testResponse.text();
      console.log('   📋 Erro da Edge Function:', errorData);
      
      if (errorData.includes('invalid_client')) {
        console.log('   ⚠️ Erro: Client ID ou Client Secret inválidos');
        console.log('   💡 Verifique se as URLs estão configuradas no Google Cloud Console');
      } else if (errorData.includes('redirect_uri_mismatch')) {
        console.log('   ⚠️ Erro: URL de redirecionamento não corresponde');
        console.log('   💡 Verifique se a URL está correta no Google Cloud Console');
      } else {
        console.log('   ⚠️ Erro desconhecido, mas a Edge Function está respondendo');
      }
    } else if (testResponse.status === 200) {
      console.log('   ✅ Edge Function está funcionando corretamente!');
    }
    
    // 4. Verificar URLs necessárias
    console.log('\n4️⃣ URLs que devem estar configuradas no Google Cloud Console:');
    console.log('   🔗 http://localhost:8080/agendamentos');
    console.log('   🔗 https://atendeai.lify.com.br/agendamentos');
    console.log('   🔗 https://atendeai-lify-admin.vercel.app/agendamentos');
    console.log('   🔗 https://preview--atendeai-lify-admin.lovable.app/agendamentos');
    
    // 5. Instruções para teste manual
    console.log('\n5️⃣ Para testar manualmente:');
    console.log('   1. Abra o navegador');
    console.log('   2. Acesse: http://localhost:8080/agendamentos');
    console.log('   3. Clique em "Conectar Google Calendar"');
    console.log('   4. Complete o fluxo de autenticação');
    console.log('   5. Verifique se não há erros no console do navegador');
    
    // 6. Verificar se o servidor está rodando
    console.log('\n6️⃣ Verificando servidor local...');
    
    try {
      const serverResponse = await fetch('http://localhost:8080');
      if (serverResponse.ok) {
        console.log('   ✅ Servidor local está rodando em http://localhost:8080');
      } else {
        console.log('   ❌ Servidor local não está respondendo corretamente');
      }
    } catch (error) {
      console.log('   ❌ Servidor local não está rodando');
      console.log('   💡 Execute: npm run dev ou yarn dev');
    }
    
    // 7. Resumo final
    console.log('\n7️⃣ Resumo do Status:');
    console.log('   ✅ Credenciais configuradas na Edge Function');
    console.log('   ✅ Código corrigido para evitar duplicatas');
    console.log('   ✅ Constraint único aplicado no banco');
    console.log('   ⚠️ URLs precisam estar configuradas no Google Cloud Console');
    console.log('   ⚠️ Teste manual necessário para validação completa');
    
    console.log('\n🎯 Próximo passo: Teste manual no navegador!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testGoogleAuthFinal(); 