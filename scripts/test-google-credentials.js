// Script para testar as credenciais Google OAuth2
console.log('=== TESTE DE CREDENCIAIS GOOGLE OAUTH2 ===');

// Simular as variáveis de ambiente
const credentials = {
  clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
  clientSecret: 'GOCSPX-...', // Será undefined se não estiver configurado
};

console.log('=== CREDENCIAIS ===');
console.log('Client ID:', credentials.clientId);
console.log('Client Secret:', credentials.clientSecret ? '✅ Configurado' : '❌ Não configurado');

// Testar se o Client ID é válido
async function testClientId() {
  console.log('\n=== TESTANDO CLIENT ID ===');
  
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
        console.log('✅ Client ID válido - redirecionamento esperado');
      } else if (response.status === 400) {
        console.log('❌ Client ID inválido ou URL de redirecionamento não configurada');
      } else if (response.status === 401) {
        console.log('❌ Erro 401 - Client ID inválido ou credenciais incorretas');
      } else {
        console.log(`⚠️ Status inesperado: ${response.status}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao testar:', error.message);
    }
  }
}

// Testar troca de código por token (simulação)
async function testTokenExchange() {
  console.log('\n=== TESTANDO TROCA DE TOKEN ===');
  
  if (!credentials.clientSecret) {
    console.log('❌ Client Secret não configurado - não é possível testar troca de token');
    return;
  }
  
  // Simular uma troca de token com código inválido
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
    } else if (response.status === 401) {
      console.log('❌ Erro 401 - Client Secret inválido');
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao testar troca de token:', error.message);
  }
}

// Verificar configuração no Google Cloud Console
function checkGoogleCloudConfig() {
  console.log('\n=== VERIFICAÇÃO DE CONFIGURAÇÃO ===');
  console.log('Para resolver erro 401 invalid_client, verifique:');
  console.log('');
  console.log('1. Google Cloud Console > APIs & Services > Credentials');
  console.log('2. Verifique se o OAuth 2.0 Client ID está ativo');
  console.log('3. Verifique se as URLs de redirecionamento estão configuradas:');
  console.log('   - https://preview--atendeai-lify-admin.lovable.app/agendamentos');
  console.log('   - https://atendeai.lify.com.br/agendamentos');
  console.log('4. Verifique se as origens JavaScript autorizadas estão configuradas:');
  console.log('   - https://preview--atendeai-lify-admin.lovable.app');
  console.log('   - https://atendeai.lify.com.br');
  console.log('5. Verifique se o Client Secret está correto');
  console.log('6. Verifique se a API Google Calendar está habilitada');
}

async function runTests() {
  console.log('=== DIAGNÓSTICO DE CREDENCIAIS GOOGLE OAUTH2 ===');
  
  await testClientId();
  await testTokenExchange();
  checkGoogleCloudConfig();
  
  console.log('\n=== PRÓXIMOS PASSOS ===');
  console.log('1. Verifique a configuração no Google Cloud Console');
  console.log('2. Verifique se as variáveis de ambiente estão corretas');
  console.log('3. Faça novo deploy das Edge Functions se necessário');
  console.log('4. Teste novamente após as correções');
}

runTests(); 