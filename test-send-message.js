import axios from 'axios';

// Novo token do WhatsApp
const NEW_TOKEN = 'EAASAuWYr9JgBPPAwZC54E9ZCfrZCYHxbfZBgK4PqZAbTygxFquiqb6kqpnRf1hVddTcAX3p8acVXWiYhsujvChfpQ63JZCGNbBzg5H6WpZBXkGjIOaUSc5PuwGFLq0DGwwqpl0QDojthXNfNZBasULKZCfg2eHFah5KZCz0V46C9ckQ5Pcy14rZBZCcnsmq0u6p8bma6RdeWYUQGVazwtzxBmIgZCiSnOHundltZACmJRY4ZBCkgWqiAnteFGL9qV6kWAZDZD';
const PHONE_NUMBER_ID = '698766983327246';

async function testSendMessage() {
  console.log('📤 Testando envio de mensagem com novo token...');
  
  try {
    const messageResponse = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '5511999999999',
        type: 'text',
        text: {
          body: '🧪 Teste do novo token - Sistema funcionando! ✅'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${NEW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Mensagem enviada com sucesso!');
    console.log('📋 Resposta:', messageResponse.data);
    
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem:', error.response?.data || error.message);
  }
}

testSendMessage(); 