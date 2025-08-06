import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://niakqdolcdwxtrkbqmdi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pYWtxZG9sY2R3eHRya2JxbWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODI1NTksImV4cCI6MjA2NTc1ODU1OX0.90ihAk2geP1JoHIvMj_pxeoMe6dwRwH-rBbJwbFeomw";

async function testGoogleCredentials() {
  console.log('🔍 Testando configurações Google OAuth...');
  
  try {
    // 1. Verificar configurações do frontend
    console.log('\n1️⃣ Configurações do Frontend:');
    
    const frontendConfig = {
      clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
      redirectUri: 'http://localhost:8080/agendamentos',
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')
    };
    
    console.log('   📋 Client ID:', frontendConfig.clientId);
    console.log('   📋 Redirect URI:', frontendConfig.redirectUri);
    console.log('   📋 Scopes:', frontendConfig.scopes);
    
    // 2. Testar Edge Function
    console.log('\n2️⃣ Testando Edge Function...');
    
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/google-user-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        code: 'test-code',
        redirectUri: frontendConfig.redirectUri
      })
    });
    
    console.log('   📊 Status da Edge Function:', testResponse.status);
    
    if (testResponse.status === 500) {
      const errorData = await testResponse.text();
      console.log('   📋 Erro da Edge Function:', errorData);
      
      if (errorData.includes('Google OAuth credentials not configured')) {
        console.log('   ⚠️ Credenciais Google não configuradas na Edge Function');
        console.log('   📝 Execute: supabase secrets set GOOGLE_CLIENT_ID=seu_client_id');
        console.log('   📝 Execute: supabase secrets set GOOGLE_CLIENT_SECRET=seu_client_secret');
      } else if (errorData.includes('invalid_client')) {
        console.log('   ⚠️ Client ID ou Client Secret inválidos');
        console.log('   📝 Verifique as credenciais no Google Cloud Console');
      }
    } else if (testResponse.status === 200) {
      console.log('   ✅ Edge Function está funcionando');
    }
    
    // 3. Verificar URLs no Google Cloud Console
    console.log('\n3️⃣ URLs que devem estar configuradas no Google Cloud Console:');
    console.log('   🔗 http://localhost:8080/agendamentos');
    console.log('   🔗 https://atendeai.lify.com.br/agendamentos');
    console.log('   🔗 https://atendeai-lify-admin.vercel.app/agendamentos');
    
    // 4. Verificar se o Client ID é válido
    console.log('\n4️⃣ Verificando Client ID...');
    
    const clientIdPattern = /^\d+-\w+\.apps\.googleusercontent\.com$/;
    if (clientIdPattern.test(frontendConfig.clientId)) {
      console.log('   ✅ Formato do Client ID é válido');
    } else {
      console.log('   ❌ Formato do Client ID é inválido');
    }
    
    // 5. Gerar URL de autorização para teste
    console.log('\n5️⃣ URL de autorização para teste:');
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', frontendConfig.clientId);
    authUrl.searchParams.set('redirect_uri', frontendConfig.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', frontendConfig.scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');
    
    console.log('   🔗 URL de teste:', authUrl.toString());
    
    // 6. Verificar se há problemas conhecidos
    console.log('\n6️⃣ Análise de problemas conhecidos:');
    
    const knownIssues = [
      {
        issue: 'Client ID não configurado na Edge Function',
        solution: 'Execute: supabase secrets set GOOGLE_CLIENT_ID=seu_client_id'
      },
      {
        issue: 'Client Secret não configurado na Edge Function',
        solution: 'Execute: supabase secrets set GOOGLE_CLIENT_SECRET=seu_client_secret'
      },
      {
        issue: 'URLs de redirecionamento não configuradas',
        solution: 'Adicione as URLs no Google Cloud Console > Credentials > OAuth 2.0 Client IDs'
      },
      {
        issue: 'Edge Function não deployada',
        solution: 'Execute: supabase functions deploy google-user-auth'
      }
    ];
    
    console.log('   📋 Problemas conhecidos e soluções:');
    knownIssues.forEach(({ issue, solution }, index) => {
      console.log(`      ${index + 1}. ${issue}`);
      console.log(`         💡 ${solution}`);
    });
    
    // 7. Recomendações
    console.log('\n7️⃣ Recomendações:');
    console.log('   📝 1. Verifique se as credenciais estão configuradas na Edge Function');
    console.log('   📝 2. Verifique se as URLs estão no Google Cloud Console');
    console.log('   📝 3. Faça deploy da Edge Function novamente');
    console.log('   📝 4. Teste a autenticação no localhost:8080/agendamentos');
    
    console.log('\n✅ Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
}

// Executar o script
testGoogleCredentials(); 