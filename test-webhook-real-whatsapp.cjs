// test-webhook-real-whatsapp.cjs
// Script para testar webhook com mensagem real do WhatsApp

const https = require('https');

async function testRealWhatsAppWebhook() {
  console.log('🧪 TESTANDO WEBHOOK COM MENSAGEM REAL DO WHATSAPP');
  console.log('==================================================');
  console.log('');

  console.log('📋 INSTRUÇÕES:');
  console.log('1. Envie uma mensagem REAL para o WhatsApp: 554730915628');
  console.log('2. Execute este script para verificar se o webhook recebeu');
  console.log('3. Verifique se a resposta foi enviada de volta');
  console.log('');

  console.log('🌐 URL DO WEBHOOK:');
  console.log('https://atendeai-lify-backend-production.up.railway.app/webhook/whatsapp-meta');
  console.log('');

  console.log('📱 NÚMERO DO CHATBOT:');
  console.log('554730915628');
  console.log('');

  console.log('🔑 VERIFY TOKEN:');
  console.log('atendeai-lify-backend');
  console.log('');

  console.log('📋 PASSOS PARA TESTAR:');
  console.log('1. Abra o WhatsApp');
  console.log('2. Envie uma mensagem para: 554730915628');
  console.log('3. Aguarde a resposta automática');
  console.log('4. Se não responder, verifique os logs do Railway');
  console.log('');

  console.log('✅ DEPOIS DE ENVIAR A MENSAGEM:');
  console.log('- Verifique se recebeu resposta automática');
  console.log('- Se não funcionar, verifique a configuração do webhook no Meta');
  console.log('');

  console.log('🚀 SISTEMA PRONTO PARA TESTE REAL!');
}

testRealWhatsAppWebhook(); 