// Script para simular exatamente o que acontece no navegador
console.log('=== SIMULAÇÃO DO NAVEGADOR ===');

const environments = [
  {
    name: 'Localhost',
    origin: 'http://localhost:5173',
    redirectUri: 'http://localhost:5173/agendamentos'
  },
  {
    name: 'Preview',
    origin: 'https://preview--atendeai-lify-admin.lovable.app',
    redirectUri: 'https://preview--atendeai-lify-admin.lovable.app/agendamentos'
  },
  {
    name: 'Production',
    origin: 'https://atendeai.lify.com.br',
    redirectUri: 'https://atendeai.lify.com.br/agendamentos'
  }
];

async function simulateBrowser(env) {
  console.log(`\n=== SIMULANDO ${env.name} ===`);
  console.log(`Origin: ${env.origin}`);
  console.log(`Redirect URI: ${env.redirectUri}`);
  
  // Simular a geração da URL de autorização como no navegador
  const clientId = '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com';
  const scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
  
  const state = btoa(JSON.stringify({
    timestamp: Date.now(),
    origin: env.origin,
    path: '/agendamentos',
    redirectUri: env.redirectUri
  }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: env.redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  console.log(`Auth URL: ${authUrl.substring(0, 150)}...`);
  
  // Teste 1: Verificar se a URL está acessível
  try {
    console.log('\n1. Testando acesso à URL de autorização...');
    const response = await fetch(authUrl, { 
      method: 'HEAD', 
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Location: ${response.headers.get('location') ? 'Sim' : 'Não'}`);
    
    if (response.status === 302) {
      console.log('✅ URL de autorização está funcionando');
    } else if (response.status === 404) {
      console.log('❌ Erro 404 - URL não encontrada');
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao acessar URL:', error.message);
  }
  
  // Teste 2: Simular o redirecionamento que acontece após autorização
  console.log('\n2. Simulando redirecionamento após autorização...');
  const mockCode = 'mock_auth_code_123';
  const mockState = state;
  
  const redirectUrl = `${env.redirectUri}?code=${mockCode}&state=${mockState}`;
  console.log(`URL de redirecionamento: ${redirectUrl}`);
  
  // Teste 3: Verificar se a página de redirecionamento está acessível
  try {
    console.log('\n3. Testando página de redirecionamento...');
    const pageResponse = await fetch(env.redirectUri, { 
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log(`Status da página: ${pageResponse.status}`);
    console.log(`Content-Type: ${pageResponse.headers.get('content-type')}`);
    
    if (pageResponse.status === 200) {
      console.log('✅ Página de redirecionamento está acessível');
    } else {
      console.log(`⚠️ Status inesperado da página: ${pageResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao acessar página:', error.message);
  }
}

async function runSimulation() {
  console.log('=== SIMULAÇÃO COMPLETA DO NAVEGADOR ===');
  console.log('Este teste simula exatamente o que acontece no navegador.');
  
  for (const env of environments) {
    await simulateBrowser(env);
  }
  
  console.log('\n=== ANÁLISE ===');
  console.log('Se todas as URLs retornam 302 mas o navegador mostra 404:');
  console.log('1. Pode ser um problema de cache do navegador');
  console.log('2. Pode ser um problema de CORS no frontend');
  console.log('3. Pode ser um problema de JavaScript no frontend');
  console.log('4. Pode ser um problema de variáveis de ambiente não carregadas');
  
  console.log('\n=== PRÓXIMOS PASSOS ===');
  console.log('1. Limpe o cache do navegador (Ctrl+Shift+R)');
  console.log('2. Teste em uma aba anônima');
  console.log('3. Verifique o console do navegador para erros JavaScript');
  console.log('4. Verifique se as variáveis de ambiente estão sendo carregadas');
}

runSimulation(); 