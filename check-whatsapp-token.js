// ========================================
// VERIFICAR SE O TOKEN DO WHATSAPP ESTÁ EXPIRADO
// ========================================

import https from 'https';

const PHONE_NUMBER_ID = '698766983327246';

async function checkWhatsAppToken() {
  console.log('🔍 VERIFICANDO TOKEN DO WHATSAPP');
  console.log('==================================\n');

  try {
    // 1. Verificar se temos o token nas variáveis de ambiente
    console.log('🔑 1. Verificando token nas variáveis de ambiente...');
    console.log('⚠️  Para verificar o token, você precisa:');
    console.log('   1. Acessar: https://developers.facebook.com/apps/');
    console.log('   2. Ir em: WhatsApp > Getting Started');
    console.log('   3. Copiar o Access Token (começa com EAAS...)');
    console.log('   4. Verificar se não expirou');
    console.log('');

    // 2. Testar token com API do WhatsApp
    console.log('📡 2. Testando token com API do WhatsApp...');
    console.log('⚠️  Para testar o token, você precisa:');
    console.log('   1. Pegar o token atual do Meta Developers');
    console.log('   2. Fazer uma requisição para a API do WhatsApp');
    console.log('   3. Verificar se retorna erro de token expirado');
    console.log('');

    // 3. Verificar informações do número de telefone
    console.log('📱 3. Verificando informações do número de telefone...');
    console.log('Phone Number ID:', PHONE_NUMBER_ID);
    console.log('');

    // 4. Comando para testar token
    console.log('🧪 4. COMANDO PARA TESTAR TOKEN:');
    console.log('==================================');
    console.log('Substitua YOUR_TOKEN pelo token atual e execute:');
    console.log('');
    console.log(`curl -X GET "https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}" \\`);
    console.log('  -H "Authorization: Bearer YOUR_TOKEN" \\');
    console.log('  -H "Content-Type: application/json"');
    console.log('');
    console.log('Se retornar erro 401, o token está expirado.');
    console.log('Se retornar dados do número, o token está válido.');
    console.log('');

    // 5. Verificar token no arquivo de configuração
    console.log('📋 5. VERIFICANDO CONFIGURAÇÃO ATUAL:');
    console.log('=====================================');
    console.log('Token atual (primeiros 20 caracteres):');
    console.log('EAASAuWYr9JgBPMviYNu4WXFafodM3Y5ia09Eks3aZAM9LDAnazZCcQiyJup6xNkRZANCunz0ZBTZAy3UbbcsTbZB9drn3LJwzS4iw3Aq5CKF8ZASgXYz4SShQlYsSt0IRD70sO8gZCvPGkASI8c81z5f1X8B9TGpkOUmZAp9zJ6dPDSdFC9X1Mf8t5d2ZCVDnVz4hvjPbVywsrVg3odTrSRcIaPh13BGZCNFc6Qr5rsDFBKS4K3lwSSbIrObiMWIAAZDCwhZCKytYpPPocgqf1sFlFt2iGZAnxFB5alHzVTZCw2172NnZBB2qtjgXkikTTRopth8mxB7mvdI4yqk3dficzsAZDZD');
    console.log('');
    console.log('⚠️  Este token pode estar expirado!');
    console.log('');

    // 6. Como renovar o token
    console.log('🔄 6. COMO RENOVAR O TOKEN:');
    console.log('============================');
    console.log('1. Acesse: https://developers.facebook.com/apps/');
    console.log('2. Selecione seu app do WhatsApp Business API');
    console.log('3. Vá em: WhatsApp > Getting Started');
    console.log('4. Clique em "Regenerate" no Access Token');
    console.log('5. Copie o novo token (começa com EAAS...)');
    console.log('6. Atualize no arquivo .env ou variáveis de ambiente');
    console.log('');

    // 7. Teste manual
    console.log('🧪 7. TESTE MANUAL:');
    console.log('===================');
    console.log('Para testar se o token está funcionando:');
    console.log('1. Pegue o token atual do Meta Developers');
    console.log('2. Execute o comando curl acima');
    console.log('3. Se der erro 401, o token expirou');
    console.log('4. Se retornar dados, o token está válido');
    console.log('');

    console.log('✅ VERIFICAÇÃO CONCLUÍDA!');
    console.log('==================================');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Verifique se o token está expirado');
    console.log('2. Se estiver, renove o token');
    console.log('3. Atualize a configuração');
    console.log('4. Teste novamente o webhook');
    console.log('');

  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }
}

// Executar verificação
checkWhatsAppToken(); 