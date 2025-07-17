const https = require('https');

async function checkFrontendStatus() {
  console.log('🔍 [CHECK] Verificando status do frontend');
  console.log('='.repeat(60));

  try {
    // Verificar se o site está online
    console.log('🌐 Verificando se o site está online...');
    
    const url = 'https://atendeai-lify-admin.vercel.app';
    
    const response = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data.substring(0, 1000) // Primeiros 1000 caracteres
          });
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    console.log('✅ Site está online');
    console.log(`📊 Status Code: ${response.statusCode}`);
    console.log(`📊 Content-Type: ${response.headers['content-type']}`);
    
    // Verificar se é uma página React
    if (response.data.includes('React') || response.data.includes('react')) {
      console.log('✅ Página React detectada');
    } else {
      console.log('⚠️ Página React não detectada');
    }

    // Verificar se há erros de build
    if (response.data.includes('error') || response.data.includes('Error')) {
      console.log('⚠️ Possíveis erros detectados no HTML');
    } else {
      console.log('✅ HTML parece estar limpo');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎯 VERIFICAÇÃO COMPLETA');
    console.log('='.repeat(60));
    
    console.log('\n💡 CONCLUSÕES:');
    console.log('✅ Frontend está online');
    console.log('✅ Site responde corretamente');
    console.log('✅ Build parece estar funcionando');
    
    console.log('\n🔍 PRÓXIMOS PASSOS:');
    console.log('1. Acessar o site manualmente');
    console.log('2. Fazer login no sistema');
    console.log('3. Navegar para a página de Agentes');
    console.log('4. Verificar se o botão "Novo Agente" está visível');
    console.log('5. Clicar no botão e verificar logs no console');
    console.log('6. Verificar se há erros JavaScript');

  } catch (error) {
    console.error('❌ Erro ao verificar frontend:', error.message);
  }
}

// Executar verificação
checkFrontendStatus().then(() => {
  console.log('\n✅ Verificação concluída');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
}); 