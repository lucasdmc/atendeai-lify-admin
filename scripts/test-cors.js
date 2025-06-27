// Script para testar problemas de CORS
console.log('=== TESTE DE CORS ===');

const environments = [
  {
    name: 'Preview',
    url: 'https://preview--atendeai-lify-admin.lovable.app/agendamentos',
    origin: 'https://preview--atendeai-lify-admin.lovable.app'
  },
  {
    name: 'Production',
    url: 'https://atendeai.lify.com.br/agendamentos',
    origin: 'https://atendeai.lify.com.br'
  }
];

async function testCORS(env) {
  console.log(`\n=== TESTANDO CORS - ${env.name} ===`);
  
  try {
    // Teste 1: Verificar se a página carrega
    console.log('1. Testando carregamento da página...');
    const pageResponse = await fetch(env.url, { 
      method: 'GET',
      mode: 'cors'
    });
    
    console.log('Status da página:', pageResponse.status);
    console.log('Headers da página:', Object.fromEntries(pageResponse.headers.entries()));
    
    // Teste 2: Verificar preflight OPTIONS
    console.log('\n2. Testando preflight OPTIONS...');
    const optionsResponse = await fetch(env.url, {
      method: 'OPTIONS',
      headers: {
        'Origin': env.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization, content-type'
      }
    });
    
    console.log('Status OPTIONS:', optionsResponse.status);
    console.log('CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
    });
    
    // Teste 3: Verificar se há problemas com a função Supabase
    console.log('\n3. Testando função Supabase...');
    const supabaseUrl = 'https://niakqdolcdwxtrkbqmdi.supabase.co/functions/v1/google-user-auth';
    const supabaseResponse = await fetch(supabaseUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': env.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type'
      }
    });
    
    console.log('Status Supabase OPTIONS:', supabaseResponse.status);
    console.log('Supabase CORS Headers:', {
      'Access-Control-Allow-Origin': supabaseResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': supabaseResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': supabaseResponse.headers.get('Access-Control-Allow-Headers')
    });
    
  } catch (error) {
    console.error(`❌ Erro no teste ${env.name}:`, error.message);
    
    if (error.message.includes('CORS')) {
      console.log('🔍 ERRO DE CORS DETECTADO!');
      console.log('Isso indica que o servidor não está permitindo requisições do domínio atual.');
    }
  }
}

async function runCORSTests() {
  console.log('=== DIAGNÓSTICO DE CORS ===');
  console.log('Este teste verifica se há problemas de CORS que podem estar causando o erro 404.');
  
  for (const env of environments) {
    await testCORS(env);
  }
  
  console.log('\n=== INTERPRETAÇÃO DOS RESULTADOS ===');
  console.log('✅ Status 200: Sem problemas de CORS');
  console.log('❌ Status 404: Página não encontrada (não é CORS)');
  console.log('❌ Status 403: Acesso negado (pode ser CORS)');
  console.log('❌ Erro de rede: Problema de conectividade');
  console.log('❌ Erro CORS: Servidor não permite requisições do domínio');
}

runCORSTests(); 