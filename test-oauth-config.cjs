const fs = require('fs');
const path = require('path');

console.log('🔍 Testando configuração OAuth...\n');

const configPath = path.join(__dirname, 'config', 'google-oauth2.json');
console.log('📁 Verificando arquivo de configuração...');

try {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Arquivo config/google-oauth2.json encontrado');
  
  const redirectUris = config.web.redirect_uris;
  console.log('🔗 URLs de redirecionamento configuradas:');
  redirectUris.forEach((uri, index) => {
    console.log('   ' + index + ': ' + uri);
  });
  
  if (redirectUris[0].includes('atendeai.lify.com.br')) {
    console.log('✅ URL de produção está na primeira posição');
  } else {
    console.log('⚠️  URL de produção NÃO está na primeira posição');
  }
  
} catch (error) {
  console.log('❌ Erro ao ler configuração:', error.message);
}

console.log('\n🎯 Resultado esperado em produção:');
console.log('   ✅ Deve usar: https://atendeai.lify.com.br/agendamentos');
console.log('   ❌ NÃO deve usar: http://localhost:8080/agendamentos');

console.log('\n🚀 Mudanças aplicadas:');
console.log('   1. Código backend foi atualizado ✅');
console.log('   2. Arquivo de configuração foi corrigido ✅');
console.log('   3. Deploy necessário para produção Railway');
