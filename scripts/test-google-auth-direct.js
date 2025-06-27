// Script para testar diretamente a URL de autorização Google
console.log('=== TESTE DIRETO DA URL GOOGLE ===');

const environments = [
  {
    name: 'Preview',
    redirectUri: 'https://preview--atendeai-lify-admin.lovable.app/agendamentos'
  },
  {
    name: 'Production',
    redirectUri: 'https://atendeai.lify.com.br/agendamentos'
  }
];

function generateAuthUrl(redirectUri) {
  const config = {
    google: {
      clientId: '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com',
      scopes: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
    },
  };

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: redirectUri,
    scope: config.google.scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: 'test_state_' + Date.now(),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function testGoogleAuth(env) {
  console.log(`\n=== TESTANDO ${env.name} ===`);
  console.log(`Redirect URI: ${env.redirectUri}`);
  
  const authUrl = generateAuthUrl(env.redirectUri);
  console.log(`Auth URL: ${authUrl}`);
  
  try {
    // Teste 1: Verificar se a URL está acessível
    console.log('\n1. Testando acesso à URL...');
    const response = await fetch(authUrl, { 
      method: 'HEAD', 
      redirect: 'manual' 
    });
    
    console.log('Status da resposta:', response.status);
    console.log('Headers:', {
      'location': response.headers.get('location'),
      'content-type': response.headers.get('content-type')
    });
    
    if (response.status === 302) {
      console.log('✅ URL está funcionando (redirecionamento esperado)');
      console.log('Location:', response.headers.get('location'));
    } else if (response.status === 404) {
      console.log('❌ Erro 404 - URL não encontrada');
      console.log('🔍 Isso indica que a URL de redirecionamento não está configurada no Google Cloud Console');
    } else {
      console.log('⚠️ Status inesperado:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Erro ao acessar URL:', error.message);
  }
}

async function runTests() {
  console.log('=== TESTE DIRETO DA AUTENTICAÇÃO GOOGLE ===');
  console.log('Este teste verifica se as URLs de autorização Google estão funcionando.');
  
  for (const env of environments) {
    await testGoogleAuth(env);
  }
  
  console.log('\n=== CONCLUSÃO ===');
  console.log('Se ambas as URLs retornaram 404:');
  console.log('1. As URLs de redirecionamento não estão configuradas no Google Cloud Console');
  console.log('2. Ou há um problema de cache/propagação');
  console.log('3. Ou as URLs estão configuradas incorretamente');
  
  console.log('\n=== PRÓXIMOS PASSOS ===');
  console.log('1. Verifique se as URLs estão EXATAMENTE iguais no Google Cloud Console');
  console.log('2. Aguarde mais tempo para a propagação (pode levar até 30 minutos)');
  console.log('3. Teste em uma aba anônima do navegador');
  console.log('4. Verifique se não há múltiplas credenciais OAuth2');
}

runTests(); 