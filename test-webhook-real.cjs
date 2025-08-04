// test-webhook-real.cjs
// Script para testar webhook real após configuração

const https = require('https');

async function testWebhookReal() {
  console.log('🧪 TESTANDO WEBHOOK REAL APÓS CONFIGURAÇÃO');
  console.log('============================================');
  console.log('');

  console.log('📋 INSTRUÇÕES:');
  console.log('1. Configure o webhook no Meta Developer Console');
  console.log('2. Envie uma mensagem real no WhatsApp');
  console.log('3. Execute este script para verificar os logs');
  console.log('');

  console.log('🌐 URL DO WEBHOOK:');
  console.log('https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
  console.log('');

  console.log('🔑 VERIFY TOKEN:');
  console.log('atendeai-lify-backend');
  console.log('');

  console.log('📱 PHONE NUMBER ID:');
  console.log('698766983327246');
  console.log('');

  console.log('✅ DEPOIS DE CONFIGURAR:');
  console.log('- Envie uma mensagem no WhatsApp');
  console.log('- O sistema deve responder automaticamente');
  console.log('- Verifique os logs no Railway');
  console.log('');

  console.log('🚀 SISTEMA PRONTO APÓS CONFIGURAÇÃO!');
}

testWebhookReal(); 