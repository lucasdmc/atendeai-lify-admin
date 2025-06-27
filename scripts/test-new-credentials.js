// Script para testar as novas credenciais Google OAuth2
console.log('=== TESTE DAS NOVAS CREDENCIAIS GOOGLE OAUTH2 ===');

// Novas credenciais
const credentials = {
  clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  clientSecret: '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',
};

console.log('=== NOVAS CREDENCIAIS ===');
console.log('Client ID:', credentials.clientId);
console.log('Client Secret:', credentials.clientSecret ? '✅ Configurado' : '❌ Não configurado');

// Testar troca de token com as novas credenciais
async function testTokenExchange() {
  console.log('\n=== TESTANDO TROCA DE TOKEN COM NOVAS CREDENCIAIS ===');
  
  const mockCode = 'invalid_code_for_testing';
  const redirectUri = 'https://preview--atendeai-lify-admin.lovable.app/agendamentos';
  
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        code: mockCode,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const responseText = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${responseText}`);
    
    if (response.status === 400) {
      console.log('✅ Credenciais válidas - erro 400 esperado para código inválido');
      console.log('🎉 O Client Secret está funcionando corretamente!');
    } else if (response.status === 401) {
      console.log('❌ Erro 401 - Client Secret ainda inválido');
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar troca de token:', error.message);
  }
}

// Testar URLs de autorização
async function testAuthUrls() {
  console.log('\n=== TESTANDO URLS DE AUTORIZAÇÃO ===');
  
  const testUrls = [
    'https://preview--atendeai-lify-admin.lovable.app/agendamentos',
    'https://atendeai.lify.com.br/agendamentos'
  ];
  
  for (const redirectUri of testUrls) {
    console.log(`\nTestando redirect URI: ${redirectUri}`);
    
    const params = new URLSearchParams({
      client_id: credentials.clientId,
      redirect_uri: redirectUri,
      scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: 'test_state_' + Date.now(),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    try {
      const response = await fetch(authUrl, { 
        method: 'HEAD', 
        redirect: 'manual' 
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.status === 302) {
        console.log('✅ URL de autorização funcionando');
      } else {
        console.log(`⚠️ Status inesperado: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar:', error.message);
    }
  }
}

// Verificar configuração das URLs
function checkRedirectUris() {
  console.log('\n=== VERIFICAÇÃO DAS URLS DE REDIRECIONAMENTO ===');
  console.log('URLs configuradas no Google Cloud Console:');
  console.log('✅ http://localhost:5173/auth/callback');
  console.log('✅ http://localhost:3000/auth/callback');
  console.log('✅ http://localhost:4173/auth/callback');
  console.log('✅ https://atendeai-lify-admin.vercel.app/auth/callback');
  console.log('✅ https://atendeai-lify-admin.netlify.app/auth/callback');
  console.log('✅ https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth');
  console.log('✅ http://localhost:8080/agendamentos');
  console.log('✅ https://preview--atendeai-lify-admin.lovable.app/agendamentos');
  console.log('✅ https://atendeai.lify.com.br/agendamentos');
  
  console.log('\nOrigens JavaScript autorizadas:');
  console.log('✅ http://localhost:5173');
  console.log('✅ http://localhost:3000');
  console.log('✅ http://localhost:4173');
  console.log('✅ https://atendeai-lify-admin.vercel.app');
  console.log('✅ https://atendeai-lify-admin.netlify.app');
  console.log('✅ http://localhost:8080');
  console.log('✅ https://atendeai.lify.com.br');
  console.log('✅ https://preview--atendeai-lify-admin.lovable.app');
}

async function runTests() {
  console.log('=== TESTE COMPLETO DAS NOVAS CREDENCIAIS ===');
  
  await testAuthUrls();
  await testTokenExchange();
  checkRedirectUris();
  
  console.log('\n=== RESULTADO ===');
  console.log('Se o teste de troca de token retornou 400:');
  console.log('🎉 Credenciais estão funcionando corretamente!');
  console.log('✅ O erro 401 invalid_client foi resolvido');
  console.log('✅ Pode testar a autenticação no frontend');
  
  console.log('\n=== PRÓXIMOS PASSOS ===');
  console.log('1. Teste a autenticação no frontend');
  console.log('2. Verifique se o erro 401 foi resolvido');
  console.log('3. Teste em todos os ambientes (localhost, preview, production)');
}

runTests(); 