const fs = require('fs');
const path = require('path');

console.log('🧪 Testando detecção de ambiente...\n');

// Carregar configuração OAuth
const config = JSON.parse(fs.readFileSync('config/google-oauth2.json', 'utf8'));
const redirectUris = config.web.redirect_uris;

// Simular função selectRedirectUri do backend
function selectRedirectUri(redirect_uris, env = {}) {
  console.log('🔧 Simulando selectRedirectUri com ambiente:', env);
  
  if (!redirect_uris || redirect_uris.length === 0) {
    throw new Error('Nenhuma URL de redirecionamento configurada');
  }

  // Em produção Railway, usar a URL de produção
  if (env.RAILWAY_ENVIRONMENT === 'production' || env.NODE_ENV === 'production') {
    const prodUrl = redirect_uris.find(uri => uri.includes('atendeai.lify.com.br'));
    if (prodUrl) {
      console.log('✅ Produção detectada - usando:', prodUrl);
      return prodUrl;
    }
  }

  // Desenvolvimento: usar localhost
  const devUrl = redirect_uris.find(uri => uri.includes('localhost'));
  if (devUrl) {
    console.log('🔧 Desenvolvimento detectado - usando:', devUrl);
    return devUrl;
  }

  // Fallback: primeira URL disponível
  console.log('⚠️  Fallback - usando primeira URL:', redirect_uris[0]);
  return redirect_uris[0];
}

// Testar cenários
const testCases = [
  { 
    name: 'PRODUÇÃO RAILWAY (cenário real)', 
    env: { RAILWAY_ENVIRONMENT: 'production', NODE_ENV: 'production' } 
  },
  { 
    name: 'PRODUÇÃO NODE_ENV', 
    env: { NODE_ENV: 'production' } 
  },
  { 
    name: 'DESENVOLVIMENTO', 
    env: {} 
  },
  { 
    name: 'LOCAL EXPLÍCITO', 
    env: { NODE_ENV: 'development' } 
  }
];

console.log('📋 Testando diferentes cenários de ambiente:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`);
  try {
    const result = selectRedirectUri(redirectUris, testCase.env);
    const isCorrect = testCase.env.RAILWAY_ENVIRONMENT === 'production' || testCase.env.NODE_ENV === 'production' 
      ? result.includes('atendeai.lify.com.br')
      : result.includes('localhost');
    
    console.log(`   📍 URL selecionada: ${result}`);
    console.log(`   ${isCorrect ? '✅' : '❌'} Resultado: ${isCorrect ? 'CORRETO' : 'INCORRETO'}`);
  } catch (error) {
    console.log(`   ❌ Erro: ${error.message}`);
  }
  console.log('');
});

console.log('🎯 RESUMO DOS TESTES:');
console.log('✅ Em produção (RAILWAY_ENVIRONMENT=production): deve usar atendeai.lify.com.br');
console.log('✅ Em desenvolvimento: deve usar localhost:8080');
console.log('✅ Fallback: primeira URL da lista');
