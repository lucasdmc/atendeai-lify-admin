// Script para testar a detecção de ambiente em tempo real
console.log('=== TESTE DE DETECÇÃO DE AMBIENTE ===');

// Simular diferentes ambientes
const testEnvironments = [
  {
    name: 'Localhost',
    hostname: 'localhost:5173',
    expectedRedirect: 'http://localhost:5173/agendamentos'
  },
  {
    name: 'Preview',
    hostname: 'preview--atendeai-lify-admin.lovable.app',
    expectedRedirect: 'https://preview--atendeai-lify-admin.lovable.app/agendamentos'
  },
  {
    name: 'Production',
    hostname: 'atendeai.lify.com.br',
    expectedRedirect: 'https://atendeai.lify.com.br/agendamentos'
  }
];

// Função que simula a lógica do environment.ts
function getRedirectUri(hostname) {
  const protocol = hostname.includes('localhost') ? 'http:' : 'https:';
  const port = hostname.includes(':') ? hostname.split(':')[1] : '';
  const cleanHostname = hostname.split(':')[0];
  
  // Desenvolvimento local
  if (cleanHostname === 'localhost' || cleanHostname === '127.0.0.1') {
    return `${protocol}//${cleanHostname}${port ? `:${port}` : ''}/agendamentos`;
  }
  
  // Preview environment
  if (cleanHostname.includes('preview--atendeai-lify-admin.lovable.app')) {
    return 'https://preview--atendeai-lify-admin.lovable.app/agendamentos';
  }
  
  // Production environment
  if (cleanHostname.includes('atendeai.lify.com.br')) {
    return 'https://atendeai.lify.com.br/agendamentos';
  }
  
  // Fallback para desenvolvimento
  return `${protocol}//${cleanHostname}${port ? `:${port}` : ''}/agendamentos`;
}

// Função que simula a geração da URL de autorização
function generateAuthUrl(redirectUri) {
  const clientId = '367439444210-phr1e6oiu8hnh5vm57lpoud5lhrdda2o.apps.googleusercontent.com';
  const scopes = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
  
  const state = btoa(JSON.stringify({
    timestamp: Date.now(),
    origin: `https://${redirectUri.split('//')[1].split('/')[0]}`,
    path: '/agendamentos',
    redirectUri: redirectUri
  }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function testEnvironment(env) {
  console.log(`\n=== TESTANDO ${env.name} ===`);
  console.log(`Hostname: ${env.hostname}`);
  
  const redirectUri = getRedirectUri(env.hostname);
  console.log(`Redirect URI calculada: ${redirectUri}`);
  console.log(`Redirect URI esperada: ${env.expectedRedirect}`);
  
  if (redirectUri === env.expectedRedirect) {
    console.log('✅ Redirect URI está correta');
  } else {
    console.log('❌ Redirect URI está incorreta');
  }
  
  const authUrl = generateAuthUrl(redirectUri);
  console.log(`Auth URL gerada: ${authUrl.substring(0, 100)}...`);
  
  // Testar se a URL está acessível
  try {
    const response = await fetch(authUrl, { 
      method: 'HEAD', 
      redirect: 'manual' 
    });
    
    console.log(`Status da resposta: ${response.status}`);
    
    if (response.status === 302) {
      console.log('✅ URL de autorização está funcionando');
    } else if (response.status === 404) {
      console.log('❌ Erro 404 - URL não encontrada');
      console.log('🔍 Isso indica que a URL de redirecionamento não está configurada no Google Cloud Console');
    } else {
      console.log(`⚠️ Status inesperado: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao acessar URL:', error.message);
  }
}

async function runTests() {
  console.log('=== TESTE DE DETECÇÃO DE AMBIENTE ===');
  console.log('Este teste verifica se a detecção de ambiente está funcionando corretamente.');
  
  for (const env of testEnvironments) {
    await testEnvironment(env);
  }
  
  console.log('\n=== CONCLUSÃO ===');
  console.log('Se apenas localhost funciona:');
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